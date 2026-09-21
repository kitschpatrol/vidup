import type { ILogBasic, ILogLayer } from 'lognow'
import { createLogger, injectionHelper } from 'lognow'
import { name } from '../../package.json' with { type: 'json' }

/**
 * The default logger instance for the library.
 */
export let log = createLogger(name)

/**
 * Set the logger instance for the library. Library consumers can call this to
 * inject their own logger. Calling it with no argument silences the library.
 *
 * @param logger - Accepts either a LogLayer instance or a Console- or
 *   Stream-like log target
 */
export function setLogger(logger?: ILogBasic | ILogLayer<unknown>): void {
	log = injectionHelper(logger)
}
