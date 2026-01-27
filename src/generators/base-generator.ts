import path from 'path';
import Handlebars from 'handlebars';
import { FileSystemUtils } from '../utils/fs-utils.js';
import { TemplateUtils } from '../utils/template-utils.js';
import type { ProjectConfig } from '../config/schema.js';

/**
 * Base generator class that other generators extend
 */
export abstract class BaseGenerator {
  protected config: ProjectConfig;
  protected projectPath: string;
  protected templatePath: string;

  constructor(config: ProjectConfig, projectPath: string, templatePath: string) {
    this.config = config;
    this.projectPath = projectPath;
    this.templatePath = templatePath;

    // Register Handlebars helpers
    this.registerHelpers();
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers(): void {
    // Helper for checking if value is in array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Handlebars.registerHelper('includes', (array: any[], value: any) => {
      return Array.isArray(array) && array.includes(value);
    });

    // Helper for equality check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);

    // Helper for inequality check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Handlebars.registerHelper('neq', (a: any, b: any) => a !== b);

    // Helper for case conversion
    Handlebars.registerHelper('pascalCase', (str: string) => TemplateUtils.toPascalCase(str));
    Handlebars.registerHelper('camelCase', (str: string) => TemplateUtils.toCamelCase(str));
    Handlebars.registerHelper('kebabCase', (str: string) => TemplateUtils.toKebabCase(str));
    Handlebars.registerHelper('snakeCase', (str: string) => TemplateUtils.toSnakeCase(str));
  }

  /**
   * Generate the project
   */
  abstract generate(): Promise<void>;

  /**
   * Read template file and compile with Handlebars
   */
  protected async readTemplate(templateRelativePath: string): Promise<string> {
    const fullPath = path.join(this.templatePath, templateRelativePath);
    const content = await FileSystemUtils.readFile(fullPath);
    return content;
  }

  /**
   * Compile template with data
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected compileTemplate(templateContent: string, data: any): string {
    const template = Handlebars.compile(templateContent);
    return template(data);
  }

  /**
   * Generate a file from template
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async generateFile(
    templateRelativePath: string,
    outputRelativePath: string,
    data?: any
  ): Promise<void> {
    try {
      // Read template
      const templateContent = await this.readTemplate(templateRelativePath);

      // Compile with data
      const compiledContent = this.compileTemplate(templateContent, data || this.config);

      // Write to output
      const outputPath = path.join(this.projectPath, outputRelativePath);
      await FileSystemUtils.writeFile(outputPath, compiledContent);
    } catch (error) {
      throw new Error(
        `Failed to generate file ${outputRelativePath}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Copy a file or directory from template to project
   */
  protected async copyTemplateFile(
    templateRelativePath: string,
    outputRelativePath: string
  ): Promise<void> {
    const sourcePath = path.join(this.templatePath, templateRelativePath);
    const destPath = path.join(this.projectPath, outputRelativePath);

    await FileSystemUtils.copy(sourcePath, destPath);
  }

  /**
   * Create an empty directory
   */
  protected async createDirectory(relativePath: string): Promise<void> {
    const dirPath = path.join(this.projectPath, relativePath);
    await FileSystemUtils.ensureDir(dirPath);
  }

  /**
   * Check if a template file exists
   */
  protected async templateExists(templateRelativePath: string): Promise<boolean> {
    const fullPath = path.join(this.templatePath, templateRelativePath);
    return await FileSystemUtils.exists(fullPath);
  }

  /**
   * Get template data context for Handlebars
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getTemplateContext(): any {
    return {
      ...this.config,
      // Add derived/computed properties
      projectNamePascal: TemplateUtils.toPascalCase(this.config.name),
      projectNameCamel: TemplateUtils.toCamelCase(this.config.name),
      projectNameKebab: TemplateUtils.toKebabCase(this.config.name),
      projectNameSnake: TemplateUtils.toSnakeCase(this.config.name),
      currentYear: new Date().getFullYear(),
      hasDatabase: !!(this.config.sqlDatabase || this.config.nosqlDatabases.length > 0),
      hasPostgres: this.config.sqlDatabase === 'postgresql',
      hasMySQL: this.config.sqlDatabase === 'mysql',
      hasSQLite: this.config.sqlDatabase === 'sqlite',
      hasMongoDB: this.config.nosqlDatabases.includes('mongodb'),
      hasRedis: this.config.nosqlDatabases.includes('redis'),
    };
  }
}
