import fs from 'fs-extra';
import path from 'path';
import { validateConfig, getValidationErrors } from './schema.js';
import type { ProjectConfig } from './schema.js';

export const CONFIG_FILENAME = '.aspire-config.json';

/**
 * Configuration manager for loading, saving, and validating configs
 */
export class ConfigManager {
  /**
   * Save configuration to file
   */
  static async save(projectPath: string, config: ProjectConfig): Promise<void> {
    // Validate before saving
    const validation = validateConfig(config);
    if (!validation.success) {
      const errors = getValidationErrors(validation.errors!);
      throw new Error(`Invalid configuration:\n${errors.join('\n')}`);
    }

    const configPath = path.join(projectPath, CONFIG_FILENAME);
    await fs.writeJson(configPath, config, { spaces: 2 });
  }

  /**
   * Load configuration from file
   */
  static async load(projectPath: string): Promise<ProjectConfig> {
    const configPath = path.join(projectPath, CONFIG_FILENAME);

    // Check if file exists
    if (!(await fs.pathExists(configPath))) {
      throw new Error(`Configuration file not found at: ${configPath}`);
    }

    // Read and parse JSON
    const rawConfig = await fs.readJson(configPath);

    // Validate
    const validation = validateConfig(rawConfig);
    if (!validation.success) {
      const errors = getValidationErrors(validation.errors!);
      throw new Error(`Invalid configuration file:\n${errors.join('\n')}`);
    }

    return validation.data!;
  }

  /**
   * Check if configuration file exists
   */
  static async exists(projectPath: string): Promise<boolean> {
    const configPath = path.join(projectPath, CONFIG_FILENAME);
    return await fs.pathExists(configPath);
  }

  /**
   * Update existing configuration
   */
  static async update(
    projectPath: string,
    updates: Partial<ProjectConfig>
  ): Promise<ProjectConfig> {
    // Load existing config
    const existingConfig = await this.load(projectPath);

    // Merge with updates
    const updatedConfig = {
      ...existingConfig,
      ...updates,
    };

    // Save merged config
    await this.save(projectPath, updatedConfig);

    return updatedConfig;
  }

  /**
   * Validate configuration object without saving
   */
  static validate(config: unknown): {
    isValid: boolean;
    config?: ProjectConfig;
    errors?: string[];
  } {
    const validation = validateConfig(config);

    if (validation.success) {
      return {
        isValid: true,
        config: validation.data,
      };
    }

    return {
      isValid: false,
      errors: getValidationErrors(validation.errors!),
    };
  }
}
