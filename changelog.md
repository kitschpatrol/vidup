# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

(Node.js support requirements have sometimes increased in minor or patch releases.)

## [1.0.21] - 2026-11-02

### Documentation

- Show metadata-stripping options as optional in the API example and correct the explanation of GUID changes after renaming videos.

### Maintenance

- Update runtime requirements for execa, lognow, ora 10, and pretty-ms 10.
- Refresh development dependencies and pnpm, constrain TypeScript to 6.0.x, update ESLint peer compatibility settings, and remove stale dependency-age exemptions.
- Build before linting and fixes, and replace prepare-time skill synchronization with pnpm-managed skill installation.
- Ignore loopback URLs and tolerate empty link-check inputs, schedule dependency updates monthly, and refresh CI and release actions.

## [1.0.20] - 2026-10-06

### Changed

- **Breaking:** Narrow supported Node.js versions to `^24.16.0 || >=26.3.0`, excluding Node 25 and Node 26.0–26.2.

### Documentation

- Update Node.js requirements and reorganize installation instructions for CLI and library use.

### Maintenance

- Refresh development dependencies, including shared configuration, Homebrew publishing, CLI-help generation, validation tools, Vitest, and pnpm.
- Synchronize contributor agent skills automatically during package preparation.
- Add a scheduled dependency-update workflow and correct diagnostic capture in website link checks.

## [1.0.19] - 2026-09-21

### Added

- Add `setLogger()` for injecting console-like or LogLayer logging targets, or silencing library log messages.
- Add Homebrew installation through `kitschpatrol/tap/vidup` and automate formula publication during releases.

### Changed

- **Breaking:** Raise the minimum supported Node.js version to 24.16.0.

### Removed

- **Breaking:** Remove the public `log` export and `verbose` fields from `SyncOptions` and `StripOptions`; configure library logging with `setLogger()`.

### Fixed

- Keep metadata-stripping diagnostics out of stdout so they do not corrupt CLI JSON reports.
- Preserve underlying errors as `Error.cause` when ffmpeg metadata checks or stripping fail.

### Documentation

- Document logger injection and silencing, correct the stripping function name in the API example, and fix verbose-help wording.
- Add Homebrew installation instructions.
- Replace placeholder video utility documentation with descriptions of file discovery, metadata detection, and ffmpeg stripping behavior.

### Maintenance

- Refresh runtime requirements, including execa 10, ora, pretty-ms, and yargs.
- Upgrade contributor tooling to shared-config 8, TypeScript 6, Vitest 5, and pnpm 12, and add editor tasks for linting and fixes.
- Consolidate CLI and library builds into shared, unminified ESM output with stale-code cleanup.
- Add scheduled link checks, refresh pinned workflow actions, and validate release tags against the repository's default branch.

## [1.0.18] - 2026-05-16

### Documentation

- Update contribution guidance and document the repository's linting, formatting, and README-generation tools.

### Maintenance

- Update the ora runtime requirement to `^9.4.0`.
- Refresh development dependencies, migrate to pnpm 11 and its build-approval configuration, and make the cleanup script portable.
- Fix publishing-token propagation, accept release tags with or without `v`, and update CI actions and dependency installation commands.

## [1.0.17] - 2026-04-06

### Maintenance

- Upgrade yargs to 18, update ora, and declare lowdb, picocolors, pretty-ms, and untildify as runtime dependencies.
- Replace pkgroll with tsdown, validate package exports and declarations with publint and Are the Types Wrong, and mark the package side-effect-free.
- Add Vitest coverage for synchronization, dry runs, metadata stripping, video utilities, and logging.
- Run builds, linting, and tests on Linux, macOS, and Windows, and refresh release and metadata workflows.
- Update shared-config to 7 and refresh development tooling, with Node.js 22.18.0 or newer required for contributors.

## [1.0.16] - 2025-12-08

### Maintenance

- Update execa, ffmpeg-static, and yargs type requirements.
- Refresh shared configuration, pkgroll, CLI-help tooling, Node typings, and pnpm.
- Fix pnpm hoisting by moving public hoist patterns into workspace configuration.

## [1.0.15] - 2025-11-06

### Maintenance

- Update shared configuration and CLI-help generation tooling, and restrict TypeScript build inputs to source files.

