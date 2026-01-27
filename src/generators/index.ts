import { ExpressGenerator } from './express-generator.js';
import type { ProjectConfig } from '../config/schema.js';

/**
 * Factory function to create appropriate generator based on framework
 */
export function createGenerator(config: ProjectConfig, projectPath: string) {
  switch (config.framework) {
    case 'express':
      return new ExpressGenerator(config, projectPath);
    case 'nestjs':
      throw new Error('NestJS generator not yet implemented. Coming in Step 1.5!');
    default:
      throw new Error(`Unsupported framework: ${config.framework}`);
  }
}

export { BaseGenerator } from './base-generator.js';
export { ExpressGenerator } from './express-generator.js';
