module.exports = {
	env: {
		browser: true,
		es6: true,
		jest: true,
		node: true
	},

	extends: ['plugin:prettier/recommended'],

	globals: {
		document: false,
		window: false
	},

	parser: '@babel/eslint-parser',
	parserOptions: {
		requireConfigFile: false,
		ecmaFeatures: {
			experimentalObjectRestSpread: true,
			impliedStrict: true,
			jsx: true
		},
		sourceType: 'module'
	},

	rules: {
		indent: ['error', 'tab', { ignoredNodes: ['TemplateLiteral > *'] }],
		'linebreak-style': ['error', 'unix'],
		'no-console': 0,
		'no-tabs': 0,
		'space-before-function-paren': [
			'error',
			{ anonymous: 'never', asyncArrow: 'always', named: 'never' }
		]
	}
};
