module.exports = {
	collectCoverage: true,
	moduleFileExtensions: ['js'],
	modulePaths: ['./src'],
	resetModules: true,
	verbose: true,
	coverageDirectory: 'coverage',
	testEnvironment: 'jsdom',
	resolver: './jest-resolver.js'
};
