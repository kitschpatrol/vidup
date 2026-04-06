import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockStream = {
	createAndUploadVideo: vi.fn().mockResolvedValue({ guid: 'new-guid-123' }),
	deleteVideo: vi.fn().mockResolvedValue({ success: true }),
	listAllVideos: vi.fn().mockResolvedValue([]),
}

vi.mock('bunnycdn-stream', () => ({
	// eslint-disable-next-line ts/naming-convention
	BunnyCdnStream: class {
		createAndUploadVideo = mockStream.createAndUploadVideo
		deleteVideo = mockStream.deleteVideo
		listAllVideos = mockStream.listAllVideos
	},
}))

vi.mock('hasha', () => ({
	hash: vi.fn().mockResolvedValue('hash-abc'),
}))

vi.mock('node:fs', async (importOriginal) => {
	// eslint-disable-next-line ts/consistent-type-imports
	const actual: typeof import('node:fs') = await importOriginal()
	return {
		...actual,
		createReadStream: vi.fn().mockReturnValue('mock-stream'),
	}
})

vi.mock('ora', () => ({
	oraPromise: vi.fn(async (promise: Promise<unknown>) => promise),
}))

const { syncVideoInDirectory } = await import('../src/lib/sync')

// Hash mock — sync.ts treats hashes as strings
const { hash: mockedHash } = await import('hasha')
// eslint-disable-next-line ts/no-unsafe-type-assertion
const typedMockedHash = mockedHash as unknown as { mockResolvedValueOnce: (v: string) => void }

const defaultOptions = {
	credentials: { key: 'test-key', library: 'test-lib' },
	service: 'bunny' as const,
}

