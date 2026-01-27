import { describe, it, expect } from 'vitest';
import { createGenerator } from '@/generators/index';
import { ExpressGenerator } from '@/generators/express-generator';
import { NestJSGenerator } from '@/generators/nestjs-generator';
import { getDefaultConfig } from '@/config/defaults';
import type { ProjectConfig } from '@/config/schema';

describe('Generator Factory', () => {
  describe('createGenerator', () => {
    it('should create ExpressGenerator for express framework', () => {
      const config = getDefaultConfig('test-project');
      config.framework = 'express';
      const projectPath = '/tmp/test';

      const generator = createGenerator(config, projectPath);

      expect(generator).toBeInstanceOf(ExpressGenerator);
    });

    it('should create NestJSGenerator for nestjs framework', () => {
      const config: ProjectConfig = {
        ...getDefaultConfig('test-project'),
        framework: 'nestjs',
      };
      const projectPath = '/tmp/test';

      const generator = createGenerator(config, projectPath);

      expect(generator).toBeInstanceOf(NestJSGenerator);
    });

    it('should throw error for unsupported framework', () => {
      const config = {
        ...getDefaultConfig('test-project'),
        framework: 'invalid' as any,
      };
      const projectPath = '/tmp/test';

      expect(() => createGenerator(config, projectPath)).toThrow('Unsupported framework');
    });
  });
});
