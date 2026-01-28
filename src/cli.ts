#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { initCommand } from './commands/init.js';
import { devCommand } from './commands/dev.js';

const program = new Command();

// Display banner
console.log(
  chalk.cyan(
    figlet.textSync('Aspire for Scripters', {
      horizontalLayout: 'default',
      verticalLayout: 'default',
    })
  )
);

program
  .name('aspire-for-scripters')
  .description('Application orchestration and initialization tool for JavaScript/TypeScript frameworks')
  .version('0.1.0');

// Init command - now fully functional with prompts
program
  .command('init [project-name]')
  .description('Initialize a new Aspire for Scripters project')
  .action(async (projectName?: string) => {
    await initCommand(projectName);
  });

// Dev command (still placeholder)
program
  .command('dev')
  .description('Start all services in development mode')
  .option('-p, --path <path>', 'Project path')
  .action(async (options) => {
    await devCommand(options.path);
  });

// Version info
program.on('--help', () => {
  console.log('');
  console.log(chalk.cyan('Examples:'));
  console.log('  $ aspire-for-scripters init              # Interactive mode');
  console.log('  $ aspire-for-scripters init my-app       # Quick mode with defaults');
  console.log('  $ afs init                               # Shorthand');
});

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
