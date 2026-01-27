import path from 'path';
import ora from 'ora';
import { BaseGenerator } from './base-generator.js';
import type { ProjectConfig } from '../config/schema.js';
import { DockerComposeGenerator } from './docker-compose-generator.js';

/**
 * NestJS project generator
 */
export class NestJSGenerator extends BaseGenerator {
  constructor(config: ProjectConfig, projectPath: string) {
    const templatePath = path.join(process.cwd(), 'templates/nestjs');
    super(config, projectPath, templatePath);
  }

  /**
   * Generate NestJS project
   */
  async generate(): Promise<void> {
    const spinner = ora('Generating NestJS project...').start();

    try {
      const context = this.getTemplateContext();

      // 1. Generate base files
      spinner.text = 'Generating base configuration files...';
      await this.generateBaseFiles(context);

      // 2. Generate source files
      spinner.text = 'Generating application modules...';
      await this.generateSourceFiles(context);

      // 3. Generate conditional features
      await this.generateConditionalFeatures(context, spinner);

      // 4. Generate Docker Compose if enabled
      if (this.config.includeDocker) {
        spinner.text = 'Generating Docker Compose configuration...';
        const dockerGenerator = new DockerComposeGenerator(this.config, this.projectPath);
        await dockerGenerator.generate();
      }

      // 5. Create empty directories
      await this.createEmptyDirectories();

      spinner.succeed('NestJS project generated successfully!');
    } catch (error) {
      spinner.fail('Failed to generate NestJS project');
      throw error;
    }
  }

  /**
   * Generate base configuration files
   */
  private async generateBaseFiles(context: any): Promise<void> {
    await this.generateFile('base/.gitignore.template', '.gitignore', context);
    await this.generateFile('base/.eslintrc.js.template', '.eslintrc.js', context);
    await this.generateFile('base/.prettierrc.template', '.prettierrc', context);
    await this.generateFile('base/.env.example.template', '.env.example', context);
    await this.generateFile('base/README.md.template', 'README.md', context);
    await this.generateFile('base/package.json.template', 'package.json', context);
    await this.generateFile('base/tsconfig.json.template', 'tsconfig.json', context);
    await this.generateFile('base/tsconfig.build.json.template', 'tsconfig.build.json', context);
    await this.generateFile('base/nest-cli.json.template', 'nest-cli.json', context);
  }

  /**
   * Generate source files
   */
  private async generateSourceFiles(context: any): Promise<void> {
    // Main entry point
    await this.generateFile('src/main.ts.template', 'src/main.ts', context);

    // App module and base files
    await this.generateFile('src/app.module.ts.template', 'src/app.module.ts', context);
    await this.generateFile('src/app.controller.ts.template', 'src/app.controller.ts', context);
    await this.generateFile('src/app.service.ts.template', 'src/app.service.ts', context);

    // Configuration module
    await this.generateFile(
      'src/config/config.module.ts.template',
      'src/config/config.module.ts',
      context
    );
    await this.generateFile(
      'src/config/configuration.ts.template',
      'src/config/configuration.ts',
      context
    );

    // Common utilities
    await this.generateFile(
      'src/common/filters/http-exception.filter.ts.template',
      'src/common/filters/http-exception.filter.ts',
      context
    );
    await this.generateFile(
      'src/common/interceptors/logging.interceptor.ts.template',
      'src/common/interceptors/logging.interceptor.ts',
      context
    );
    await this.generateFile(
      'src/common/interceptors/transform.interceptor.ts.template',
      'src/common/interceptors/transform.interceptor.ts',
      context
    );
    await this.generateFile(
      'src/common/dto/pagination.dto.ts.template',
      'src/common/dto/pagination.dto.ts',
      context
    );

    // Health module
    await this.generateFile(
      'src/health/health.module.ts.template',
      'src/health/health.module.ts',
      context
    );
    await this.generateFile(
      'src/health/health.controller.ts.template',
      'src/health/health.controller.ts',
      context
    );
  }

  /**
   * Generate conditional features based on configuration
   */
  private async generateConditionalFeatures(context: any, spinner: ora.Ora): Promise<void> {
    // Database setup
    if (context.hasDatabase) {
      spinner.text = 'Setting up database module...';
      await this.generateDatabaseFiles(context);
    }

    // Authentication
    if (this.config.includeAuth) {
      spinner.text = 'Setting up authentication module...';
      await this.generateAuthFiles(context);
    }

    // Logging
    if (this.config.includeLogging) {
      spinner.text = 'Setting up logging module...';
      await this.generateLoggingFiles(context);
    }

    // Testing
    if (this.config.includeTesting) {
      spinner.text = 'Setting up testing framework...';
      await this.generateTestFiles(context);
    }

    // Docker
    if (this.config.includeDocker) {
      spinner.text = 'Creating Docker configuration...';
      await this.generateDockerFiles(context);
    }

    // CI/CD
    if (this.config.includeCI) {
      spinner.text = 'Setting up CI/CD pipeline...';
      await this.generateCIFiles(context);
    }
  }

