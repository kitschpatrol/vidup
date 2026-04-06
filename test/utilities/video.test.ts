import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('execa', () => ({
	execa: vi.fn(),
}))

vi.mock('ffmpeg-static', () => ({
	default: '/fake/ffmpeg',
}))

const { execa } = await import('execa')
const { getVideosInDirectory, stripVideoMetadata, videoHasMetadata } =
	await import('../../src/lib/utilities/video')

const mockedExeca = vi.mocked(execa)

describe('getVideosInDirectory', () => {
	let temporaryDirectory: string

	beforeEach(async () => {
		temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'vidup-test-'))
	})

	afterEach(async () => {
		await fs.rm(temporaryDirectory, { recursive: true })
	})

	it('returns only video files', async () => {
		await Promise.all([
			fs.writeFile(path.join(temporaryDirectory, 'video.mp4'), ''),
			fs.writeFile(path.join(temporaryDirectory, 'clip.mov'), ''),
			fs.writeFile(path.join(temporaryDirectory, 'movie.avi'), ''),
			fs.writeFile(path.join(temporaryDirectory, 'film.mkv'), ''),
			fs.writeFile(path.join(temporaryDirectory, 'readme.txt'), ''),
			fs.writeFile(path.join(temporaryDirectory, 'photo.jpg'), ''),
			fs.writeFile(path.join(temporaryDirectory, 'data.json'), ''),
		])

		const result = await getVideosInDirectory(temporaryDirectory)
		expect(result).toHaveLength(4)
		expect(result).toEqual(
			expect.arrayContaining([
				path.join(temporaryDirectory, 'video.mp4'),
				path.join(temporaryDirectory, 'clip.mov'),
				path.join(temporaryDirectory, 'movie.avi'),
				path.join(temporaryDirectory, 'film.mkv'),
			]),
		)
	})

	it('returns empty array for empty directory', async () => {
		const result = await getVideosInDirectory(temporaryDirectory)
		expect(result).toEqual([])
	})

	it('returns empty array when no video files exist', async () => {
		await fs.writeFile(path.join(temporaryDirectory, 'readme.txt'), '')
		const result = await getVideosInDirectory(temporaryDirectory)
		expect(result).toEqual([])
	})
})

describe('videoHasMetadata', () => {
	it('returns true when stdout contains creation_time', async () => {
		// @ts-expect-error - partial mock of execa result
		mockedExeca.mockResolvedValueOnce({ stderr: '', stdout: 'creation_time=2024-01-01' })

		expect(await videoHasMetadata('test.mp4')).toBe(true)
	})

	it('returns true when stderr contains creation_time', async () => {
		// @ts-expect-error - partial mock of execa result
		mockedExeca.mockResolvedValueOnce({ stderr: 'creation_time=2024-01-01', stdout: '' })

		expect(await videoHasMetadata('test.mp4')).toBe(true)
	})

	it('returns false when no creation_time present', async () => {
		// @ts-expect-error - partial mock of execa result
		mockedExeca.mockResolvedValueOnce({ stderr: 'some other output', stdout: 'encoder=h264' })

		expect(await videoHasMetadata('test.mp4')).toBe(false)
	})

	it('throws when execa fails', async () => {
		mockedExeca.mockRejectedValueOnce(new Error('ffmpeg crashed'))
		await expect(videoHasMetadata('test.mp4')).rejects.toThrow('Failed to check metadata')
	})
})

describe('stripVideoMetadata', () => {
	it('calls ffmpeg with correct arguments', async () => {
		// @ts-expect-error - partial mock of execa result
		mockedExeca.mockResolvedValueOnce()
		// Mock fs.rename to prevent actual file operations
		const renameSpy = vi.spyOn(fs, 'rename').mockResolvedValueOnce()

		await stripVideoMetadata('/videos/test.mp4')

		expect(mockedExeca).toHaveBeenCalledWith('/fake/ffmpeg', [
			'-i',
			'/videos/test.mp4',
			'-map_metadata',
			'-1',
			'-c:v',
			'copy',
			'-c:a',
			'copy',
			'/videos/test.temp.mp4',
		])

		expect(renameSpy).toHaveBeenCalledWith('/videos/test.temp.mp4', '/videos/test.mp4')
		renameSpy.mockRestore()
	})

	it('throws when execa fails', async () => {
		mockedExeca.mockRejectedValueOnce(new Error('ffmpeg crashed'))
		await expect(stripVideoMetadata('test.mp4')).rejects.toThrow('Failed to strip metadata')
	})
})
