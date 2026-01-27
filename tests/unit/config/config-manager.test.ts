import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import { ConfigManager } from '@/config/config-manager';
import { getDefaultConfig } from '@/config/defaults';
import { TEST_DIR } from '../../setup';
import type { ProjectConfig } from '@/config/schema';

describe('ConfigManager', () => {
  let testProjectPath: string;

  beforeEach(async () => {
    testProjectPath = path.join(TEST_DIR, 'test-project');
    await fs.ensureDir(testProjectPath);
  });

  describe('save', () => {
    it('should save valid configuration to file', async () => {
      const config = getDefaultConfig('test-project');

      await ConfigManager.save(testProjectPath, config);

      const configPath = path.join(testProjectPath, '.aspire-config.json');
      expect(await fs.pathExists(configPath)).toBe(true);

      const saved = await fs.readJson(configPath);
      expect(saved).toEqual(config);
    });

    it('should throw error for invalid configuration', async () => {
      const invalidConfig = {
        name: 'Invalid Name',
        // Missing required fields
      } as ProjectConfig;

      await expect(ConfigManager.save(testProjectPath, invalidConfig)).rejects.toThrow(
        'Invalid configuration'
      );
    });
  });

  describe('load', () => {
    it('should load configuration from file', async () => {
      const config = getDefaultConfig('test-project');
      await ConfigManager.save(testProjectPath, config);

      const loaded = await ConfigManager.load(testProjectPath);

      expect(loaded).toEqual(config);
    });

    it('should throw error if file does not exist', async () => {
      await expect(ConfigManager.load(testProjectPath)).rejects.toThrow(
        'Configuration file not found'
      );
    });

    it('should throw error for invalid JSON', async () => {
      const configPath = path.join(testProjectPath, '.aspire-config.json');
      await fs.writeFile(configPath, 'invalid json', 'utf-8');

      await expect(ConfigManager.load(testProjectPath)).rejects.toThrow();
    });

    it('should throw error for invalid configuration structure', async () => {
      const configPath = path.join(testProjectPath, '.aspire-config.json');
      await fs.writeJson(configPath, { name: 'Invalid Name' });

      await expect(ConfigManager.load(testProjectPath)).rejects.toThrow(
        'Invalid configuration file'
      );
    });
  });

  describe('exists', () => {
    it('should return true if config file exists', async () => {
      const config = getDefaultConfig('test-project');
      await ConfigManager.save(testProjectPath, config);

      const exists = await ConfigManager.exists(testProjectPath);
      expect(exists).toBe(true);
    });

    it('should return false if config file does not exist', async () => {
      const exists = await ConfigManager.exists(testProjectPath);
      expect(exists).toBe(false);
    });
  });

  describe('update', () => {
    it('should update existing configuration', async () => {
      const config = getDefaultConfig('test-project');
      await ConfigManager.save(testProjectPath, config);

      const updates = {
        framework: 'nestjs' as const,
        includeDocker: false,
      };

      const updated = await ConfigManager.update(testProjectPath, updates);

      expect(updated.framework).toBe('nestjs');
      expect(updated.includeDocker).toBe(false);
      expect(updated.name).toBe('test-project'); // Unchanged field
    });

    it('should throw error if config file does not exist', async () => {
      await expect(
        ConfigManager.update(testProjectPath, { framework: 'nestjs' })
      ).rejects.toThrow('Configuration file not found');
    });
  });

  describe('validate', () => {
    it('should return valid for correct configuration', () => {
      const config = getDefaultConfig('test-project');

      const result = ConfigManager.validate(config);

      expect(result.isValid).toBe(true);
      expect(result.config).toEqual(config);
      expect(result.errors).toBeUndefined();
    });

    it('should return invalid with errors for incorrect configuration', () => {
      const config = {
        name: 'Invalid Name',
        framework: 'invalid',
      };

      const result = ConfigManager.validate(config);

      expect(result.isValid).toBe(false);
      expect(result.config).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });
});
