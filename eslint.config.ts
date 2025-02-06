import { eslintConfig } from '@kitschpatrol/eslint-config'

export default eslintConfig({
	ts: {
		overrides: {
			'depend/ban-dependencies': [
				'error',
				{
					allowed: ['ora', 'execa'],
				},
			],
		},
	},
	type: 'lib',
})
