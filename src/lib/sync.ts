/* eslint-disable @typescript-eslint/ban-types */
import log from './utilities/log'
import { getVideosInDirectory } from './utilities/video'
import { BunnyCdnStream } from 'bunnycdn-stream'
import { hash } from 'hasha'
import { JSONFilePreset as lowdb } from 'lowdb/node'
import { createReadStream } from 'node:fs'
import path from 'node:path'

export type Service = 'bunny' | 'cloudflare' | 'mux'

type State = {
	lastRun?: Date
	lastUpdate?: Date
	syncState: Array<{
		filename: string
		localHash: string
		remoteHash: {
			[K in Service]?: null | string
		}
	}>
}

export type SyncReport = Array<{
	action: 'Create' | 'Delete' | 'None' | 'Update'
	localFile?: string
	remoteId: string
	stripMetadata?: boolean
}>

export type SyncOptions = {
	credentials: {
		key: string
		library: string
	}
	dryRun?: boolean
	service: Service
	verbose?: boolean
}

/**
 * Synchronize a remote streaming service to mirror the contents of a local directory
 * @returns Array of sync report entries describing what was changed (or will change if a dry run)
 */
// eslint-disable-next-line complexity
export async function syncVideoInDirectory(
	directory: string,
	options: SyncOptions,
): Promise<SyncReport> {
	const { credentials, dryRun = false, service, verbose = false } = options

	const initialVerbosity = log.verbose
	log.verbose = verbose

	const syncReport: SyncReport = []
	const videoFiles = await getVideosInDirectory(directory)

	log.info(`Found ${videoFiles.length} video files in directory "${directory}"`)

	// Create a state file if it doesn't exist
	const state = await lowdb<State>(path.join(directory, '.vidup-state.json'), {
		syncState: [],
	})

	// Remove state entries for files that no longer exist
	state.data.syncState = state.data.syncState.filter((entry) =>
		videoFiles.includes(path.join(directory, entry.filename)),
	)

	// Add state entries for new files
	for (const videoFile of videoFiles) {
		const filename = path.basename(videoFile)
		// Insecure hash, but only used for diffing
		const localHash = await hash(videoFile, { algorithm: 'sha1' })
		const existingEntry = state.data.syncState.find((entry) => entry.filename === filename)

		if (existingEntry) {
			existingEntry.localHash = localHash
		} else {
			state.data.syncState.push({ filename, localHash, remoteHash: {} })
		}
	}

	if (!dryRun) {
		await state.write()
	}

	// Get remote files and figure out the sync plan

	if (service !== 'bunny') {
		throw new Error(`Streaming service not yet implemented: ${service}`)
	}

	const stream = new BunnyCdnStream({
		apiKey: credentials.key,
		videoLibrary: credentials.library,
	})
	const remoteVideos = await stream.listAllVideos()

	log.info(`Found ${remoteVideos.length} video files on ${service} remote streaming service`)

	const remoteVideosInGoodStanding = remoteVideos.filter((video) => {
		const entry = state.data.syncState.find((entry) => entry.filename === video.title)
		return entry !== undefined && entry.localHash === entry.remoteHash[service]
	})

	for (const video of remoteVideosInGoodStanding) {
		syncReport.push({
			action: 'None',
			localFile: video.title,
			remoteId: video.guid,
		})
	}

	const remoteVideosToCreate = state.data.syncState.filter(
		(entry) => !remoteVideos.some((video) => video.title === entry.filename),
	)

	// Sync report will be updated with GUIDs after upload
	for (const video of remoteVideosToCreate) {
		syncReport.push({
			action: 'Create',
			localFile: video.filename,
			remoteId: 'Not yet uploaded (Dry run)',
		})
	}

	const remoteVideosToUpdate = remoteVideos.filter((video) => {
		const entry = state.data.syncState.find((entry) => entry.filename === video.title)
		return entry !== undefined && entry.localHash !== entry.remoteHash[service]
	})

	// Sync report will be updated with GUIDs after upload
	for (const video of remoteVideosToUpdate) {
		syncReport.push({
			action: 'Update',
			localFile: video.title,
			remoteId: 'Not yet uploaded (Dry run)',
		})
	}

	const remoteVideosToDelete = remoteVideos.filter(
		(video) => !state.data.syncState.some((entry) => entry.filename === video.title),
	)

	for (const video of remoteVideosToDelete) {
		syncReport.push({
			action: 'Delete',
			localFile: video.title,
			remoteId: video.guid,
		})
	}

	if (!dryRun) {
		state.data.lastRun = new Date()
		await state.write()

		log.info(`Synchronizing...`)
		// Delete remote
		// Fastest, do this first
		for (const [index, remoteVideo] of remoteVideosToDelete.entries()) {
			if (index === 0) log.info(`Deleting ${remoteVideosToDelete.length} remote videos...`)
			const deleteResponse = await log.infoSpin(
				stream.deleteVideo(remoteVideo.guid),
				`Deleting remote video ${index + 1}/${remoteVideosToDelete.length}: ${remoteVideo.title}`,
			)

			if (!deleteResponse.success) {
				throw new Error(`Failed to delete remote video: ${remoteVideo.title}`)
			}

			state.data.lastUpdate = new Date()
			await state.write()
		}

		// Create / Upload
		// New data, do this second
		for (const [index, localVideo] of remoteVideosToCreate.entries()) {
			if (index === 0) log.info(`Uploading ${remoteVideosToCreate.length} new local videos...`)

			const videoFile = createReadStream(path.join(directory, localVideo.filename))
			const response = await log.infoSpin(
				stream.createAndUploadVideo(videoFile, { title: localVideo.filename }),
				`Uploading new video ${index + 1}/${remoteVideosToCreate.length}: ${localVideo.filename}`,
			)

			log.info(
				`Remote video ${index + 1}/${remoteVideosToCreate.length} created with GUID: ${response.guid}`,
			)

			const stateEntry = state.data.syncState.find(
				(entry) => entry.filename === localVideo.filename,
			)
			if (stateEntry === undefined) {
				throw new Error(`Failed to find state entry for: ${localVideo.filename}`)
			}

			stateEntry.remoteHash[service] = localVideo.localHash
			state.data.lastUpdate = new Date()
			await state.write()

			const reportEntry = syncReport.find((entry) => entry.localFile === localVideo.filename)
			if (reportEntry === undefined) {
				throw new Error(`Failed to find report entry for: ${localVideo.filename}`)
			}

			reportEntry.remoteId = response.guid
		}

		// Update / Upload
		// "Backup" data already exists, do this last
		// Bunny doesn't actually support "update", so we have to delete and re-upload
		// Note that this will change the GUID of the video!
		for (const [index, remoteVideo] of remoteVideosToUpdate.entries()) {
			if (index === 0) {
				log.info(`Updating ${remoteVideosToUpdate.length} remote videos...`)
				log.warn(
					"Bunny does not currently support updating videos in-place, so vidup will delete and re-uploading instead... this will change the video's GUID!",
				)
			}

			const stateEntry = state.data.syncState.find((entry) => entry.filename === remoteVideo.title)
			if (stateEntry === undefined) {
				throw new Error(`Failed to find state entry for: ${remoteVideo.title}`)
			}

			const deleteResponse = await stream.deleteVideo(remoteVideo.guid)
			if (!deleteResponse.success) {
				throw new Error(`Failed to delete remote video before updating: ${remoteVideo.title}`)
			}

			const videoFile = createReadStream(path.join(directory, stateEntry.filename))
			const createResponse = await log.infoSpin(
				stream.createAndUploadVideo(videoFile, { title: stateEntry.filename }),
				`Updating remote video ${index + 1}/${remoteVideosToUpdate.length}: ${remoteVideo.title}`,
			)

			log.info(
				`Updated remote video ${index + 1}/${remoteVideosToUpdate.length} created with GUID: ${createResponse.guid}`,
			)

			stateEntry.remoteHash[service] = stateEntry.localHash
			state.data.lastUpdate = new Date()
			await state.write()

			const reportEntry = syncReport.find((entry) => entry.localFile === stateEntry.filename)
			if (reportEntry === undefined) {
				throw new Error(`Failed to find report entry for: ${stateEntry.filename}`)
			}

			reportEntry.remoteId = createResponse.guid
		}

		log.info(`All ${videoFiles.length} videos are now in sync!`)
	}

	log.verbose = initialVerbosity
	return syncReport
}
