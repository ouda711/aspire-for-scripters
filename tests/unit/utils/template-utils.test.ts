import { describe, it, expect } from 'vitest';
import { TemplateUtils } from '@/utils/template-utils';

describe('TemplateUtils', () => {
  describe('replaceVariables', () => {
    it('should replace simple variables', () => {
      const template = 'Hello, {{name}}!';
      const variables = { name: 'World' };

      const result = TemplateUtils.replaceVariables(template, variables);

      expect(result).toBe('Hello, World!');
    });

    it('should replace multiple variables', () => {
      const template = '{{greeting}}, {{name}}! You are {{age}} years old.';
      const variables = { greeting: 'Hi', name: 'John', age: 30 };

      const result = TemplateUtils.replaceVariables(template, variables);

      expect(result).toBe('Hi, John! You are 30 years old.');
    });

    it('should handle variables with whitespace', () => {
      const template = '{{ name }} is {{ age }}';
      const variables = { name: 'Alice', age: 25 };

      const result = TemplateUtils.replaceVariables(template, variables);

      expect(result).toBe('Alice is 25');
    });

    it('should handle boolean values', () => {
      const template = 'Enabled: {{enabled}}';
      const variables = { enabled: true };

      const result = TemplateUtils.replaceVariables(template, variables);

      expect(result).toBe('Enabled: true');
    });
  });

  describe('replaceConditionals', () => {
    it('should include content when condition is true', () => {
      const template = '{{#if showMessage}}Hello!{{/if}}';
      const conditions = { showMessage: true };

      const result = TemplateUtils.replaceConditionals(template, conditions);

      expect(result).toBe('Hello!');
    });

    it('should exclude content when condition is false', () => {
      const template = '{{#if showMessage}}Hello!{{/if}}';
      const conditions = { showMessage: false };

      const result = TemplateUtils.replaceConditionals(template, conditions);

      expect(result).toBe('');
    });

    it('should handle multiple conditionals', () => {
      const template = `
{{#if header}}Header{{/if}}
{{#if body}}Body{{/if}}
{{#if footer}}Footer{{/if}}
      `;
      const conditions = { header: true, body: false, footer: true };

      const result = TemplateUtils.replaceConditionals(template, conditions);

      expect(result).toContain('Header');
      expect(result).not.toContain('Body');
      expect(result).toContain('Footer');
    });

    it('should handle nested content in conditionals', () => {
      const template = '{{#if show}}Line 1\nLine 2\nLine 3{{/if}}';
      const conditions = { show: true };

      const result = TemplateUtils.replaceConditionals(template, conditions);

      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('process', () => {
    it('should process both variables and conditionals', () => {
      const template = `
{{#if includeGreeting}}Hello, {{name}}!{{/if}}
{{#if includeAge}}You are {{age}} years old.{{/if}}
      `;
      const data = {
        variables: { name: 'John', age: 30 },
        conditions: { includeGreeting: true, includeAge: false },
      };

      const result = TemplateUtils.process(template, data);

      expect(result).toContain('Hello, John!');
      expect(result).not.toContain('You are');
    });
  });

  describe('toPascalCase', () => {
    it('should convert hyphenated strings', () => {
      expect(TemplateUtils.toPascalCase('my-project')).toBe('MyProject');
    });

    it('should convert underscored strings', () => {
      expect(TemplateUtils.toPascalCase('my_project')).toBe('MyProject');
    });

    it('should convert space-separated strings', () => {
      expect(TemplateUtils.toPascalCase('my project')).toBe('MyProject');
    });

    it('should handle mixed separators', () => {
      expect(TemplateUtils.toPascalCase('my-awesome_project name')).toBe('MyAwesomeProjectName');
    });
  });

  describe('toCamelCase', () => {
    it('should convert to camelCase', () => {
      expect(TemplateUtils.toCamelCase('my-project')).toBe('myProject');
      expect(TemplateUtils.toCamelCase('my_project')).toBe('myProject');
      expect(TemplateUtils.toCamelCase('my project')).toBe('myProject');
    });
  });

  describe('toKebabCase', () => {
    it('should convert to kebab-case', () => {
      expect(TemplateUtils.toKebabCase('MyProject')).toBe('my-project');
      expect(TemplateUtils.toKebabCase('myProject')).toBe('my-project');
      expect(TemplateUtils.toKebabCase('my_project')).toBe('my-project');
      expect(TemplateUtils.toKebabCase('my project')).toBe('my-project');
    });
  });

  describe('toSnakeCase', () => {
    it('should convert to snake_case', () => {
      expect(TemplateUtils.toSnakeCase('MyProject')).toBe('my_project');
      expect(TemplateUtils.toSnakeCase('myProject')).toBe('my_project');
      expect(TemplateUtils.toSnakeCase('my-project')).toBe('my_project');
      expect(TemplateUtils.toSnakeCase('my project')).toBe('my_project');
    });
  });
});
