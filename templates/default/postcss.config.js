// const path = require('path');

module.exports = (api) => {
	const isProduction = api.mode === 'production';

	return {
		plugins: [
			require('postcss-import')(),
			require('postcss-url')(),
			require('postcss-preset-env')({
				stage: 2,
				features: {
					'custom-properties': {
						warnings: true,
						preserve: true
					}
				}
			}),
			require('postcss-nested')()
			// require('postcss-custom-media')({
			// 	importFrom: [path.resolve(__dirname, './src/shared/assets/styles/vars.css')],
			// 	preserve: false
			// })
		]
	};
};
