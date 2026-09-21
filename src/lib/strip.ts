import { log } from './log'
import { getVideosInDirectory, stripVideoMetadata, videoHasMetadata } from './utilities/video'

export type StripOptions = {
	dryRun?: boolean
}

/**
 * Strip metadata from video files in a directory
 *
 * @returns List of file paths with metadata that were stripped
 */
export async function stripVideoMetadataInDirectory(
	directory: string,
	options: StripOptions = {},
): Promise<string[]> {
	const files = await getVideosInDirectory(directory)
	return stripVideoMetadataInFiles(files, options)
}

/**
 * Strip metadata from multiple video files
 *
 * @returns List of file paths with metadata that were stripped
 */
async function stripVideoMetadataInFiles(
	files: string[],
	options: StripOptions = {},
): Promise<string[]> {
	const { dryRun = false } = options

	const localVideosWithMetadata = []
	for (const videoFile of files) {
		if (await videoHasMetadata(videoFile)) {
			localVideosWithMetadata.push(videoFile)
		}
	}

	if (!dryRun) {
		log.debug(`Found ${localVideosWithMetadata.length} videos with metadata to strip`)
		for (const videoFile of localVideosWithMetadata) {
			log.debug(`Stripping metadata from: ${videoFile}`)
			await stripVideoMetadata(videoFile)
		}
	}

	return localVideosWithMetadata
}
