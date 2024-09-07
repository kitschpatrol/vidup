/* eslint-disable perfectionist/sort-objects */
// Staying basic, always log to stderr

import chalk from 'chalk'
import { oraPromise } from 'ora'

const isNode = process?.versions?.node !== undefined

// eslint-disable-next-line @typescript-eslint/naming-convention
const log = {
	verbose: false,

	// Intended for temporary logging
	log(...data: unknown[]): void {
		if (!this.verbose) return
		const levelPrefix = chalk.gray('[Log]')
		if (isNode) {
			// Log to stderr in node for ease of redirection
			console.warn(levelPrefix, ...data)
		} else {
			console.log(levelPrefix, ...data)
		}
	},
	logPrefixed(prefix: string, ...data: unknown[]): void {
		this.info(chalk.blue(`[${prefix}]`), ...data)
	},

	info(...data: unknown[]): void {
		if (!this.verbose) return
		const levelPrefix = chalk.green('[Info]')
		if (isNode) {
			// Log info to stderr in node for ease of redirection
			console.warn(levelPrefix, ...data)
		} else {
			console.info(levelPrefix, ...data)
		}
	},
	infoPrefixed(prefix: string, ...data: unknown[]): void {
		this.info(chalk.blue(`[${prefix}]`), ...data)
	},
	async infoSpin<T>(promise: Promise<T>, message: string): Promise<T> {
		return oraPromise(promise, {
			prefixText: chalk.green('[Info]'),
			stream: process.stderr,
			text: message,
		})
	},

	warn(...data: unknown[]): void {
		console.warn(chalk.yellow('[Warning]'), ...data)
	},
	warnPrefixed(prefix: string, ...data: unknown[]): void {
		this.warn(chalk.blue(`[${prefix}]`), ...data)
	},

	error(...data: unknown[]): void {
		console.error(chalk.red('[Error]'), ...data)
	},
	errorPrefixed(prefix: string, ...data: unknown[]): void {
		this.error(chalk.blue(`[${prefix}]`), ...data)
	},
}

export default log