## [1.0.14] - 2025-11-04

### Maintenance

- Place the TypeScript declaration condition before the ESM import condition in package exports.
- Refresh typings and development dependencies, including shared configuration, pkgroll, and pnpm, and integrate `mdat-plugin-cli-help` for README generation.
- Switch local npm publishing from one-time passwords to token authentication.

## [1.0.13] - 2025-10-02

### Changed

- **Breaking:** Raise the minimum supported Node.js version from 20.9.0 to 20.19.0.

### Maintenance

- Refresh runtime and bundled CLI dependencies, including hasha 7, ora 9, and untildify 6, and replace Chalk with picocolors.
- Update shared configuration, pkgroll, TypeScript, pnpm, and metadata automation; switch lint and fix scripts from `kpi` to `ksc`.
- Disable build minification and move pnpm dependency-build approvals into workspace configuration.

## [1.0.12] - 2025-03-04

### Maintenance

- Refresh shared configuration, TypeScript, and Node typings, and normalize the package repository URL.

## [1.0.11] - 2025-03-02

### Maintenance

- Update shared configuration to fix contributor-tooling compatibility with Node.js 20.

## [1.0.10] - 2025-03-02

### Documentation

- Correct CLI and library requirements in the README to Node.js 20.9.0 or newer.

## [1.0.9] - 2025-03-02

### Changed

- Relax the minimum supported Node.js version from 22 to 20.9.0.

### Maintenance

- Refresh development dependencies and pnpm, remove the pnpm engine restriction, and correct the package repository URL.
- Move linting, formatting, spelling, and README-generation configuration out of package metadata into standalone files.

## [1.0.8] - 2025-02-07

### Changed

- **Breaking:** Raise the minimum supported Node.js version from 18 to 22.

### Maintenance

- Update ora and remove the unused fs-extra dependency and its typings.
- Migrate to shared-config 5, flat ESLint configuration, shared TypeScript settings, and pnpm 10; refresh contributor and metadata-workflow configuration.

## [1.0.7] - 2025-02-01

### Maintenance

- Refresh runtime dependency requirements, including Bunny Stream, execa, fs-extra, and ora.
- Update bundled CLI utilities and development tooling, including shared configuration, pkgroll, TypeScript, and pnpm.

## [1.0.6] - 2024-09-14

### Fixed

- Restore the CLI source and remove the Git ignore rule that excluded it, allowing checkout builds to include the executable.

### Maintenance

- Update the execa runtime requirement to `^9.3.1`.
- Refresh contributor dependencies, align Node typings with Node 18, and simplify release and cleanup scripts.

## [1.0.5] - 2024-09-07

### Changed

- **Breaking:** Introduce a root-only package export map, preventing imports through previously accessible package subpaths.

### Documentation

- Show explicit `--service` choices in the CLI option reference.

### Maintenance

- Migrate builds from tsup to pkgroll, place the executable under `dist/bin`, and move fs-extra and yargs typings into production dependencies.
- Refresh runtime and bundled CLI dependency requirements, including ora and pretty-ms.
- Update development tooling and release and metadata actions, and allow manual metadata synchronization.

## [1.0.4] - 2024-06-08

### Fixed

- Read the CLI version explicitly from package metadata for `--version` and `-v`.

### Documentation

- Correct the README wording describing ESM library requirements.

### Maintenance

- Update the Bunny Stream client requirement to `bunnycdn-stream ^2.4.0`.
- Refresh development dependencies and release actions, migrate to pnpm 9, and build explicitly during releases.

## [1.0.3] - 2024-04-08

### Fixed

- Externalize yargs and declare it as a runtime dependency to fix version detection in the distributed CLI.

### Maintenance

- Update the shared development configuration.

## [1.0.2] - 2024-04-08

### Fixed

- Correct version-option configuration so `--version` no longer prints the literal string `version`.

## [1.0.1] - 2024-04-08

### Added

- Export `stripVideoMetadataInDirectory` and `StripOptions` for standalone metadata stripping, including dry runs and a report of affected file paths.

### Changed

