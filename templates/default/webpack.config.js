const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
	const isProduction = argv.mode === 'production';
	const suffixHash = isProduction ? '.[contenthash]' : '';

	return {
		devtool: isProduction ? false : 'source-map',
		entry: {
			app: `${path.resolve(__dirname, './src/index.js')}`
		},
		devServer: {
			static: {
				directory: path.join(__dirname, './build')
			},
			historyApiFallback: true,
			port: 3000,
			compress: true,
			hot: true
		},
		module: {
			rules: [
				{
					include: [path.resolve(__dirname, './src')],
					test: /\.js$/,
					use: [
						{
							loader: 'babel-loader'
						}
					]
				},
				{
					test: /\.css$/,
					include: [path.resolve(__dirname, './src')],
					use: [
						MiniCssExtractPlugin.loader,
						{
							loader: 'css-loader'
						},
						{
							loader: 'postcss-loader'
						}
					]
				}
			]
		},
		optimization: {
			chunkIds: 'deterministic',
			mergeDuplicateChunks: true,
			minimizer: [
				new TerserPlugin({
					extractComments: false,
					parallel: true,
					terserOptions: {
						compress: {
							// Drop console.log|console.info|console.debug
							// Keep console.warn|console.error
							pure_funcs: [
								'console.log',
								'console.info',
								'console.debug'
							]
						}
					}
				})
			],
			providedExports: false,
			removeAvailableModules: true,
			removeEmptyChunks: true,
			splitChunks: false
		},
		output: {
			filename: `static/[name]${suffixHash}.js`,
			chunkFilename: `static/[name]${suffixHash}.js`,
			path: path.resolve(__dirname, './build'),
			clean: true
		},
		plugins: [
			new webpack.ProgressPlugin(), // TODO: remove on mode production
			new MiniCssExtractPlugin({
				chunkFilename: `static/[name]${suffixHash}.css`,
				filename: `static/[name]${suffixHash}.css`
			}),
			new HtmlWebpackPlugin({
				filename: 'index.html',
				template: path.resolve(__dirname, './public/index.html'),
				publicPath: '',
				inject: false,
				chunks: ['app'],
				minify: true
			}),
			new webpack.optimize.ModuleConcatenationPlugin()
		],
		stats: {
			assets: true,
			assetsSort: '!size',
			children: false,
			chunkModules: false,
			chunks: false,
			colors: true,
			entrypoints: false,
			excludeAssets: /.map$/,
			hash: false,
			modules: false,
			timings: true
		}
	};
};
