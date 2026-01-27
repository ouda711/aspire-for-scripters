import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import chalk from 'chalk';
import { runPrompts } from '../prompts/index.js';
import { logger } from '../utils/logger.js';
import type { ProjectConfig } from '../types/index.js';

/**
 * Initialize a new Aspire for Scripters project
 */
export async function initCommand(projectName?: string): Promise<void> {
  try {
    let config: ProjectConfig;

    if (projectName) {
      // Quick mode: use project name from CLI argument
      logger.info(`Initializing project: ${chalk.cyan(projectName)}`);
      logger.warning('Quick mode: Using default configuration. Run without project name for custom setup.\n');
      
      // Create minimal config with defaults
      config = createDefaultConfig(projectName);
    } else {
      // Interactive mode: run full prompts
      config = await runPrompts();
    }

    // Create project
    await createProject(config);

    // Success message
    displaySuccessMessage(config);
  } catch (error) {
    logger.error('Failed to initialize project');
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }
    process.exit(1);
  }
}

/**
 * Create default configuration for quick mode
 */
function createDefaultConfig(projectName: string): ProjectConfig {
  return {
    name: projectName,
    packageManager: 'npm',
    framework: 'express',
    includeAuth: true,
    includeSwagger: true,
    sqlDatabase: 'postgresql',
    nosqlDatabases: ['redis'],
    frontend: 'none',
    monorepo: false,
    includeDocker: true,
    includeKubernetes: false,
    includeMessageQueue: false,
    includeTesting: true,
    includeCI: true,
    ciProvider: 'github',
    includeHusky: true,
    includeLogging: true,
    loggingLibrary: 'pino',
    includeMetrics: false,
  };
}

/**
 * Create the project structure
 */
async function createProject(config: ProjectConfig): Promise<void> {
  const spinner = ora('Creating project structure...').start();

  try {
    const projectPath = path.resolve(process.cwd(), config.name);

    // Check if directory already exists
    if (await fs.pathExists(projectPath)) {
      spinner.fail();
      throw new Error(`Directory "${config.name}" already exists. Please choose a different name.`);
    }

    // Create project directory
    await fs.ensureDir(projectPath);
    spinner.text = 'Project directory created';

    // Save configuration for next steps
    await fs.writeJson(path.join(projectPath, '.aspire-config.json'), config, { spaces: 2 });
    spinner.succeed('Project configuration saved');

    // TODO: In next steps, we'll generate files here
    spinner.info('Template generation coming in Step 1.3...');
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

/**
 * Display success message with next steps
 */
function displaySuccessMessage(config: ProjectConfig): void {
  console.log('\n' + chalk.green.bold('✓ Project initialized successfully!') + '\n');

  console.log(chalk.cyan('Next steps:') + '\n');
  console.log(`  ${chalk.gray('$')} cd ${config.name}`);
  console.log(`  ${chalk.gray('$')} ${config.packageManager} install`);
  console.log(`  ${chalk.gray('$')} ${config.packageManager} run dev`);
  console.log('');

  console.log(chalk.gray('Configuration saved to .aspire-config.json'));
  console.log(chalk.gray('You can modify it before generating files.'));
  console.log('');
}
