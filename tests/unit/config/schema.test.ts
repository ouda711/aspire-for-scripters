import { describe, it, expect } from 'vitest';
import { validateConfig, getValidationErrors } from '@/config/schema';

describe('Configuration Schema', () => {
  describe('validateConfig', () => {
    it('should validate a correct configuration', () => {
      const config = {
        name: 'test-project',
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

      const result = validateConfig(config);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(config);
      expect(result.errors).toBeUndefined();
    });

    it('should reject invalid project name with spaces', () => {
      const config = {
        name: 'invalid name',
        packageManager: 'npm',
        framework: 'express',
        includeAuth: true,
        includeSwagger: true,
        nosqlDatabases: [],
        frontend: 'none',
        monorepo: false,
        includeDocker: true,
        includeKubernetes: false,
        includeMessageQueue: false,
        includeTesting: true,
        includeCI: false,
        includeHusky: false,
        includeLogging: false,
        includeMetrics: false,
      };

      const result = validateConfig(config);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject project name starting with dot', () => {
      const config = {
        name: '.invalid',
        packageManager: 'npm',
        framework: 'express',
        includeAuth: true,
        includeSwagger: true,
        nosqlDatabases: [],
        frontend: 'none',
        monorepo: false,
        includeDocker: true,
        includeKubernetes: false,
        includeMessageQueue: false,
        includeTesting: true,
        includeCI: false,
        includeHusky: false,
        includeLogging: false,
        includeMetrics: false,
      };

      const result = validateConfig(config);

      expect(result.success).toBe(false);
    });

    it('should reject reserved project names', () => {
      const config = {
        name: 'node_modules',
        packageManager: 'npm',
        framework: 'express',
        includeAuth: true,
        includeSwagger: true,
        nosqlDatabases: [],
        frontend: 'none',
        monorepo: false,
        includeDocker: true,
        includeKubernetes: false,
        includeMessageQueue: false,
        includeTesting: true,
        includeCI: false,
        includeHusky: false,
        includeLogging: false,
        includeMetrics: false,
      };

      const result = validateConfig(config);

      expect(result.success).toBe(false);
    });

    it('should reject invalid framework', () => {
      const config = {
        name: 'test-project',
        packageManager: 'npm',
        framework: 'invalid-framework',
        includeAuth: true,
        includeSwagger: true,
        nosqlDatabases: [],
        frontend: 'none',
        monorepo: false,
        includeDocker: true,
        includeKubernetes: false,
        includeMessageQueue: false,
        includeTesting: true,
        includeCI: false,
        includeHusky: false,
        includeLogging: false,
        includeMetrics: false,
      };

      const result = validateConfig(config);

      expect(result.success).toBe(false);
    });

    it('should accept optional fields as undefined', () => {
      const config = {
        name: 'test-project',
        packageManager: 'npm',
        framework: 'express',
        includeAuth: true,
        includeSwagger: true,
        nosqlDatabases: [],
        frontend: 'none',
        monorepo: false,
        includeDocker: true,
        includeKubernetes: false,
        includeMessageQueue: false,
        includeTesting: true,
        includeCI: false,
        includeHusky: false,
        includeLogging: false,
        includeMetrics: false,
        // Optional fields not provided
      };

      const result = validateConfig(config);

      expect(result.success).toBe(true);
    });
  });

  describe('getValidationErrors', () => {
    it('should format validation errors readably', () => {
      const invalidConfig = {
        name: 'Invalid Name',
        framework: 'invalid',
      };

      const result = validateConfig(invalidConfig);
      expect(result.success).toBe(false);

      if (result.errors) {
        const errors = getValidationErrors(result.errors);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('name');
      }
    });
  });
});
