import { describe, it, expect } from 'vitest';
import { getDefaultConfig, getPresetConfig, DEFAULT_CONFIG, PRESETS } from '@/config/defaults';

describe('Config Defaults', () => {
  describe('DEFAULT_CONFIG', () => {
    it('should have all required fields except name', () => {
      expect(DEFAULT_CONFIG).toHaveProperty('packageManager');
      expect(DEFAULT_CONFIG).toHaveProperty('framework');
      expect(DEFAULT_CONFIG).toHaveProperty('sqlDatabase');
      expect(DEFAULT_CONFIG).toHaveProperty('nosqlDatabases');
    });

    it('should use express as default framework', () => {
      expect(DEFAULT_CONFIG.framework).toBe('express');
    });

    it('should use npm as default package manager', () => {
      expect(DEFAULT_CONFIG.packageManager).toBe('npm');
    });

    it('should have postgresql as default database', () => {
      expect(DEFAULT_CONFIG.sqlDatabase).toBe('postgresql');
    });

    it('should include redis by default', () => {
      expect(DEFAULT_CONFIG.nosqlDatabases).toContain('redis');
    });
  });

  describe('getDefaultConfig', () => {
    it('should return config with provided project name', () => {
      const config = getDefaultConfig('my-awesome-project');

      expect(config.name).toBe('my-awesome-project');
    });

    it('should merge with DEFAULT_CONFIG', () => {
      const config = getDefaultConfig('test-app');

      expect(config.framework).toBe(DEFAULT_CONFIG.framework);
      expect(config.packageManager).toBe(DEFAULT_CONFIG.packageManager);
      expect(config.sqlDatabase).toBe(DEFAULT_CONFIG.sqlDatabase);
    });

    it('should return a new object (not mutate DEFAULT_CONFIG)', () => {
      const originalFramework = DEFAULT_CONFIG.framework;
      const config = getDefaultConfig('test');
      config.framework = 'nestjs';

      expect(DEFAULT_CONFIG.framework).toBe(originalFramework);
    });
  });

  describe('PRESETS', () => {
    it('should have minimal preset', () => {
      expect(PRESETS).toHaveProperty('minimal');
    });

    it('should have fullstack preset', () => {
      expect(PRESETS).toHaveProperty('fullstack');
    });

    it('should have microservices preset', () => {
      expect(PRESETS).toHaveProperty('microservices');
    });

    describe('minimal preset', () => {
      it('should not include optional features', () => {
        const preset = PRESETS.minimal;

        expect(preset.includeAuth).toBe(false);
        expect(preset.includeSwagger).toBe(false);
        expect(preset.includeDocker).toBe(false);
        expect(preset.includeKubernetes).toBe(false);
      });

      it('should still have postgresql database', () => {
        const preset = PRESETS.minimal;

        // minimal still has DB (inherited from DEFAULT_CONFIG spread) but fewer features
        expect(preset.sqlDatabase).toBe('postgresql');
        expect(preset.nosqlDatabases).toEqual([]);
      });
    });

    describe('fullstack preset', () => {
      it('should include all main features', () => {
        const preset = PRESETS.fullstack;

        expect(preset.includeAuth).toBe(true);
        expect(preset.includeSwagger).toBe(true);
        expect(preset.includeDocker).toBe(true);
        expect(preset.includeTesting).toBe(true);
      });

      it('should include database', () => {
        const preset = PRESETS.fullstack;

        expect(preset.sqlDatabase).toBe('postgresql');
        expect(preset.nosqlDatabases).toContain('redis');
      });

      it('should be a monorepo with frontend', () => {
        const preset = PRESETS.fullstack;

        expect(preset.monorepo).toBe(true);
        expect(preset.frontend).toBe('react');
      });
    });

    describe('microservices preset', () => {
      it('should include microservices features', () => {
        const preset = PRESETS.microservices;

        expect(preset.includeDocker).toBe(true);
        expect(preset.includeKubernetes).toBe(true);
        expect(preset.includeMessageQueue).toBe(true);
      });

      it('should include observability', () => {
        const preset = PRESETS.microservices;

        expect(preset.includeLogging).toBe(true);
        expect(preset.includeMetrics).toBe(true);
      });

      it('should include both SQL and NoSQL databases', () => {
        const preset = PRESETS.microservices;

        expect(preset.sqlDatabase).toBe('postgresql');
        expect(preset.nosqlDatabases).toEqual(['redis', 'mongodb']);
      });
    });
  });

  describe('getPresetConfig', () => {
    it('should return config for minimal preset', () => {
      const config = getPresetConfig('minimal', 'my-app');

      expect(config.name).toBe('my-app');
      expect(config.includeAuth).toBe(false);
      expect(config.sqlDatabase).toBe('postgresql');
      expect(config.nosqlDatabases).toEqual([]);
    });

    it('should return config for fullstack preset', () => {
      const config = getPresetConfig('fullstack', 'my-app');

      expect(config.name).toBe('my-app');
      expect(config.includeAuth).toBe(true);
      expect(config.sqlDatabase).toBe('postgresql');
      expect(config.nosqlDatabases).toContain('redis');
    });

    it('should return config for microservices preset', () => {
      const config = getPresetConfig('microservices', 'my-app');

      expect(config.name).toBe('my-app');
      expect(config.includeKubernetes).toBe(true);
      expect(config.includeMessageQueue).toBe(true);
    });

    it('should handle unknown preset (returns object with undefined properties)', () => {
      const config = getPresetConfig('unknown' as any, 'my-app');

      // Will have name set but other properties will be undefined
      expect(config.name).toBe('my-app');
      expect(config).toHaveProperty('name');
    });

    it('should override name in preset', () => {
      const config = getPresetConfig('fullstack', 'custom-name');

      expect(config.name).toBe('custom-name');
    });

    it('should spread preset over defaults', () => {
      const config = getPresetConfig('fullstack', 'my-app');

      // Should have all default fields
      expect(config).toHaveProperty('packageManager');
      expect(config).toHaveProperty('framework');
    });
  });
});
