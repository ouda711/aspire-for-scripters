import { ExpressGenerator } from './express-generator.js';
import { NestJSGenerator } from './nestjs-generator.js';
import type { ProjectConfig } from '../config/schema.js';

/**
 * Factory function to create appropriate generator based on framework
 */
export function createGenerator(config: ProjectConfig, projectPath: string) {
  switch (config.framework) {
    case 'express':
      return new ExpressGenerator(config, projectPath);
    case 'nestjs':
      return new NestJSGenerator(config, projectPath);
    default:
      throw new Error(`Unsupported framework: ${config.framework}`);
  }
}

export { BaseGenerator } from './base-generator.js';
export { ExpressGenerator } from './express-generator.js';
export { NestJSGenerator } from './nestjs-generator.js';
