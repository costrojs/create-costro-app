module.exports = (api) => {
	const presets = [['@babel/preset-env']];

	const plugins = [
		[
			'@babel/plugin-transform-react-jsx',
			{
				pragma: 'h',
				pragmaFrag: 'F'
			}
		]
	];

	api.cache.using(() => process.env.NODE_ENV);

	return {
		plugins,
		presets
	};
};
