#!/usr/bin/env node

('use strict');

const path = require('path');
const fs = require('fs-extra');
const { bold, red, green, cyan, gray } = require('chalk');
const prompts = require('prompts');
const Listr = require('listr');
const execa = require('execa');

const currentNodeVersion = process.versions.node;
const majorVersion = currentNodeVersion.split('.')[0];

// Check the minimum version of Node.js
if (majorVersion < 12) {
	console.error(
		red(
			'You are running Node ' +
				currentNodeVersion +
				'.\n' +
				'Create Costro App requires Node 12 or higher. \n' +
				'Please update your version of Node.'
		)
	);
	process.exit(1);
}

const {
	name: packageName,
	version: packageVersion
} = require('./package.json');
const cwd = process.argv[2] || '.';

function isYarn() {
	return (process.env.npm_config_user_agent || '').indexOf('yarn') === 0;
}

(async () => {
	console.log(
		`\n${green.bold(`Welcome to the Create Costro CLI`)} ${gray(
			`(v${packageVersion})`
		)}\n`
	);

	// Check the target directory
	if (fs.existsSync(cwd)) {
		if (fs.readdirSync(cwd).length > 0) {
			const response = await prompts({
				type: 'confirm',
				name: 'value',
				message: 'Directory not empty. Continue?',
				initial: false
			});

			if (!response.value) {
				process.exit(1);
			}
		}
	} else {
		fs.mkdirSync(cwd, { recursive: true });
	}

	// Choose the template
	const options = await prompts([
		{
			type: 'select',
			name: 'template',
			message: 'Which Costro app template?',
			choices: [
				{
					title: 'JavaScript',
					description:
						'Packages included: webpack, Babel, ESLint, Prettier, Jest',
					value: 'default'
				},
				{
					title: 'TypeScript',
					disabled: true,
					description:
						'Packages included: TypeScript, webpack, Babel, ESLint, Prettier, Jest',
					value: 'typescript'
				}
			]
		}
	]);

	// Create cache directory
	const CACHE_DIR = '.cache';
	if (!fs.existsSync(`${cwd}/${CACHE_DIR}`)) {
		fs.mkdirSync(`${cwd}/${CACHE_DIR}`);
	} else {
		fs.remove(`${cwd}/${CACHE_DIR}`);
	}

	// Declare async tasks
	const tasks = new Listr([
		{
			title: `Fetch template ${options.template}`,
			task: async () => {
				const child = await execa('git', [
					'clone',
					'https://github.com/costrojs/costro-templates.git',
					`${cwd}/${CACHE_DIR}/costro-templates`
				]);
			}
		},
		{
			title: 'Create project',
			task: async () => {
				return new Promise((resolve, reject) => {
					const templatePath = `${cwd}/${CACHE_DIR}/costro-templates/templates/${options.template}`;
					if (fs.existsSync(templatePath)) {
						fs.copy(templatePath, cwd, function (err) {
							if (err) {
								console.log(
									'An error occured while copying the folder.'
								);
								return console.error(err);
							}

							fs.remove(`${cwd}/${CACHE_DIR}`);

							resolve();
						});
					} else {
						reject(
							new Error(
								red(
									`Error - The template path "${templatePath}" is unknown. \n`
								)
							)
						);
					}
				});
			}
		},
		{
			title: 'Installing dependencies',
			enabled: () => !isYarn(),
			task: async () => {
				const child = await execa(
					'npm',
					[
						'install',
						'--no-audit', // https://github.com/facebook/create-react-app/issues/11174
						'--save',
						'--save-exact',
						'--loglevel',
						'error'
					],
					{
						cwd
					}
				);
			}
		}
	]);

	// Run async tasks
	await tasks.run();

	// Display project informations
	console.log(bold(green('\nYour project is ready!\n')));
	console.log('Available npm scripts:');
	console.log(`- ${bold.cyan('npm run dev')}`);
	console.log(`- ${bold.cyan('npm run build')}`);
	console.log(`- ${bold.cyan('npm run lint')}`);
	console.log(`- ${bold.cyan('npm run jest')}`);
	console.log(`\nTo close the dev server, hit ${bold(cyan('Ctrl-C'))}`);
	console.log(
		`Problems? Open an issue on ${cyan(
			'https://github.com/costrojs/create-costro/issues'
		)} if none exists already.`
	);
})();
