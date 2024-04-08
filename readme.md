<!--+ Warning: Content inside HTML comment blocks was generated by mdat and may be overwritten. +-->

<!-- title -->

# vidup

<!-- /title -->

<!-- badges -->

[![NPM Package vidup](https://img.shields.io/npm/v/vidup.svg)](https://npmjs.com/package/vidup)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<!-- /badges -->

<!-- short-description -->

**Synchronize a local directory of video files to remote streaming services.**

<!-- /short-description -->

> \[!WARNING]\
> This tool was built in haste and has been tested only against a relatively narrow use-case. If you use it, please review the docs, invoke with care, and make sure you have local copies of your remote videos and metadata.

## Overview

Vidup is a CLI tool and Node library to automate one-way synchronization of local video files to remote video streaming CDN services.

It checks for differences between your local and remote videos, and automatically creates, updates, or deletes videos on the remote service so that it exactly mirrors the contents of a local directory.

Currently, only Bunny.net's [Bunny Stream](https://bunny.net/stream/) service is supported as a sync target. Adding support additional platforms like [Mux](https://www.mux.com) and [Cloudflare Stream](https://www.cloudflare.com/products/cloudflare-stream/) wouldn't be too tricky.

## Getting started

### Dependencies

The vidup CLI tool requires Node 18+. The exported APIs for are ESM-only and share the Node 18+ requirement. Vidup is implemented in TypeScript and bundles type definitions.

A [Bunny Stream](https://bunny.net/stream/) account, API key, and library ID are required.

### Installation

Invoke directly:

```sh
npx vidup
```

Or, install locally to access the CLI commands in a single project or to import the provided APIs:

```sh
npm install vidup
```

Or, install globally for access across your system:

```sh
npm install --global vidup
```

## Usage

Vidup treats local videos' file names as keys, and will look for a file with the same name / title on the remote streaming service.

Any video files present in the local folder that aren't matched to a video on the remote service will be uploaded.

If you change the name of a local video file, the remote video with the previous name will be deleted, and a new remote video (with a ne GUID) will be created.

Vidup tracks the content hash of each local video. If you replace a local video file with another of the same name, the change in content will be detected and the remote video will be updated.
(_Note that this is currently equivalent to deleting / creating a new remote video since Bunny.net doesn't support in-place video updates. The GUID will change, so you'll need to update any embeds accordingly._)

Any videos present on the remote service that aren't matched to a video file in the local folder **will be deleted from the remote service**.

### CLI

<!-- cli-help -->

#### Command: `vidup`

Run a vidup command.

This section lists top-level commands for `vidup`.

If no command is provided, `vidup sync` is run by default.

Usage:

```txt
vidup [command]
```

| Command | Argument                  | Description                                                                                                    |
| ------- | ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `sync`  | `<directory>` `[options]` | Synchronize a remote video streaming service to mirror the contents of a local directory. _(Default command.)_ |

_See the sections below for more information on each subcommand._

#### Subcommand: `vidup sync`

Synchronize a remote video streaming service to mirror the contents of a local directory.

Usage:

```txt
vidup sync <directory> [options]
```

| Positional Argument | Description                                                           | Type     |
| ------------------- | --------------------------------------------------------------------- | -------- |
| `directory`         | The path to the local directory of video files to sync. _(Required.)_ | `string` |

| Option             | Alias | Description                                                                                                                     | Type      | Default |
| ------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------- | --------- | ------- |
| `--service`        | `-s`  | Streaming service to sync to. Only the Bunny.net streaming CDN is supported at this time.                                       | `string`  |         |
| `--key`            |       | Streaming service API access key                                                                                                | `string`  |         |
| `--library`        |       | Streaming service library ID                                                                                                    | `string`  |         |
| `--strip-metadata` |       | Remove all metadata from the video files before uploading them to the streaming service.                                        | `boolean` | `true`  |
| `--dry-run`        | `-d`  | Perform a dry run without making any changes. Useful for testing and debugging.                                                 | `boolean` | `false` |
| `--json`           |       | Output the sync report as JSON                                                                                                  | `boolean` | `false` |
| `--verbose`        |       | Enable verbose logging. All verbose logs and prefixed with their log level and are printed to `stderr` for ease of redirection. | `boolean` | `false` |
| `--help`           | `-h`  | Show help                                                                                                                       | `boolean` |         |
| `--version`        | `-v`  | Show version number                                                                                                             | `boolean` |         |

<!-- /cli-help -->

#### Examples

**Synchronize video files in the current folder to Bunny Stream:**

```sh
vidup . --service bunny --key <BUNNY_API_KEY> --library <BUNNY_LIBRARY_ID>
```

Large uploads can take some time. Upon completion, a report summarizing the actions taken is printed to stdout:

```sh
Unchanged: an-already-uploaded-video.mov
Created: a-new-video.mov
Updated: a-changed-video.mp4
Deleted: a-remote-only-video.mp4
```

**Perform a non-executive dry-run and get the snynchronization plan report as JSON:**

```sh
vidup . --service bunny --key --json < BUNNY_API_KEY > --library < BUNNY_LIBRARY_ID > --dry-run
```

The JSON version of the output provides some extra info.

### Library

#### API

Vidup's functionality is also provided in module form for use in TypeScript or JavaScript Node projects.

The library exports a single async function, `syncVideoInDirectory`, which takes an options argument mirroring the arguments available via the command line. The same default values apply:

```ts
async function syncVideoInDirectory(
  directory: string,
  options: {
    service: Service
    credentials: {
      key: string
      library: string
    }
    dryRun?: boolean // defaults to false
    stripMetadata?: boolean // defaults to true
    verbose?: boolean // defaults to false
  },
): Promise<SyncReport>
```

#### Examples

```ts
import { syncVideoInDirectory } from 'vidup'

const syncReport = await syncVideoInDirectory(process.cwd(), {
  service: 'bunny',
  credentials: {
    key: BUNNY_API_KEY,
    library: BUNNY_LIBRARY_ID,
  },
})

console.log(JSON.stringify(syncReport, undefined, 2))
```

## Background

### Motivation

Video streaming providers have slow and clunky web UIs. I'd rather not maintain the remote collection by hand. The web these days makes Finder.app feel like a CRUD tour-de-force.

## The future

- [ ] Tests
- [ ] Add [Cosmiconfig](https://github.com/cosmiconfig/cosmiconfig)
- [ ] Synchronize thumbnails and other metadata
- [ ] Remote collection / folder support
- [ ] Mux support
- [ ] Cloudflare Stream support
- [ ] Support for additional streaming services

## Maintainers

[@kitschpatrol](https://github.com/kitschpatrol)

## Acknowledgements

Thanks to [@dan-online](https://github.com/dan-online) for his super-helpful [bunnycdn-stream](https://github.com/dan-online/bunnycdn-stream) library.

<!-- footer -->

## Contributing

[Issues](https://github.com/kitschpatrol/vidup/issues) and pull requests are welcome.

## License

[MIT](license.txt) © Eric Mika

<!-- /footer -->
