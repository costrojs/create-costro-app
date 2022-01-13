#!/usr/bin/env node

('use strict');

const fs = require('fs');
const chalk = require('chalk');
const { Command } = require('commander');
const prompts = require('prompts');
const spawn = require('cross-spawn');
const ora = require('ora');

const currentNodeVersion = process.versions.node;
const majorVersion = currentNodeVersion.split('.')[0];

if (majorVersion < 12) {
	console.error(
		chalk.red(
			'You are running Node ' +
				currentNodeVersion +
				'.\n' +
				'Create Costro App requires Node 12 or higher. \n' +
				'Please update your version of Node.'
		)
	);
	process.exit(1);
}

// const program = new Command();

const {
	name: packageName,
	version: packageVersion
} = require('./package.json');
console.log(
	`\n${chalk.green.bold(`Welcome to Create Costro CLI v${packageVersion}`)}\n`
);

const cwd = process.argv[2] || '.';

function isUsingYarn() {
	return (process.env.npm_config_user_agent || '').indexOf('yarn') === 0;
}

(async () => {
	// if (fs.existsSync(cwd)) {
	// 	if (fs.readdirSync(cwd).length > 0) {
	// 		const response = await prompts({
	// 			type: 'confirm',
	// 			name: 'value',
	// 			message: 'Directory not empty. Continue?',
	// 			initial: false
	// 		});

	// 		if (!response.value) {
	// 			process.exit(1);
	// 		}
	// 	}
	// } else {
	// 	fs.mkdirSync(cwd, { recursive: true });
	// }

	let command;
	let args;

	if (isUsingYarn()) {
	} else {
		command = 'npm';
		args = [
			'install',
			'--no-audit', // https://github.com/facebook/create-react-app/issues/11174
			'--save',
			'--save-exact',
			'--loglevel',
			'error'
		].concat([]);
		// args.push('--verbose');
	}

	// (Costro, webpack, Babel, ESLint, Prettier, Jest)
	const options = await prompts([
		{
			type: 'select',
			name: 'template',
			message: 'Which template?',
			choices: [
				{
					title: 'JavaScript',
					value: 'default'
				},
				{
					title: 'TypeScript',
					value: 'typescript'
				}
			]
		}
	]);

	// console.log(options.template);

	let spinner = ora({
		text: 'Creating project\n',
		color: 'blue'
	}).start();

	try {
		const repos = await fetch(
			`https://github.com/costrojs/costro-templates`
		).then((r) => r.json());
		console.log(repos);
		// await writeFile(cacheFilePath, JSON.stringify(repos, null, 2), 'utf-8');
	} catch (err) {
		error(`\nFailed to update template cache\n ${err}`);
	}

	// const text = `Installing ${chalk.cyan('costro')}, ${chalk.cyan(
	// 	'webpack'
	// )}, ${chalk.cyan('Babel')}, ${chalk.cyan('ESLint')}, ${chalk.cyan(
	// 	'Prettier'
	// )} and ${chalk.cyan('Jest')} ${` with ${chalk.cyan(packageName)}`}`;
	// spinner.text = text;

	spinner.text = 'Installing dependencies:\n';
	spinner.stopAndPersist();
	// const child = spawn(command, args, { stdio: 'inherit' });

	spinner.succeed('Done!\n');
})();