  /**
   * Generate database-related files
   */
  private async generateDatabaseFiles(context: any): Promise<void> {
    await this.generateFile(
      'src/config/database.config.ts.template',
      'src/config/database.config.ts',
      context
    );
    await this.generateFile(
      'src/database/database.module.ts.template',
      'src/database/database.module.ts',
      context
    );

    // Generate users module if we have a SQL database
    if (this.config.sqlDatabase) {
      await this.generateFile(
        'src/users/users.module.ts.template',
        'src/users/users.module.ts',
        context
      );
      await this.generateFile(
        'src/users/users.controller.ts.template',
        'src/users/users.controller.ts',
        context
      );
      await this.generateFile(
        'src/users/users.service.ts.template',
        'src/users/users.service.ts',
        context
      );
      await this.generateFile(
        'src/users/entities/user.entity.ts.template',
        'src/users/entities/user.entity.ts',
        context
      );
      await this.generateFile(
        'src/users/dto/create-user.dto.ts.template',
        'src/users/dto/create-user.dto.ts',
        context
      );
      await this.generateFile(
        'src/users/dto/update-user.dto.ts.template',
        'src/users/dto/update-user.dto.ts',
        context
      );
      await this.generateFile(
        'src/users/users.repository.ts.template',
        'src/users/users.repository.ts',
        context
      );
    }
  }

  /**
   * Generate authentication files
   */
  private async generateAuthFiles(context: any): Promise<void> {
    await this.generateFile(
      'src/common/guards/jwt-auth.guard.ts.template',
      'src/common/guards/jwt-auth.guard.ts',
      context
    );
    await this.generateFile(
      'src/common/decorators/public.decorator.ts.template',
      'src/common/decorators/public.decorator.ts',
      context
    );
    await this.generateFile(
      'src/auth/auth.module.ts.template',
      'src/auth/auth.module.ts',
      context
    );
    await this.generateFile(
      'src/auth/auth.controller.ts.template',
      'src/auth/auth.controller.ts',
      context
    );
    await this.generateFile(
      'src/auth/auth.service.ts.template',
      'src/auth/auth.service.ts',
      context
    );
    await this.generateFile(
      'src/auth/strategies/jwt.strategy.ts.template',
      'src/auth/strategies/jwt.strategy.ts',
      context
    );
    await this.generateFile(
      'src/auth/dto/login.dto.ts.template',
      'src/auth/dto/login.dto.ts',
      context
    );
    await this.generateFile(
      'src/auth/dto/register.dto.ts.template',
      'src/auth/dto/register.dto.ts',
      context
    );
  }

  /**
   * Generate logging files
   */
  private async generateLoggingFiles(context: any): Promise<void> {
    await this.generateFile(
      'src/logger/logger.module.ts.template',
      'src/logger/logger.module.ts',
      context
    );
    await this.generateFile(
      'src/logger/logger.service.ts.template',
      'src/logger/logger.service.ts',
      context
    );
  }

  /**
   * Generate test files
   */
  private async generateTestFiles(context: any): Promise<void> {
    await this.generateFile('test/app.e2e-spec.ts.template', 'test/app.e2e-spec.ts', context);
    await this.generateFile('test/jest-e2e.json.template', 'test/jest-e2e.json', context);
  }

  /**
   * Generate Docker files
   */
  private async generateDockerFiles(context: any): Promise<void> {
    await this.generateFile('docker/Dockerfile.template', 'Dockerfile', context);
    await this.generateFile(
      'docker/docker-compose.yml.template',
      'docker-compose.yml',
      context
    );
  }

  /**
   * Generate CI/CD files
   */
  private async generateCIFiles(context: any): Promise<void> {
    if (this.config.ciProvider === 'github') {
      await this.generateFile(
        '.github/workflows/ci.yml.template',
        '.github/workflows/ci.yml',
        context
      );
    } else if (this.config.ciProvider === 'gitlab') {
      await this.generateFile('.gitlab-ci.yml.template', '.gitlab-ci.yml', context);
    }
  }

  /**
   * Create empty directories that need to exist
   */
  private async createEmptyDirectories(): Promise<void> {
    await this.createDirectory('src/database/migrations');
    await this.createDirectory('logs');
  }
}
