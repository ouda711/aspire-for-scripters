import path from 'path';
import ora from 'ora';
import { BaseGenerator } from './base-generator.js';
import type { ProjectConfig } from '../config/schema.js';

/**
 * Express.js project generator
 */
export class ExpressGenerator extends BaseGenerator {
  constructor(config: ProjectConfig, projectPath: string) {
    // Use relative path from project root
    const templatePath = path.join(process.cwd(), 'templates/express');
    super(config, projectPath, templatePath);
  }

  /**
   * Generate Express.js project
   */
  async generate(): Promise<void> {
    const spinner = ora('Generating Express.js project...').start();

    try {
      const context = this.getTemplateContext();

      // 1. Generate base files
      spinner.text = 'Generating base configuration files...';
      await this.generateBaseFiles(context);

      // 2. Generate source files
      spinner.text = 'Generating application source files...';
      await this.generateSourceFiles(context);

      // 3. Generate conditional features
      await this.generateConditionalFeatures(context, spinner);

      // 4. Create empty directories
      await this.createEmptyDirectories();

      spinner.succeed('Express.js project generated successfully!');
    } catch (error) {
      spinner.fail('Failed to generate Express.js project');
      throw error;
    }
  }

  /**
   * Generate base configuration files
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async generateBaseFiles(context: any): Promise<void> {
    await this.generateFile('base/.gitignore.template', '.gitignore', context);
    await this.generateFile('base/.eslintrc.js.template', '.eslintrc.js', context);
    await this.generateFile('base/.prettierrc.template', '.prettierrc', context);
    await this.generateFile('base/.env.example.template', '.env.example', context);
    await this.generateFile('base/README.md.template', 'README.md', context);
    await this.generateFile('base/package.json.template', 'package.json', context);
    await this.generateFile('base/tsconfig.json.template', 'tsconfig.json', context);
    await this.generateFile('base/nodemon.json.template', 'nodemon.json', context);
  }

  /**
   * Generate source files
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async generateSourceFiles(context: any): Promise<void> {
    // Main entry points
    await this.generateFile('src/index.ts.template', 'src/index.ts', context);
    await this.generateFile('src/app.ts.template', 'src/app.ts', context);
    await this.generateFile('src/server.ts.template', 'src/server.ts', context);

    // Configuration
    await this.generateFile('src/config/index.ts.template', 'src/config/index.ts', context);
    await this.generateFile(
      'src/config/app.config.ts.template',
      'src/config/app.config.ts',
      context
    );

    // Middleware
    await this.generateFile(
      'src/middleware/error-handler.ts.template',
      'src/middleware/error-handler.ts',
      context
    );
    await this.generateFile(
      'src/middleware/request-logger.ts.template',
      'src/middleware/request-logger.ts',
      context
    );
    await this.generateFile(
      'src/middleware/async-handler.ts.template',
      'src/middleware/async-handler.ts',
      context
    );

    // Routes
    await this.generateFile('src/routes/index.ts.template', 'src/routes/index.ts', context);
    await this.generateFile(
      'src/routes/health.routes.ts.template',
      'src/routes/health.routes.ts',
      context
    );

    // Controllers
    await this.generateFile(
      'src/controllers/health.controller.ts.template',
      'src/controllers/health.controller.ts',
      context
    );

    // Utils
    await this.generateFile('src/utils/response.ts.template', 'src/utils/response.ts', context);
    await this.generateFile('src/types/index.ts.template', 'src/types/index.ts', context);
    await this.generateFile('src/types/express.d.ts.template', 'src/types/express.d.ts', context);
  }

  /**
   * Generate conditional features based on configuration
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async generateConditionalFeatures(context: any, spinner: ora.Ora): Promise<void> {
    // Database setup
    if (context.hasDatabase) {
      spinner.text = 'Setting up database configuration...';
      await this.generateDatabaseFiles(context);
    }

    // Authentication
    if (this.config.includeAuth) {
      spinner.text = 'Setting up authentication...';
      await this.generateAuthFiles(context);
    }

    // Logging
    if (this.config.includeLogging) {
      spinner.text = 'Setting up logging...';
      await this.generateLoggingFiles(context);
    }

    // Swagger/OpenAPI
    if (this.config.includeSwagger) {
      spinner.text = 'Setting up API documentation...';
      await this.generateSwaggerFiles(context);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async generateDatabaseFiles(context: any): Promise<void> {
    await this.generateFile(
      'src/config/database.config.ts.template',
      'src/config/database.config.ts',
      context
    );
    await this.generateFile(
      'src/database/connection.ts.template',
      'src/database/connection.ts',
      context
    );

    // SQL-specific files
    if (this.config.sqlDatabase) {
      await this.generateFile(
        'src/models/user.model.ts.template',
        'src/models/user.model.ts',
        context
      );
      await this.generateFile(
        'src/repositories/user.repository.ts.template',
        'src/repositories/user.repository.ts',
        context
      );
    }
  }

  /**
   * Generate authentication files
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async generateAuthFiles(context: any): Promise<void> {
    await this.generateFile(
      'src/middleware/auth.middleware.ts.template',
      'src/middleware/auth.middleware.ts',
      context
    );
    await this.generateFile('src/utils/jwt.ts.template', 'src/utils/jwt.ts', context);
    await this.generateFile(
      'src/controllers/user.controller.ts.template',
      'src/controllers/user.controller.ts',
      context
    );
    await this.generateFile(
      'src/services/user.service.ts.template',
      'src/services/user.service.ts',
      context
    );
    await this.generateFile(
      'src/routes/user.routes.ts.template',
      'src/routes/user.routes.ts',
      context
    );
  }

  /**
   * Generate logging files
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async generateLoggingFiles(context: any): Promise<void> {
    await this.generateFile('src/utils/logger.ts.template', 'src/utils/logger.ts', context);
  }

  /**
   * Generate Swagger/OpenAPI files
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async generateSwaggerFiles(context: any): Promise<void> {
    await this.generateFile('src/config/swagger.ts.template', 'src/config/swagger.ts', context);
  }

  /**
   * Generate test files
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async generateTestFiles(context: any): Promise<void> {
    await this.generateFile('tests/setup.ts.template', 'tests/setup.ts', context);
    await this.generateFile(
      'tests/integration/health.test.ts.template',
      'tests/integration/health.test.ts',
      context
    );
    await this.generateFile(
      'tests/unit/utils.test.ts.template',
      'tests/unit/utils.test.ts',
      context
    );
  }

  /**
   * Generate Docker files
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