describe('syncVideoInDirectory', () => {
	let temporaryDirectory: string
	const originalNodeEnv = process.env.NODE_ENV

	beforeEach(async () => {
		vi.clearAllMocks()
		temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'vidup-sync-test-'))
		// Let lowdb use real file adapter so state persists across calls
		process.env.NODE_ENV = 'development'
	})

	afterEach(async () => {
		process.env.NODE_ENV = originalNodeEnv
		await fs.rm(temporaryDirectory, { recursive: true })
	})

	describe('categorization', () => {
		it('identifies local-only files as Create', async () => {
			await fs.writeFile(path.join(temporaryDirectory, 'new.mp4'), 'content')
			mockStream.listAllVideos.mockResolvedValueOnce([])

			const report = await syncVideoInDirectory(temporaryDirectory, {
				...defaultOptions,
				dryRun: true,
			})

			expect(report).toContainEqual(
				expect.objectContaining({ action: 'Create', localFile: 'new.mp4' }),
			)
		})

		it('identifies remote-only files as Delete', async () => {
			mockStream.listAllVideos.mockResolvedValueOnce([{ guid: 'remote-1', title: 'orphan.mp4' }])

			const report = await syncVideoInDirectory(temporaryDirectory, {
				...defaultOptions,
				dryRun: true,
			})

			expect(report).toContainEqual(
				expect.objectContaining({
					action: 'Delete',
					localFile: 'orphan.mp4',
					remoteId: 'remote-1',
				}),
			)
		})

		it('identifies files with matching hash as None', async () => {
			await fs.writeFile(path.join(temporaryDirectory, 'synced.mp4'), 'content')
			typedMockedHash.mockResolvedValueOnce('same-hash')

			// Simulate state where remote hash matches local
			// First call: sync creates state with localHash = 'same-hash'
			// To get a "None" result, we need the remote hash to match
			// This requires a prior sync to have set remoteHash.bunny
			// For the test, we set up the remote with a matching title and
			// pre-populate state via a first sync

			// Do a live first sync to populate state
			mockStream.listAllVideos.mockResolvedValueOnce([])
			mockStream.createAndUploadVideo.mockResolvedValueOnce({ guid: 'guid-1' })
			await syncVideoInDirectory(temporaryDirectory, defaultOptions)

			// Now the state has remoteHash.bunny = 'same-hash' for synced.mp4
			// Do a second dry-run sync to test categorization
			vi.clearAllMocks()
			typedMockedHash.mockResolvedValueOnce('same-hash')
			mockStream.listAllVideos.mockResolvedValueOnce([{ guid: 'guid-1', title: 'synced.mp4' }])

			const report = await syncVideoInDirectory(temporaryDirectory, {
				...defaultOptions,
				dryRun: true,
			})

			expect(report).toContainEqual(
				expect.objectContaining({
					action: 'None',
					localFile: 'synced.mp4',
					remoteId: 'guid-1',
				}),
			)
		})

		it('identifies files with changed hash as Update', async () => {
			await fs.writeFile(path.join(temporaryDirectory, 'changed.mp4'), 'content')

			// First sync to establish state
			typedMockedHash.mockResolvedValueOnce('old-hash')
			mockStream.listAllVideos.mockResolvedValueOnce([])
			mockStream.createAndUploadVideo.mockResolvedValueOnce({ guid: 'guid-1' })
			await syncVideoInDirectory(temporaryDirectory, defaultOptions)

			// Second sync with changed hash
			vi.clearAllMocks()
			typedMockedHash.mockResolvedValueOnce('new-hash')
			mockStream.listAllVideos.mockResolvedValueOnce([{ guid: 'guid-1', title: 'changed.mp4' }])

			const report = await syncVideoInDirectory(temporaryDirectory, {
				...defaultOptions,
				dryRun: true,
			})

			expect(report).toContainEqual(
				expect.objectContaining({ action: 'Update', localFile: 'changed.mp4' }),
			)
		})
	})

	describe('dry run', () => {
		it('does not call API mutation methods', async () => {
			await fs.writeFile(path.join(temporaryDirectory, 'new.mp4'), 'content')
			mockStream.listAllVideos.mockResolvedValueOnce([{ guid: 'remote-1', title: 'orphan.mp4' }])

			await syncVideoInDirectory(temporaryDirectory, {
				...defaultOptions,
				dryRun: true,
			})

			expect(mockStream.createAndUploadVideo).not.toHaveBeenCalled()
			expect(mockStream.deleteVideo).not.toHaveBeenCalled()
		})

		it('reports placeholder remote IDs for creates', async () => {
			await fs.writeFile(path.join(temporaryDirectory, 'new.mp4'), 'content')
			mockStream.listAllVideos.mockResolvedValueOnce([])

			const report = await syncVideoInDirectory(temporaryDirectory, {
				...defaultOptions,
				dryRun: true,
			})

			const createEntry = report.find((r) => r.action === 'Create')
			expect(createEntry?.remoteId).toBe('Not yet uploaded (Dry run)')
		})
	})

	describe('live run', () => {
		it('deletes remote-only videos', async () => {
			mockStream.listAllVideos.mockResolvedValueOnce([{ guid: 'remote-1', title: 'orphan.mp4' }])

			await syncVideoInDirectory(temporaryDirectory, defaultOptions)

			expect(mockStream.deleteVideo).toHaveBeenCalledWith('remote-1')
		})

		it('uploads local-only videos', async () => {
			await fs.writeFile(path.join(temporaryDirectory, 'new.mp4'), 'content')
			mockStream.listAllVideos.mockResolvedValueOnce([])

			const report = await syncVideoInDirectory(temporaryDirectory, defaultOptions)

			expect(mockStream.createAndUploadVideo).toHaveBeenCalledWith('mock-stream', {
				title: 'new.mp4',
			})

			const createEntry = report.find((r) => r.action === 'Create')
			expect(createEntry?.remoteId).toBe('new-guid-123')
		})

		it('updates changed videos by delete then re-upload', async () => {
			await fs.writeFile(path.join(temporaryDirectory, 'changed.mp4'), 'content')

			// First sync to establish state
			typedMockedHash.mockResolvedValueOnce('old-hash')
			mockStream.listAllVideos.mockResolvedValueOnce([])
			mockStream.createAndUploadVideo.mockResolvedValueOnce({ guid: 'guid-1' })
			await syncVideoInDirectory(temporaryDirectory, defaultOptions)

			// Second sync with changed hash
			vi.clearAllMocks()
			typedMockedHash.mockResolvedValueOnce('new-hash')
			mockStream.listAllVideos.mockResolvedValueOnce([{ guid: 'guid-1', title: 'changed.mp4' }])
			mockStream.deleteVideo.mockResolvedValueOnce({ success: true })
			mockStream.createAndUploadVideo.mockResolvedValueOnce({ guid: 'guid-2' })

			const report = await syncVideoInDirectory(temporaryDirectory, defaultOptions)

			expect(mockStream.deleteVideo).toHaveBeenCalledWith('guid-1')
			expect(mockStream.createAndUploadVideo).toHaveBeenCalled()

			const updateEntry = report.find((r) => r.action === 'Update')
			expect(updateEntry?.remoteId).toBe('guid-2')
		})
	})

	describe('errors', () => {
		it('throws for unsupported service', async () => {
			await expect(
				syncVideoInDirectory(temporaryDirectory, {
					credentials: { key: 'k', library: 'l' },
					service: 'cloudflare',
				}),
			).rejects.toThrow('Streaming service not yet implemented: cloudflare')
		})

		it('throws when delete fails', async () => {
			mockStream.listAllVideos.mockResolvedValueOnce([{ guid: 'remote-1', title: 'orphan.mp4' }])
			mockStream.deleteVideo.mockResolvedValueOnce({ success: false })

			await expect(syncVideoInDirectory(temporaryDirectory, defaultOptions)).rejects.toThrow(
				'Failed to delete remote video',
			)
		})
	})
})
