module.exports = {
	env: {
		browser: true,
		node: true,
		jest: true
	},
	extends: ['eslint:recommended', 'plugin:react/recommended'],
	parser: '@babel/eslint-parser',
	parserOptions: {
		ecmaFeatures: {
			jsx: true
		}
	},
	rules: {
		'react/display-name': 0,
		'react/jsx-key': 0,
		'react/prop-types': 0
	},
	settings: {
		react: {
			fragment: 'F', // Fragment
			pragma: 'h', // createElement
			version: '0' // Remove the warning of the missing React package
		}
	}
};
