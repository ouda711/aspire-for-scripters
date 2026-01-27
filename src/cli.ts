#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';

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

// Main init command (placeholder for now)
program
  .command('init [project-name]')
  .description('Initialize a new Aspire for Scripters project')
  .action((projectName) => {
    console.log(chalk.green('✓ Initialize command triggered'));
    console.log(chalk.blue(`Project name: ${projectName || 'Not specified'}`));
    console.log(chalk.yellow('\n⚠️  Full implementation coming in next steps...'));
  });

// Dev command (placeholder)
program
  .command('dev')
  .description('Start all services in development mode')
  .action(() => {
    console.log(chalk.yellow('⚠️  Dev command - Implementation coming soon...'));
  });

// Version info
program.on('--help', () => {
  console.log('');
  console.log(chalk.cyan('Examples:'));
  console.log('  $ aspire-for-scripters init my-app');
  console.log('  $ afs init my-app');
  console.log('  $ afs dev');
});

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
