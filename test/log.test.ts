import { describe, expect, it, vi } from 'vitest'
import { log, setLogger } from '../src/lib/log'

function createTarget() {
	return { debug: vi.fn(), error: vi.fn(), info: vi.fn(), trace: vi.fn(), warn: vi.fn() }
}

describe('setLogger', () => {
	it('routes library logs to an injected console-like target', () => {
		const target = createTarget()
		setLogger(target)

		log.warn('remote video changed')

		expect(target.warn).toHaveBeenCalledOnce()
		expect(target.warn.mock.calls[0]?.join(' ')).toContain('remote video changed')
	})

	it('shows debug logs on an injected console-like target', () => {
		const target = createTarget()
		setLogger(target)

		log.debug('progress')

		expect(target.debug).toHaveBeenCalledOnce()
	})

	it('silences library logs when called without a logger', () => {
		const target = createTarget()
		setLogger(target)
		setLogger()

		log.warn('dropped')

		expect(target.warn).not.toHaveBeenCalled()
	})
})
