import log from './utilities/log'
import { hasMetadata, stripMetadataFromFile } from './utilities/video-metadata'
import { BunnyCdnStream } from 'bunnycdn-stream'
import fs from 'fs-extra'
import { hash } from 'hasha'
import { createReadStream } from 'node:fs'
import path from 'node:path'

const vidupStateFileName = '.vidup-state.json'

// TODO key state to service
// type SyncState = {
// 	['bunny']: VideoState[]
// }

type SyncState = VideoState[]

type VideoState = {
	filename: string
	localHash: string
	remoteHash?: string
}

export type SyncOptions = {
	credentials: {
		key: string
		library: string
	}
	directory: string
	dryRun: boolean
	service: 'bunny'
	// Service: 'bunny' | 'cloudflare' | 'mux'
	stripMetadata?: boolean
	verbose: boolean
}

export type StripOptions = {
	directory: string
	dryRun: boolean
	verbose: boolean
}

export type SyncReport = SyncReportEntry[]

export type SyncReportEntry = {
	action: 'Create' | 'Delete' | 'Unchanged' | 'Update'
	localFile?: string
	remoteId: string
	stripMetadata: boolean
}

async function getLocalFileList(directory: string): Promise<string[]> {
	// Get local file list
	const files = await fs.readdir(directory)
	const videoFiles = files
		.filter((file) => {
			const fileExtension = path.extname(file)
			const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv']
			return videoExtensions.includes(fileExtension)
		})
		.map((file) => path.join(directory, file))
	return videoFiles
}

/**
 * Strip metadata from all video files in a directory
 * @returns List of file paths with metadata that were stripped
 */
export async function stripMetadata(options: StripOptions): Promise<string[]> {
	const initialVerbosity = log.verbose
	log.verbose = options.verbose

	const videoFiles = await getLocalFileList(options.directory)
	const localVideosWithMetadata = videoFiles.filter(async (videoFile) => hasMetadata(videoFile))

	if (!options.dryRun) {
		log.info(`Found ${localVideosWithMetadata.length} videos with metadata to strip`)
		for (const videoFile of localVideosWithMetadata) {
			console.log(`Stripping metadata from: ${videoFile}`)
			await stripMetadataFromFile(videoFile)
		}
	}

	log.verbose = initialVerbosity
	return localVideosWithMetadata
}

/**
 * Synchronize a remote streaming service to mirror the contents of a local directory
 * @returns Array of sync report entries describing what was changed (or will change if a dry run)
 */
