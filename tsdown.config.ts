import { defineConfig } from 'tsdown'

export default defineConfig({
	attw: {
		profile: 'esm-only',
	},
	// Remove stale entries and shared chunks while preserving non-code assets.
	clean: ['dist/**/*.{js,js.map,d.ts,d.ts.map}'],
	dts: true,
	entry: {
		'bin/cli': 'src/bin/cli.ts',
		'lib/index': 'src/lib/index.ts',
	},
	fixedExtension: false,
	format: 'esm',
	// Keep the shared library implementation readable for debugging.
	minify: false,
	outDir: 'dist',
	platform: 'node',
	publint: true,
	tsconfig: 'tsconfig.build.json',
})
