#!/usr/bin/env node

import { type VidupService, log, syncVideoInDirectory } from '../lib'
import prettyMilliseconds from 'pretty-ms'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const startTime = performance.now()
const yargsInstance = yargs(hideBin(process.argv))

await yargsInstance
	.scriptName('vidup')
	.usage('$0 [command]', 'Run a vidup command.')
	// `vidup sync` (default)
	.command(
		['$0 <directory> [options]', 'sync <directory> [options]'],
		'Synchronize a remote streaming service to mirror the contents of a local directory.',
		(yargs) =>
			yargs
				.positional('directory', {
					default: undefined,
					demandOption: true,
					describe: 'The path to the local directory of video files to sync.',
					type: 'string',
				})
				.option('service', {
					alias: 's',
					choices: ['bunny', 'mux', 'cloudflare'] as const,
					default: 'bunny',
					demandOption: true,
					describe:
						'Streaming service to sync to. Only the Bunny.net streaming CDN is supported at this time.',
					type: 'string',
				})
				.option('key', {
					default: undefined,
					demandOption: true,
					describe: 'Streaming service API access key',
					type: 'string',
				})
				.option('strip-metadata', {
					default: true,
					describe:
						'Remove all metadata from the video files before uploading them to the streaming service.',
					type: 'boolean',
				})
				.option('dry-run', {
					default: false,
					describe:
						'Perform a dry run without making any changes. Useful for testing and debugging.',
					type: 'boolean',
				})
				.option('library', {
					default: undefined,
					demandOption: true,
					describe: 'Streaming service library ID',
					type: 'string',
				})
				.option('json', {
					default: false,
					describe: 'Output the sync report as JSON',
					type: 'boolean',
				})
				.option('verbose', {
					default: false,
					describe:
						'Enable verbose logging. All verbose logs and prefixed with their log level and are printed to `stderr` for ease of redirection.',
					type: 'boolean',
				}),
		async ({ directory, dryRun, json, key, library, service, stripMetadata, verbose }) => {
			log.verbose = verbose

			log.info('Starting video synchronization...')

			if (dryRun) {
				log.warn(`Dry run enabled, not making any changes`)
			}

			const syncReport = await syncVideoInDirectory(directory, {
				credentials: {
					key,
					library,
				},
				dryRun,
				service: service as VidupService,
				stripMetadata,
				verbose,
			})

			if (json) {
				process.stdout.write(JSON.stringify(syncReport, undefined, 2))
				process.stdout.write('\n')
			} else {
				for (const entry of syncReport) {
					process.stdout.write(`${entry.action}: ${entry.localFile}\n`)
				}
			}

			log.info(`Synchronized video in ${prettyMilliseconds(performance.now() - startTime)}`)
			process.exitCode = 0
		},
	)
	.demandCommand(1)
	.alias('h', 'help')
	.version('version')
	.alias('v', 'version')
	.help()
	.wrap(process.stdout.isTTY ? Math.min(120, yargsInstance.terminalWidth()) : 0)
	.parse()
