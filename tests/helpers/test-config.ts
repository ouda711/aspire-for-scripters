import type { ProjectConfig } from '../../src/config/schema.js';
import { getDefaultConfig } from '../../src/config/defaults.js';

/**
 * Create a valid test config with defaults
 */
export function createTestConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  const defaults = getDefaultConfig('test-app');
  return {
    ...defaults,
    ...overrides,
  };
}
