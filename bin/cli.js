#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { execa } from 'execa';
import inquirer from 'inquirer';
import ora from 'ora';
import { Command } from 'commander/esm.mjs';

const { bold, red, green, cyan } = chalk;
const CACHE_DIR = '.cache';

/**
 * Check Node.js version
 */
function checkNodeVersion() {
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
}

/**
 * Create Costro App
 */
class CreateCostroApp {
	constructor() {
		this.customTargetDir = '';
		this.targetDir = '';
		this.templates = {
			path: '',
			pathSelected: '',
			selected: ''
		};
	}

	/**
	 * Initialize the module
	 * @async
	 */
	async init() {
		this.spinner = ora();

		await this.createCommands();

		this.targetDir = `${fs.realpathSync(process.cwd())}/${this.customTargetDir}`;
		this.templates.path = `${this.targetDir}/${CACHE_DIR}/node_modules/costro-templates/templates`;

		// Show welcome message after Commander.js to avoir showing it on help commands
		console.log(`Creating a new Costro.js app in ${green(this.targetDir)}.\n`);

		await this.checkTargetDirectory();
		this.createCacheDirectory();
		await this.fetchTemplates();
		await this.showTemplatesChoice();
		await this.createProject();
		await this.installDependencies();
		this.showEndMessage();
	}

	/**
	 * Create terminal commands
	 * @async
	 */
	async createCommands() {
		// Get the directory of the package
		// https://github.com/nodejs/help/issues/2907#issuecomment-757446568
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = path.dirname(__filename);

		// Get the package.json of the package
		const packageJson = await fs.readFile(`${__dirname}/../package.json`, 'utf8');
		const { name, version } = JSON.parse(packageJson);

		const program = new Command();
		program
			.name(`${name}`)
			.argument('[directory]', 'Custom target directory')
			.showHelpAfterError('(add --help for additional information)')
			.option('-t, --template <name>', 'specify the template name')
			.version(version, '-v, --version', 'show the Create Costro App version')
			.action((directory, options, command) => {
				if (directory) {
					this.customTargetDir = directory;
				}
			});

		program.parse(process.argv);
		this.commandsOptions = program.opts();
	}

	/**
	 * Check the target directory
	 * @async
	 */
	async checkTargetDirectory() {
		if (fs.existsSync(this.targetDir)) {
			if (fs.readdirSync(this.targetDir).length) {
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
			// Create the target directory
			fs.mkdirSync(this.targetDir, { recursive: true });
		}
	}

	/**
	 * Create the cache directory
	 */
	createCacheDirectory() {
		if (!fs.existsSync(`${this.targetDir}/${CACHE_DIR}`)) {
			fs.mkdirSync(`${this.targetDir}/${CACHE_DIR}`);
		} else {
			fs.remove(`${this.targetDir}/${CACHE_DIR}`);
		}
	}

	/**
	 * Fetch the latest templates from Costro Templates project
	 * @async
	 */
	async fetchTemplates() {
		if (this.commandsOptions.template) {
			this.spinner.start(`Fetching template "${this.commandsOptions.template}"`);
		} else {
			this.spinner.start('Fetching templates');
		}

		await execa('npm', [
			'install',
			'git+https://github.com/costrojs/costro-templates.git', // TODO: update to npm package instead of GitHub url
			'--prefix',
			`${this.targetDir}/${CACHE_DIR}`,
			'--no-audit'
		]);

		this.spinner.succeed();
	}

	/**
	 * Show the templates choice
	 * @async
	 */
	async showTemplatesChoice() {
		// Build the list of templates from GitHub repository
		const templatesList = fs.readdirSync(this.templates.path);

		// Check if template flag was set or prompt the choice to the user
		if (this.commandsOptions.template) {
			this.templates.selected = this.commandsOptions.template;
		} else if (templatesList) {
			const options = await inquirer.prompt([
				{
					type: 'list',
					name: 'template',
					message: 'Which Costro app template?',
					choices: templatesList
				}
			]);

			// Exit if no answer (ctrl + c)
			if (!options.template) {
				process.exit(1);
			}

			this.templates.selected = options.template;
		}

		if (this.templates.selected) {
			this.templates.pathSelected = `${this.templates.path}/${this.templates.selected}`;

			if (!fs.existsSync(this.templates.pathSelected)) {
				this.spinner.fail(`Template "${this.templates.selected}" is unknown.`);
				fs.rmSync(this.targetDir, { recursive: true, force: true });
				process.exit(1);
			}
		}
	}

	/**
	 * Create the project
	 * @returns {Promise<Boolean>} The project is created
	 */
	createProject() {
		return new Promise((resolve) => {
			this.spinner.start('Creating project');

			fs.copy(this.templates.pathSelected, this.targetDir, (err) => {
				if (err) {
					console.log('An error occured while copying the template.');
					return console.error(err);
				}

				// Update the package.json in the project
				const packageJson = fs.readJsonSync(`${this.templates.pathSelected}/package.json`);
				packageJson['version'] = '1.0.0';
				packageJson['costro-templates'] = packageJson.version;
				fs.writeJsonSync(`${this.targetDir}/package.json`, packageJson, {
					spaces: '\t' // tabs
				});

				// Rename the gitignore file
				// It was renamed to prevent npm from renaming it to .npmignore
				// See: https://github.com/npm/npm/issues/1862
				const gitIgnorePath = `${this.targetDir}/gitignore`;
				if (fs.existsSync(gitIgnorePath)) {
					fs.moveSync(gitIgnorePath, `${this.targetDir}/.gitignore`);
				}

				// Remove the cache
				fs.remove(`${this.targetDir}/${CACHE_DIR}`);

				this.spinner.succeed();
				resolve(true);
			});
		});
	}

	/**
	 * Install the project dependencies
	 * @async
	 */
	async installDependencies() {
		this.spinner.start('Installing dependencies');

		await execa('npm', ['install', '--no-audit', '--save', '--save-exact'], {
			cwd: this.targetDir
		});

		this.spinner.succeed();
	}

	/**
	 * Show the useful informations at the end of the process
	 */
	showEndMessage() {
		console.log(bold(green('\nYour project is ready!\n')));
		console.log('Available npm scripts:');
		console.log(`- ${bold.cyan('npm run dev')}`);
		console.log(`- ${bold.cyan('npm run jest')}`);
		console.log(`- ${bold.cyan('npm run lint')}`);
		console.log(`- ${bold.cyan('npm run build')}`);
		console.log(
			`\nProblems? Open an issue at ${cyan(
				'https://github.com/costrojs/create-costro/issues'
			)} if one doesn't already exist.`
		);
	}
}

checkNodeVersion();
const createCostroApp = new CreateCostroApp();
createCostroApp.init();
