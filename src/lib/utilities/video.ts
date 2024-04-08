import { execa } from 'execa'
import ffmpegPath from 'ffmpeg-static'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function getVideosInDirectory(directory: string): Promise<string[]> {
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

export async function videoHasMetadata(filename: string): Promise<boolean> {
	if (ffmpegPath === null) {
		throw new Error('ffmpeg-static failed to locate ffmpeg binary')
	}

	try {
		// Use execa to run ffmpeg and check for 'creation_time' in the metadata
		const { stderr, stdout } = await execa(ffmpegPath, ['-i', filename, '-f', 'ffmetadata', '-'])
		return stdout.includes('creation_time') || stderr.includes('creation_time')
	} catch (error) {
		throw new Error(`Failed to check metadata for: ${filename}:\n${String(error)}`)
	}
}

export async function stripMetadataFromVideo(filename: string): Promise<void> {
	if (ffmpegPath === null) {
		throw new Error('ffmpeg-static failed to locate ffmpeg binary')
	}

	try {
		// Determine the temporary file name
		const extension = path.extname(filename).slice(1)
		const temporaryFilename = `${filename.slice(0, Math.max(0, filename.lastIndexOf('.')))}.temp.${extension}`

		// Use execa to run ffmpeg and strip metadata
		await execa(ffmpegPath, [
			'-i',
			filename,
			'-map_metadata',
			'-1',
			'-c:v',
			'copy',
			'-c:a',
			'copy',
			temporaryFilename,
		])

		// Replace the original file with the modified one
		await fs.rename(temporaryFilename, filename)
	} catch (error) {
		throw new Error(`Failed to strip metadata from: ${filename}:\n${String(error)}`)
	}
}
