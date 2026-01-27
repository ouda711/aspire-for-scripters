import type { ProjectConfig } from './schema.js';

/**
 * Default configuration presets
 */

export const DEFAULT_CONFIG: Omit<ProjectConfig, 'name'> = {
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

/**
 * Preset configurations for common use cases
 */

export const PRESETS = {
  /**
   * Minimal Express.js API
   */
  minimal: {
    ...DEFAULT_CONFIG,
    includeAuth: false,
    includeSwagger: false,
    nosqlDatabases: [],
    includeDocker: false,
    includeCI: false,
    includeHusky: false,
    includeLogging: false,
  } as Omit<ProjectConfig, 'name'>,

  /**
   * Full-featured NestJS API
   */
  fullstack: {
    ...DEFAULT_CONFIG,
    framework: 'nestjs' as const,
    frontend: 'react' as const,
    monorepo: true,
    includeKubernetes: true,
    includeMessageQueue: true,
    messageQueue: 'bullmq' as const,
    includeMetrics: true,
  } as Omit<ProjectConfig, 'name'>,

  /**
   * Microservices setup
   */
  microservices: {
    ...DEFAULT_CONFIG,
    framework: 'nestjs' as const,
    nosqlDatabases: ['redis', 'mongodb'] as const,
    includeKubernetes: true,
    includeMessageQueue: true,
    messageQueue: 'rabbitmq' as const,
    includeMetrics: true,
  } as Omit<ProjectConfig, 'name'>,
};

/**
 * Get default config with project name
 */
export function getDefaultConfig(projectName: string): ProjectConfig {
  return {
    name: projectName,
    ...DEFAULT_CONFIG,
  };
}

/**
 * Get preset config with project name
 */
export function getPresetConfig(
  presetName: keyof typeof PRESETS,
  projectName: string
): ProjectConfig {
  return {
    name: projectName,
    ...PRESETS[presetName],
  };
}
