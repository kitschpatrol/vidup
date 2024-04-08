#!/usr/bin/env node

import { sync } from '../lib/index'
import log from '../lib/utilities/log'
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
				.option('services', {
					alias: 's',
					// TODO mux, cloudflare, youtube...
					choices: ['bunny'] as const,
					default: 'bunny',
					describe:
						'Streaming service(s) to sync to. Only the Bunny.net streaming CDN is supported at this time.',
					type: 'array',
				})
				.option('bunny-key', {
					default: undefined,
					describe: 'Bunny stream CDN API access key',
					type: 'string',
				})
				.option('strip-metadata', {
					default: true,
					describe:
						'Remove all metadata from the video files before uploading them to the streaming service.',
					type: 'boolean',
				})
				.option('bunny-library', {
					default: undefined,
					describe: 'Bunny stream CDN library ID',
					type: 'string',
				})
				.option('verbose', {
					default: false,
					describe:
						'Enable verbose logging. All verbose logs and prefixed with their log level and are printed to `stderr` for ease of redirection.',
					type: 'boolean',
				}),
		// TODO checks as needed...
		// .check((argv) => true)
		async ({ bunnyKey, bunnyLibrary, directory, services, verbose }) => {
			log.verbose = verbose

			log.info('Starting video synchronization...')
			log.info(bunnyLibrary, bunnyKey, directory, services, verbose)

			const syncReport = await sync({
				credentials: {
					bunny: {
						key: '**********************',
						library: '************',
					},
				},
				directory: '/Volumes/Working/Video/Bunny Originals',
				dryRun: true,
				services: 'bunny',
				stripMetadata: true,
				verbose,
			})

			console.log('----------------------------------')
			console.log(`syncReport: ${JSON.stringify(syncReport, undefined, 2)}`)

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
