import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import { BaseGenerator } from '@/generators/base-generator';
import { getDefaultConfig } from '@/config/defaults';
import { TEST_DIR } from '../../setup';
import type { ProjectConfig } from '@/config/schema';

// Concrete implementation for testing
class TestGenerator extends BaseGenerator {
  async generate(): Promise<void> {
    // Test implementation
  }
}

describe('BaseGenerator', () => {
  let config: ProjectConfig;
  let projectPath: string;
  let templatePath: string;
  let generator: TestGenerator;

  beforeEach(async () => {
    config = getDefaultConfig('test-project');
    projectPath = path.join(TEST_DIR, 'test-project');
    templatePath = path.join(TEST_DIR, 'templates');
    
    await fs.ensureDir(projectPath);
    await fs.ensureDir(templatePath);
    
    generator = new TestGenerator(config, projectPath, templatePath);
  });

  describe('constructor', () => {
    it('should initialize with config, project path, and template path', () => {
      expect(generator['config']).toEqual(config);
      expect(generator['projectPath']).toBe(projectPath);
      expect(generator['templatePath']).toBe(templatePath);
    });
  });

  describe('readTemplate', () => {
    it('should read template file content', async () => {
      const templateFile = 'test.template';
      const content = 'Hello, {{name}}!';
      await fs.writeFile(path.join(templatePath, templateFile), content, 'utf-8');

      const result = await generator['readTemplate'](templateFile);

      expect(result).toBe(content);
    });

    it('should throw error if template file does not exist', async () => {
      await expect(generator['readTemplate']('non-existent.template')).rejects.toThrow();
    });
  });

  describe('compileTemplate', () => {
    it('should compile template with simple variables', () => {
      const template = 'Hello, {{name}}!';
      const data = { name: 'World' };

      const result = generator['compileTemplate'](template, data);

      expect(result).toBe('Hello, World!');
    });

    it('should compile template with conditionals', () => {
      const template = '{{#if show}}Visible{{/if}}';
      
      const resultTrue = generator['compileTemplate'](template, { show: true });
      expect(resultTrue).toBe('Visible');

      const resultFalse = generator['compileTemplate'](template, { show: false });
      expect(resultFalse).toBe('');
    });

    it('should support helper functions', () => {
      const template = '{{pascalCase name}}';
      const data = { name: 'my-project' };

      const result = generator['compileTemplate'](template, data);

      expect(result).toBe('MyProject');
    });

    it('should handle eq helper', () => {
      const template = '{{#if (eq framework "express")}}Express{{/if}}';
      const data = { framework: 'express' };

      const result = generator['compileTemplate'](template, data);

      expect(result).toBe('Express');
    });

    it('should handle includes helper', () => {
      const template = '{{#if (includes databases "postgresql")}}Has Postgres{{/if}}';
      const data = { databases: ['postgresql', 'redis'] };

      const result = generator['compileTemplate'](template, data);

      expect(result).toBe('Has Postgres');
    });
  });

  describe('generateFile', () => {
    it('should generate file from template', async () => {
      const templateFile = 'test.template';
      const templateContent = 'Project: {{name}}';
      await fs.writeFile(path.join(templatePath, templateFile), templateContent, 'utf-8');

      await generator['generateFile'](templateFile, 'output.txt');

      const generatedContent = await fs.readFile(
        path.join(projectPath, 'output.txt'),
        'utf-8'
      );
      expect(generatedContent).toBe('Project: test-project');
    });

    it('should create parent directories if they do not exist', async () => {
      const templateFile = 'test.template';
      const templateContent = 'Test content';
      await fs.writeFile(path.join(templatePath, templateFile), templateContent, 'utf-8');

      await generator['generateFile'](templateFile, 'nested/folder/output.txt');

      expect(await fs.pathExists(path.join(projectPath, 'nested/folder/output.txt'))).toBe(true);
    });

    it('should use custom data if provided', async () => {
      const templateFile = 'test.template';
      const templateContent = 'Hello, {{customName}}!';
      await fs.writeFile(path.join(templatePath, templateFile), templateContent, 'utf-8');

      await generator['generateFile'](templateFile, 'output.txt', { customName: 'Custom' });

      const generatedContent = await fs.readFile(
        path.join(projectPath, 'output.txt'),
        'utf-8'
      );
      expect(generatedContent).toBe('Hello, Custom!');
    });
  });

  describe('createDirectory', () => {
    it('should create directory', async () => {
      await generator['createDirectory']('new-dir');

      expect(await fs.pathExists(path.join(projectPath, 'new-dir'))).toBe(true);
    });

    it('should create nested directories', async () => {
      await generator['createDirectory']('a/b/c');

      expect(await fs.pathExists(path.join(projectPath, 'a/b/c'))).toBe(true);
    });
  });

  describe('templateExists', () => {
    it('should return true for existing template', async () => {
      const templateFile = 'exists.template';
      await fs.writeFile(path.join(templatePath, templateFile), 'content', 'utf-8');

      const exists = await generator['templateExists'](templateFile);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent template', async () => {
      const exists = await generator['templateExists']('non-existent.template');

      expect(exists).toBe(false);
    });
  });

  describe('getTemplateContext', () => {
    it('should include config properties', () => {
      const context = generator['getTemplateContext']();

      expect(context.name).toBe('test-project');
      expect(context.framework).toBe('express');
      expect(context.packageManager).toBe('npm');
    });

    it('should include derived properties', () => {
      const context = generator['getTemplateContext']();

      expect(context.projectNamePascal).toBe('TestProject');
      expect(context.projectNameCamel).toBe('testProject');
      expect(context.projectNameKebab).toBe('test-project');
      expect(context.projectNameSnake).toBe('test_project');
    });

    it('should include database flags', () => {
      const context = generator['getTemplateContext']();

      expect(context.hasDatabase).toBe(true);
      expect(context.hasPostgres).toBe(true);
      expect(context.hasRedis).toBe(true);
      expect(context.hasMongoDB).toBe(false);
    });

    it('should include current year', () => {
      const context = generator['getTemplateContext']();

      expect(context.currentYear).toBe(new Date().getFullYear());
    });
  });
});
