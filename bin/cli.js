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
			`You are running Node ${currentNodeVersion}.\nCreate Costro App requires Node 12 or higher.\nPlease update your version of Node.`
		)
	);
	process.exit(1);
}

const {
	name: packageName,
	version: packageVersion
} = require('../package.json');
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
				name: 'confirmDirectory',
				message: 'Directory not empty. Continue?',
				initial: false
			});

			// Exit if no answer (ctrl + c)
			if (!response.confirmDirectory) {
				process.exit(1);
			}

			console.log();
		}
	} else {
		fs.mkdirSync(cwd, { recursive: true });
	}

	// Create cache directory
	const CACHE_DIR = '.cache';
	if (!fs.existsSync(`${cwd}/${CACHE_DIR}`)) {
		fs.mkdirSync(`${cwd}/${CACHE_DIR}`);
	} else {
		fs.remove(`${cwd}/${CACHE_DIR}`);
	}

	// Declare async tasks
	const tasks1 = new Listr([
		{
			title: `Fetch templates`,
			task: async () => {
				await execa('npm', [
					'install',
					'git+https://github.com/costrojs/costro-templates.git',
					'--prefix',
					`${cwd}/${CACHE_DIR}`,
					'--no-audit' // https://github.com/facebook/create-react-app/issues/11174
				]);
			}
		}
	]);

	// Run async tasks
	await tasks1.run();

	console.log();

	// Build the list of templates from GitHub repository
	const templatesPath = `${cwd}/${CACHE_DIR}/node_modules/costro-templates/templates`;
	const templates = fs.readdirSync(templatesPath).map((name) => ({
		title: name[0].toUpperCase() + name.slice(1),
		value: name
	}));

	// Prompt template choice to the user
	const options = await prompts([
		{
			type: 'select',
			name: 'template',
			message: 'Which Costro app template?',
			choices: templates
		}
	]);

	// Exit if no answer (ctrl + c)
	if (!options.template) {
		process.exit(1);
	}

	console.log();

	const templatePath = `${templatesPath}/${options.template}`;
	const tasks2 = new Listr([
		{
			title: 'Create project',
			task: async () => {
				return new Promise((resolve, reject) => {
					fs.copy(templatePath, cwd, function (err) {
						if (err) {
							console.log(
								'An error occured while copying the folder.'
							);
							return console.error(err);
						}
						// Update package.json (default version and template version)
						const packageJson = fs.readJsonSync(
							`${templatePath}/package.json`
						);
						packageJson['version'] = '1.0.0';
						packageJson['costro-templates'] = packageJson.version;
						fs.writeJsonSync(`${cwd}/package.json`, packageJson, {
							spaces: '\t'
						});
						// Remove the cache
						fs.remove(`${cwd}/${CACHE_DIR}`);
						resolve();
					});
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
						'--save-exact'
					],
					{
						cwd
					}
				);
			}
		}
	]);

	// Run async tasks
	await tasks2.run();

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
