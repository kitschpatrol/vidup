export { type StripOptions as VidupStripOptions, stripVideoMetadataInDirectory } from './strip'

export {
	type Service as VidupService,
	type SyncOptions as VidupSyncOptions,
	type SyncReport as VidupSyncReport,
	syncVideoInDirectory,
} from './sync'

export { default as log } from './utilities/log'
