import { describe, it, expect } from 'vitest';
import { logger } from '@/utils/logger';

describe('Logger', () => {
  describe('logger methods', () => {
    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('should have success method', () => {
      expect(typeof logger.success).toBe('function');
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
    });

    it('should have warning method', () => {
      expect(typeof logger.warning).toBe('function');
    });

    it('should have step method', () => {
      expect(typeof logger.step).toBe('function');
    });

    it('should have section method', () => {
      expect(typeof logger.section).toBe('function');
    });

    it('should not throw when calling info', () => {
      expect(() => logger.info('Test message')).not.toThrow();
    });

    it('should not throw when calling success', () => {
      expect(() => logger.success('Test message')).not.toThrow();
    });

    it('should not throw when calling error', () => {
      expect(() => logger.error('Test message')).not.toThrow();
    });

    it('should not throw when calling warning', () => {
      expect(() => logger.warning('Test message')).not.toThrow();
    });

    it('should not throw when calling step', () => {
      expect(() => logger.step('Test message')).not.toThrow();
    });

    it('should not throw when calling section', () => {
      expect(() => logger.section('Test message')).not.toThrow();
    });
  });
});
