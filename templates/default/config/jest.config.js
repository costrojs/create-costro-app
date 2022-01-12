module.exports = {
	collectCoverage: true,
	moduleFileExtensions: ['js'],
	// modulePaths: ['../src'],
	resetModules: true,
	verbose: true,
	rootDir: '../',
	coverageDirectory: 'coverage',
	testEnvironment: 'jsdom',
	resolver: './config/jest-resolver.js',
	transform: {
		'\\.js$': ['babel-jest', { configFile: './config/babel.config.js' }]
	}
};
