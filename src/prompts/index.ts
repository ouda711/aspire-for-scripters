import inquirer from 'inquirer';
import chalk from 'chalk';
import type { PromptAnswers, ProjectConfig } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { projectPrompts } from './project.prompts.js';
import { backendPrompts } from './backend.prompts.js';
import { databasePrompts } from './database.prompts.js';
import { frontendPrompts } from './frontend.prompts.js';
import { additionalPrompts } from './additional.prompts.js';

/**
 * Main prompts orchestrator
 * Guides user through all configuration questions
 */
export async function runPrompts(): Promise<ProjectConfig> {
  console.log(
    chalk.cyan('\n🚀 Welcome to Aspire for Scripters!\n') +
      chalk.gray('Let\'s set up your project step by step.\n')
  );

  try {
    // Section 1: Project Information
    logger.section('Project Information');
    const projectAnswers = await inquirer.prompt(projectPrompts);

    // Section 2: Backend Configuration
    logger.section('Backend Framework');
    const backendAnswers = await inquirer.prompt(backendPrompts);

    // Section 3: Database Configuration
    logger.section('Database Configuration');
    const databaseAnswers = await inquirer.prompt(databasePrompts);

    // Section 4: Frontend Configuration
    logger.section('Frontend Configuration');
    const frontendAnswers = await inquirer.prompt(frontendPrompts);

    // Section 5: Additional Features
    logger.section('Additional Features');
    const additionalAnswers = await inquirer.prompt(additionalPrompts);

    // Combine all answers
    const allAnswers: PromptAnswers = {
      ...projectAnswers,
      ...backendAnswers,
      ...databaseAnswers,
      ...frontendAnswers,
      ...additionalAnswers,
    };

    // Transform to ProjectConfig
    const config: ProjectConfig = transformAnswersToConfig(allAnswers);

    // Display configuration summary
    displayConfigSummary(config);

    // Confirm before proceeding
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Proceed with this configuration?',
        default: true,
      },
    ]);

    if (!confirmed) {
      logger.warning('Project creation cancelled.');
      process.exit(0);
    }

    return config;
  } catch (error) {
    if (error instanceof Error && error.message.includes('User force closed')) {
      logger.warning('\nProject creation cancelled by user.');
      process.exit(0);
    }
    throw error;
  }
}

/**
 * Transform prompt answers to ProjectConfig
 */
function transformAnswersToConfig(answers: PromptAnswers): ProjectConfig {
  const config: ProjectConfig = {
    name: answers.projectName,
    description: answers.description,
    author: answers.author,
    packageManager: answers.packageManager,
    framework: answers.framework,
    includeAuth: answers.includeAuth,
    includeSwagger: answers.includeSwagger,
    sqlDatabase: answers.sqlDatabase === 'none' ? undefined : answers.sqlDatabase,
    nosqlDatabases: answers.nosqlDatabases || [],
    frontend: answers.frontend,
    monorepo: answers.monorepo || false,
    includeDocker: answers.includeDocker,
    includeKubernetes: answers.includeKubernetes,
    includeMessageQueue: answers.includeMessageQueue,
    messageQueue: answers.messageQueue,
    includeTesting: answers.includeTesting,
    includeCI: answers.includeCI,
    ciProvider: answers.ciProvider,
    includeHusky: answers.includeHusky,
    includeLogging: answers.includeLogging,
    loggingLibrary: answers.loggingLibrary,
    includeMetrics: answers.includeMetrics,
  };

  return config;
}

/**
 * Display configuration summary
 */
function displayConfigSummary(config: ProjectConfig): void {
  console.log('\n' + chalk.bold.cyan('📋 Configuration Summary') + '\n');

  const summary = [
    ['Project Name', config.name],
    ['Package Manager', config.packageManager],
    ['Backend Framework', config.framework],
    ['SQL Database', config.sqlDatabase || 'None'],
    ['NoSQL Databases', config.nosqlDatabases.length > 0 ? config.nosqlDatabases.join(', ') : 'None'],
    ['Frontend', config.frontend === 'none' ? 'None' : config.frontend],
    ['Docker', config.includeDocker ? '✓' : '✗'],
    ['Kubernetes', config.includeKubernetes ? '✓' : '✗'],
    ['Testing', config.includeTesting ? '✓' : '✗'],
    ['CI/CD', config.includeCI ? `✓ (${config.ciProvider})` : '✗'],
    ['Authentication', config.includeAuth ? '✓' : '✗'],
    ['API Docs', config.includeSwagger ? '✓' : '✗'],
  ];

  summary.forEach(([key, value]) => {
    console.log(`  ${chalk.gray(key + ':')} ${chalk.white(value)}`);
  });

  console.log('');
}