// eslint-disable-next-line complexity
export async function sync(options: SyncOptions): Promise<SyncReport> {
	const initialVerbosity = log.verbose
	log.verbose = options.verbose

	const syncReport: SyncReport = []

	const videoFiles = await getLocalFileList(options.directory)

	log.info(`Found ${videoFiles.length} video files in directory "${options.directory}"`)

	// Strip metadata if needed
	const localVideosWithMetadata = await stripMetadata({
		directory: options.directory,
		dryRun: options.dryRun,
		verbose: options.verbose,
	})

	// Create a state file if it doesn't exist
	const stateFile = path.join(options.directory, vidupStateFileName)
	await fs.ensureFile(stateFile)
	let state = ((await fs.readJson(stateFile, { throws: false })) ?? []) as SyncState

	// Remove state entries for files that no longer exist
	state = state.filter((entry) => videoFiles.includes(path.join(options.directory, entry.filename)))

	// Add state entries for new files
	for (const videoFile of videoFiles) {
		const filename = path.basename(videoFile)
		// Insecure hash, but only used for diffing
		const localHash = await hash(videoFile, { algorithm: 'sha1' })
		const existingEntry = state.find((entry) => entry.filename === filename)

		if (existingEntry) {
			existingEntry.localHash = localHash
		} else {
			state.push({ filename, localHash })
		}
	}

	if (!options.dryRun) {
		await fs.writeJson(stateFile, state, { spaces: 2 })
	}

	// Get remote files and figure out the sync plan
	const stream = new BunnyCdnStream({
		apiKey: options.credentials.key,
		videoLibrary: options.credentials.library,
	})
	const remoteVideos = await stream.listAllVideos()

	log.info(
		`Found ${remoteVideos.length} video files on ${options.service} remote streaming service`,
	)

	const remoteVideosInGoodStanding = remoteVideos.filter((video) => {
		const entry = state.find((entry) => entry.filename === video.title)
		return entry !== undefined && entry.localHash === entry.remoteHash
	})

	for (const video of remoteVideosInGoodStanding) {
		syncReport.push({
			action: 'Unchanged',
			localFile: video.title,
			remoteId: video.guid,
			stripMetadata: localVideosWithMetadata.includes(video.title),
		})
	}

	const remoteVideosToCreate = state.filter(
		(entry) => !remoteVideos.some((video) => video.title === entry.filename),
	)

	// Sync report will be updated with GUIDs after upload
	for (const video of remoteVideosToCreate) {
		syncReport.push({
			action: 'Create',
			localFile: video.filename,
			remoteId: 'Not yet uploaded (Dry run)',
			stripMetadata: localVideosWithMetadata.includes(video.filename),
		})
	}

	const remoteVideosToUpdate = remoteVideos.filter((video) => {
		const entry = state.find((entry) => entry.filename === video.title)
		return entry !== undefined && entry.localHash !== entry.remoteHash
	})

	// Sync report will be updated with GUIDs after upload
	for (const video of remoteVideosToUpdate) {
		syncReport.push({
			action: 'Update',
			localFile: video.title,
			remoteId: 'Not yet uploaded (Dry run)',
			stripMetadata: localVideosWithMetadata.includes(video.title),
		})
	}

	const remoteVideosToDelete = remoteVideos.filter(
		(video) => !state.some((entry) => entry.filename === video.title),
	)

	for (const video of remoteVideosToDelete) {
		syncReport.push({
			action: 'Delete',
			localFile: video.title,
			remoteId: video.guid,
			stripMetadata: localVideosWithMetadata.includes(video.title),
		})
	}

	if (!options.dryRun) {
		log.info(`Synchronizing...`)
		// Create / Upload
		for (const [index, localVideo] of remoteVideosToCreate.entries()) {
			if (index === 0) log.info(`Uploading ${remoteVideosToCreate.length} new local videos...`)

			const videoFile = createReadStream(path.join(options.directory, localVideo.filename))
			const response = await log.infoSpin(
				stream.createAndUploadVideo(videoFile, { title: localVideo.filename }),
				`Uploading new video ${index + 1}/${remoteVideosToCreate.length}: ${localVideo.filename}`,
			)

			log.info(
				`Remote video ${index + 1}/${remoteVideosToCreate.length} created with GUID: ${response.guid}`,
			)

			const stateEntry = state.find((entry) => entry.filename === localVideo.filename)
			if (stateEntry === undefined) {
				throw new Error(`Failed to find state entry for: ${localVideo.filename}`)
			}

			stateEntry.remoteHash = localVideo.localHash
			await fs.writeJSON(stateFile, state, { spaces: 2 })

			const reportEntry = syncReport.find((entry) => entry.localFile === localVideo.filename)
			if (reportEntry === undefined) {
				throw new Error(`Failed to find report entry for: ${localVideo.filename}`)
			}

			reportEntry.remoteId = response.guid
		}

		// Update / Upload
		// Bunny doesn't actually support "update", so we have to delete and re-upload
		// Note that this will change the GUID of the video!
		for (const [index, remoteVideo] of remoteVideosToUpdate.entries()) {
			if (index === 0) {
				log.info(`Updating ${remoteVideosToUpdate.length} remote videos...`)
				log.warn(
					"Bunny does not currently support updating videos in-place, so vidup will delete and re-uploading instead... this will change the video's GUID!",
				)
			}

			const localVideo = state.find((entry) => entry.filename === remoteVideo.title)
			if (localVideo === undefined) {
				throw new Error(`Failed to find state entry for: ${remoteVideo.title}`)
			}

			const deleteResponse = await stream.deleteVideo(remoteVideo.guid)
			if (!deleteResponse.success) {
				throw new Error(`Failed to delete remote video before updating: ${remoteVideo.title}`)
			}

			const videoFile = createReadStream(path.join(options.directory, localVideo.filename))
			const createResponse = await log.infoSpin(
				stream.createAndUploadVideo(videoFile, { title: localVideo.filename }),
				`Updating remote video ${index + 1}/${remoteVideosToUpdate.length}: ${remoteVideo.title}`,
			)

			log.info(
				`Updated remote video ${index + 1}/${remoteVideosToUpdate.length} created with GUID: ${createResponse.guid}`,
			)

			localVideo.remoteHash = localVideo.localHash
			await fs.writeJSON(stateFile, state, { spaces: 2 })

			const reportEntry = syncReport.find((entry) => entry.localFile === localVideo.filename)
			if (reportEntry === undefined) {
				throw new Error(`Failed to find report entry for: ${localVideo.filename}`)
			}

			reportEntry.remoteId = createResponse.guid
		}

		// Delete remote
		for (const [index, remoteVideo] of remoteVideosToDelete.entries()) {
			if (index === 0) log.info(`Deleting ${remoteVideosToDelete.length} remote videos...`)
			const deleteResponse = await log.infoSpin(
				stream.deleteVideo(remoteVideo.guid),
				`Deleting remote video ${index + 1}/${remoteVideosToDelete.length}: ${remoteVideo.title}`,
			)
			if (!deleteResponse.success) {
				throw new Error(`Failed to delete remote video: ${remoteVideo.title}`)
			}
		}

		log.info(`All ${videoFiles.length} videos are now in sync!`)
	}

	log.verbose = initialVerbosity
	return syncReport
}
