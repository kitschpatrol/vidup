import log from './utilities/log'
import { getVideosInDirectory, stripVideoMetadata, videoHasMetadata } from './utilities/video'

export type StripOptions = {
	dryRun?: boolean
	verbose?: boolean
}

/**
 * Strip metadata from video files in a directory
 * @returns List of file paths with metadata that were stripped
 */
export async function stripVideoMetadataInDirectory(
	directory: string,
	options: StripOptions = {},
): Promise<string[]> {
	const { dryRun = false, verbose = false } = options

	const files = await getVideosInDirectory(directory)

	return stripVideoMetadataInFiles(files, {
		dryRun,
		verbose,
	})
}

/**
 * Strip metadata from multiple video files
 * @returns List of file paths with metadata that were stripped
 */
async function stripVideoMetadataInFiles(
	files: string[],
	options: StripOptions = {},
): Promise<string[]> {
	const { dryRun = false, verbose = false } = options

	const initialVerbosity = log.verbose
	log.verbose = verbose

	const localVideosWithMetadata = []
	for (const videoFile of files) {
		if (await videoHasMetadata(videoFile)) {
			localVideosWithMetadata.push(videoFile)
		}
	}

	if (!dryRun) {
		log.info(`Found ${localVideosWithMetadata.length} videos with metadata to strip`)
		for (const videoFile of localVideosWithMetadata) {
			console.log(`Stripping metadata from: ${videoFile}`)
			await stripVideoMetadata(videoFile)
		}
	}

	log.verbose = initialVerbosity
	return localVideosWithMetadata
}
