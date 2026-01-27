import { describe, it, expect } from 'vitest';
import { validators } from '@/utils/validator';

describe('Validators', () => {
  describe('projectName', () => {
    it('should accept valid project names', () => {
      expect(validators.projectName('my-project')).toBe(true);
      expect(validators.projectName('my_project')).toBe(true);
      expect(validators.projectName('myproject123')).toBe(true);
      expect(validators.projectName('my-awesome-project-2024')).toBe(true);
    });

    it('should reject empty or whitespace-only names', () => {
      expect(validators.projectName('')).toContain('required');
      expect(validators.projectName('   ')).toContain('required');
    });

    it('should reject names with uppercase letters', () => {
      expect(validators.projectName('MyProject')).toContain('lowercase');
    });

    it('should reject names with spaces', () => {
      expect(validators.projectName('my project')).toContain('lowercase');
    });

    it('should reject names starting with dot', () => {
      const result = validators.projectName('.myproject');
      expect(typeof result).toBe('string');
      // The validation should fail (return a string error message)
      expect(result).not.toBe(true);
    });

    it('should reject names starting with underscore', () => {
      expect(validators.projectName('_myproject')).toContain('cannot start');
    });

    it('should reject reserved names', () => {
      const result1 = validators.projectName('node_modules');
      const result2 = validators.projectName('favicon.ico');
      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('string');
      // Both should fail validation
      expect(result1).not.toBe(true);
      expect(result2).not.toBe(true);
    });

    it('should reject names longer than 214 characters', () => {
      const longName = 'a'.repeat(215);
      expect(validators.projectName(longName)).toContain('214 characters');
    });
  });

  describe('port', () => {
    it('should accept valid port numbers', () => {
      expect(validators.port('3000')).toBe(true);
      expect(validators.port('8080')).toBe(true);
      expect(validators.port('1')).toBe(true);
      expect(validators.port('65535')).toBe(true);
    });

    it('should reject non-numeric values', () => {
      expect(validators.port('abc')).toContain('number');
      expect(validators.port('')).toContain('number');
    });

    it('should reject ports out of valid range', () => {
      expect(validators.port('0')).toContain('between 1 and 65535');
      expect(validators.port('65536')).toContain('between 1 and 65535');
      expect(validators.port('-1')).toContain('between 1 and 65535');
    });
  });

  describe('required', () => {
    it('should accept non-empty strings', () => {
      expect(validators.required('test')).toBe(true);
      expect(validators.required('a')).toBe(true);
    });

    it('should reject empty or whitespace-only strings', () => {
      expect(validators.required('')).toContain('required');
      expect(validators.required('   ')).toContain('required');
    });
  });
});
