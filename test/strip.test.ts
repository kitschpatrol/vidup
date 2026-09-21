import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/utilities/video', () => ({
	getVideosInDirectory: vi.fn(),
	stripVideoMetadata: vi.fn(),
	videoHasMetadata: vi.fn(),
}))

const { getVideosInDirectory, stripVideoMetadata, videoHasMetadata } =
	await import('../src/lib/utilities/video')
const { stripVideoMetadataInDirectory } = await import('../src/lib/strip')

// Silence library logs during tests
const { setLogger } = await import('../src/lib/log')
setLogger()

const mockedGetVideos = vi.mocked(getVideosInDirectory)
const mockedHasMetadata = vi.mocked(videoHasMetadata)
const mockedStripMetadata = vi.mocked(stripVideoMetadata)

describe('stripVideoMetadataInDirectory', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('strips metadata from files that have it', async () => {
		mockedGetVideos.mockResolvedValueOnce(['/dir/a.mp4', '/dir/b.mp4', '/dir/c.mp4'])
		mockedHasMetadata.mockResolvedValueOnce(true)
		mockedHasMetadata.mockResolvedValueOnce(false)
		mockedHasMetadata.mockResolvedValueOnce(true)

		const result = await stripVideoMetadataInDirectory('/dir')

		expect(mockedStripMetadata).toHaveBeenCalledTimes(2)
		expect(mockedStripMetadata).toHaveBeenCalledWith('/dir/a.mp4')
		expect(mockedStripMetadata).toHaveBeenCalledWith('/dir/c.mp4')
		expect(result).toEqual(['/dir/a.mp4', '/dir/c.mp4'])
	})

	it('skips files without metadata', async () => {
		mockedGetVideos.mockResolvedValueOnce(['/dir/a.mp4'])
		mockedHasMetadata.mockResolvedValueOnce(false)

		const result = await stripVideoMetadataInDirectory('/dir')

		expect(mockedStripMetadata).not.toHaveBeenCalled()
		expect(result).toEqual([])
	})

	it('does not strip in dry-run mode', async () => {
		mockedGetVideos.mockResolvedValueOnce(['/dir/a.mp4'])
		mockedHasMetadata.mockResolvedValueOnce(true)

		const result = await stripVideoMetadataInDirectory('/dir', { dryRun: true })

		expect(mockedStripMetadata).not.toHaveBeenCalled()
		expect(result).toEqual(['/dir/a.mp4'])
	})

	it('handles empty directory', async () => {
		mockedGetVideos.mockResolvedValueOnce([])

		const result = await stripVideoMetadataInDirectory('/dir')

		expect(mockedHasMetadata).not.toHaveBeenCalled()
		expect(mockedStripMetadata).not.toHaveBeenCalled()
		expect(result).toEqual([])
	})
})
