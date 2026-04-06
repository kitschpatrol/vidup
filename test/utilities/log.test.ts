import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('ora', () => ({
	oraPromise: vi.fn(async (promise: Promise<unknown>) => promise),
}))

const { default: log } = await import('../../src/lib/utilities/log')

describe('log', () => {
	let warnSpy: ReturnType<typeof vi.spyOn>
	let errorSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		// eslint-disable-next-line ts/no-empty-function
		warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
		// eslint-disable-next-line ts/no-empty-function
		errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
		log.verbose = false
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('when verbose is false', () => {
		it('log() does not output', () => {
			log.log('test')
			expect(warnSpy).not.toHaveBeenCalled()
		})

		it('info() does not output', () => {
			log.info('test')
			expect(warnSpy).not.toHaveBeenCalled()
		})

		it('warn() still outputs', () => {
			log.warn('test')
			expect(warnSpy).toHaveBeenCalledOnce()
		})

		it('error() still outputs', () => {
			log.error('test')
			expect(errorSpy).toHaveBeenCalledOnce()
		})
	})

	describe('when verbose is true', () => {
		beforeEach(() => {
			log.verbose = true
		})

		it('log() outputs to console.warn', () => {
			log.log('hello')
			expect(warnSpy).toHaveBeenCalledOnce()
			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[Log]'), 'hello')
		})

		it('info() outputs to console.warn', () => {
			log.info('hello')
			expect(warnSpy).toHaveBeenCalledOnce()
			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[Info]'), 'hello')
		})
	})

	describe('prefixed variants', () => {
		beforeEach(() => {
			log.verbose = true
		})

		it('infoPrefixed() outputs with custom prefix', () => {
			log.infoPrefixed('MyPrefix', 'data')
			expect(warnSpy).toHaveBeenCalledOnce()
		})

		it('warnPrefixed() outputs with custom prefix', () => {
			log.warnPrefixed('MyPrefix', 'data')
			expect(warnSpy).toHaveBeenCalledOnce()
		})

		it('errorPrefixed() outputs with custom prefix', () => {
			log.errorPrefixed('MyPrefix', 'data')
			expect(errorSpy).toHaveBeenCalledOnce()
		})
	})

	describe('infoSpin', () => {
		it('resolves with the wrapped promise value', async () => {
			const result = await log.infoSpin(Promise.resolve(42), 'loading')
			expect(result).toBe(42)
		})
	})
})
