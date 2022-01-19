#!/usr/bin/env node

('use strict');

import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { execa } from 'execa';
import inquirer from 'inquirer';
import ora from 'ora';
import { Command } from 'commander/esm.mjs';

const { bold, red, green, cyan, gray } = chalk;
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

const cwd = fs.realpathSync(process.cwd());
const targetDir = `${fs.realpathSync(process.cwd())}/${process.argv[2] || ''}`;
const packageJson = fs.readJsonSync(`${cwd}/package.json`);
const program = new Command();
program
	.name(`${packageJson.name} <directory>`) // Show the directory here to display it before the options in help
	// .argument('<directory>')
	.showHelpAfterError('(add --help for additional information)')
	.option('--template <name>', 'specify the template name')
	.version(packageJson.version, '-v, --version', 'show the Create Costro App version');

program.parse(process.argv);
const commanderOptions = program.opts();

(async () => {
	console.log(green.bold('Welcome to the Create Costro App CLI\n'));

	// Check the target directory
	if (fs.existsSync(targetDir)) {
		if (fs.readdirSync(targetDir).length > 0) {
			const response = await inquirer.prompt([
				{
					type: 'confirm',
					name: 'confirmDirectory',
					message: 'Directory not empty. Continue?'
				}
			]);
			// Exit if no answer (ctrl + c)
			if (!response.confirmDirectory) {
				process.exit(1);
			}
		}
	} else {
		fs.mkdirSync(targetDir, { recursive: true });
	}

	const spinner = ora();

	if (commanderOptions.template) {
		spinner.start(`Fetching template ${commanderOptions.template}`);
	} else {
		spinner.start(`Fetching templates`);
	}

	// Create cache directory
	const cacheDir = '.cache';
	if (!fs.existsSync(`${targetDir}/${cacheDir}`)) {
		fs.mkdirSync(`${targetDir}/${cacheDir}`);
	} else {
		fs.remove(`${targetDir}/${cacheDir}`);
	}

	// Fetching templates
	await execa('npm', [
		'install',
		'git+https://github.com/costrojs/costro-templates.git', // TODO: update to npm package instead of GitHub url
		'--prefix',
		`${targetDir}/${cacheDir}`,
		'--no-audit'
	]);
	spinner.succeed();

	// Build the list of templates from GitHub repository
	const templatesPath = `${targetDir}/${cacheDir}/node_modules/costro-templates/templates`;
	const templates = fs.readdirSync(templatesPath);

	// Check if template flag was set or prompt the choice to the user
	let template;
	if (commanderOptions.template) {
		template = commanderOptions.template;
	} else {
		const options = await inquirer.prompt([
			{
				type: 'list',
				name: 'template',
				message: 'Which Costro app template?',
				choices: templates
			}
		]);

		// Exit if no answer (ctrl + c)
		if (!options.template) {
			process.exit(1);
		}

		template = options.template;
	}

	const templatePath = `${templatesPath}/${template}`;
	if (!fs.existsSync(templatePath)) {
		spinner.fail(`Template ${template} is unknown.`);
		process.exit(1);
	}

	spinner.start('Creating project');
	fs.copy(templatePath, targetDir, function (err) {
		if (err) {
			console.log('An error occured while copying the folder.');
			return console.error(err);
		}

		// Update package.json (default version and template version)
		const packageJson = fs.readJsonSync(`${templatePath}/package.json`);
		packageJson['version'] = '1.0.0';
		packageJson['costro-templates'] = packageJson.version;
		fs.writeJsonSync(`${targetDir}/package.json`, packageJson, {
			spaces: '\t'
		});

		// Rename gitignore to prevent npm from renaming it to .npmignore
		// See: https://github.com/npm/npm/issues/1862
		fs.moveSync(`${targetDir}/gitignore`, `${targetDir}/.gitignore`);

		// Remove the cache
		fs.remove(`${targetDir}/${cacheDir}`);
	});
	spinner.succeed();

	spinner.start('Installing dependencies');
	const child = await execa(
		'npm',
		[
			'install',
			'--no-audit', // https://github.com/facebook/create-react-app/issues/11174
			'--save',
			'--save-exact'
		],
		{
			cwd: targetDir
		}
	);
	spinner.succeed();

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