- **Breaking:** Make CLI metadata stripping opt-in with `--strip-metadata` instead of modifying local videos by default.
- **Breaking:** Rename `VidupService`, `VidupSyncOptions`, and `VidupSyncReport` exports to `Service`, `SyncOptions`, and `SyncReport`.
- **Breaking:** Change synchronization report actions to `Create`, `Delete`, `None`, and `Update`, and make the `stripMetadata` field optional.
- **Breaking:** Move tilde expansion to the CLI and resolve CLI directories absolutely; `syncVideoInDirectory` no longer expands tilde-prefixed paths.
- Include remote GUIDs and metadata-stripping results in CLI text reports.

### Removed

- **Breaking:** Remove metadata stripping and the `stripMetadata` option from `syncVideoInDirectory`; library callers must invoke stripping separately.

### Documentation

- Correct the JSON dry-run example and add help warnings about remote deletion and in-place modification of local videos.
- Document standalone metadata stripping and update synchronization API and report examples.

## [1.0.0] - 2024-04-08

### Added

- Synchronize MP4, MOV, AVI, and MKV files to Bunny Stream by filename, supporting uploads, replacements with new GUIDs, and deletion of remote-only videos.
- Persist synchronization hashes and timestamps in `.vidup-state.json` to retain upload state between runs.
- Provide default and explicit `sync` commands with service credentials, `--dry-run`, `--json`, `--verbose`, and support for tilde-prefixed directory paths.
- Strip metadata from videos carrying `creation_time` using ffmpeg without re-encoding; stripping runs before synchronization by default and can be disabled.
- Ship an ESM library for Node 18+ exporting `syncVideoInDirectory`, `VidupService`, `VidupSyncOptions`, `VidupSyncReport`, and `log`, with TypeScript declarations.

### Documentation

- Document npm and npx installation, Bunny credentials, CLI and library examples, filename matching, remote deletions, and GUID replacement behavior.

### Maintenance

- Set up TypeScript builds and declarations, shared linting and formatting, and release and repository-metadata workflows.

[1.0.0]: https://github.com/kitschpatrol/vidup/releases/tag/v1.0.0
[1.0.1]: https://github.com/kitschpatrol/vidup/compare/v1.0.0...v1.0.1
[1.0.2]: https://github.com/kitschpatrol/vidup/compare/v1.0.1...v1.0.2
[1.0.3]: https://github.com/kitschpatrol/vidup/compare/v1.0.2...v1.0.3
[1.0.4]: https://github.com/kitschpatrol/vidup/compare/v1.0.3...v1.0.4
[1.0.5]: https://github.com/kitschpatrol/vidup/compare/v1.0.4...v1.0.5
[1.0.6]: https://github.com/kitschpatrol/vidup/compare/v1.0.5...v1.0.6
[1.0.7]: https://github.com/kitschpatrol/vidup/compare/v1.0.6...v1.0.7
[1.0.8]: https://github.com/kitschpatrol/vidup/compare/v1.0.7...v1.0.8
[1.0.9]: https://github.com/kitschpatrol/vidup/compare/v1.0.8...v1.0.9
[1.0.10]: https://github.com/kitschpatrol/vidup/compare/v1.0.9...v1.0.10
[1.0.11]: https://github.com/kitschpatrol/vidup/compare/v1.0.10...v1.0.11
[1.0.12]: https://github.com/kitschpatrol/vidup/compare/v1.0.11...v1.0.12
[1.0.13]: https://github.com/kitschpatrol/vidup/compare/v1.0.12...v1.0.13
[1.0.14]: https://github.com/kitschpatrol/vidup/compare/v1.0.13...v1.0.14
[1.0.15]: https://github.com/kitschpatrol/vidup/compare/v1.0.14...v1.0.15
[1.0.16]: https://github.com/kitschpatrol/vidup/compare/v1.0.15...v1.0.16
[1.0.17]: https://github.com/kitschpatrol/vidup/compare/v1.0.16...v1.0.17
[1.0.18]: https://github.com/kitschpatrol/vidup/compare/v1.0.17...v1.0.18
[1.0.19]: https://github.com/kitschpatrol/vidup/compare/v1.0.18...v1.0.19
[1.0.20]: https://github.com/kitschpatrol/vidup/compare/v1.0.19...v1.0.20
[1.0.21]: https://github.com/kitschpatrol/vidup/compare/v1.0.20...v1.0.21
