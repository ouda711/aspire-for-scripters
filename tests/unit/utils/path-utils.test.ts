import { describe, it, expect } from 'vitest';
import path from 'path';
import { PathUtils } from '@/utils/path-utils';

describe('PathUtils', () => {
  describe('resolve', () => {
    it('should resolve absolute path', () => {
      const result = PathUtils.resolve('/a', 'b', 'c');
      expect(result).toBe(path.resolve('/a', 'b', 'c'));
    });
  });

  describe('join', () => {
    it('should join path segments', () => {
      expect(PathUtils.join('a', 'b', 'c')).toBe('a/b/c'.replace(/\//g, path.sep));
    });
  });

  describe('relative', () => {
    it('should calculate relative path', () => {
      const from = '/a/b/c';
      const to = '/a/b/d';
      expect(PathUtils.relative(from, to)).toBe(path.relative(from, to));
    });
  });

  describe('dirname', () => {
    it('should get directory name', () => {
      expect(PathUtils.dirname('/a/b/c.txt')).toBe('/a/b'.replace(/\//g, path.sep));
    });
  });

  describe('basename', () => {
    it('should get base name', () => {
      expect(PathUtils.basename('/a/b/c.txt')).toBe('c.txt');
    });

    it('should get base name without extension', () => {
      expect(PathUtils.basename('/a/b/c.txt', '.txt')).toBe('c');
    });
  });

  describe('extname', () => {
    it('should get file extension', () => {
      expect(PathUtils.extname('file.txt')).toBe('.txt');
      expect(PathUtils.extname('file.test.js')).toBe('.js');
    });
  });

  describe('normalize', () => {
    it('should normalize path', () => {
      expect(PathUtils.normalize('/a/b/../c')).toBe('/a/c'.replace(/\//g, path.sep));
    });
  });

  describe('isAbsolute', () => {
    it('should check if path is absolute', () => {
      expect(PathUtils.isAbsolute('/a/b/c')).toBe(true);
      expect(PathUtils.isAbsolute('a/b/c')).toBe(false);
    });
  });

  describe('toPosix', () => {
    it('should convert path to POSIX format', () => {
      const mixedPath = ['a', 'b', 'c'].join(path.sep);
      expect(PathUtils.toPosix(mixedPath)).toBe('a/b/c');
    });
  });

  describe('getCwd', () => {
    it('should get current working directory', () => {
      expect(PathUtils.getCwd()).toBe(process.cwd());
    });
  });

  describe('getHomeDir', () => {
    it('should get home directory', () => {
      const homeDir = PathUtils.getHomeDir();
      expect(homeDir).toBeTruthy();
      expect(homeDir.length).toBeGreaterThan(0);
    });
  });
});
