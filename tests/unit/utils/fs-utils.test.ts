import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import { FileSystemUtils } from '@/utils/fs-utils';
import { TEST_DIR } from '../../setup';

describe('FileSystemUtils', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(TEST_DIR, 'fs-test');
    await fs.ensureDir(testDir);
  });

  describe('ensureDir', () => {
    it('should create directory if it does not exist', async () => {
      const newDir = path.join(testDir, 'new-directory');

      await FileSystemUtils.ensureDir(newDir);

      expect(await fs.pathExists(newDir)).toBe(true);
    });

    it('should not throw error if directory already exists', async () => {
      await FileSystemUtils.ensureDir(testDir);

      // Should not throw
      await expect(FileSystemUtils.ensureDir(testDir)).resolves.not.toThrow();
    });

    it('should create nested directories', async () => {
      const nestedDir = path.join(testDir, 'a', 'b', 'c');

      await FileSystemUtils.ensureDir(nestedDir);

      expect(await fs.pathExists(nestedDir)).toBe(true);
    });
  });

  describe('writeFile', () => {
    it('should write content to file', async () => {
      const filePath = path.join(testDir, 'test.txt');
      const content = 'Hello, World!';

      await FileSystemUtils.writeFile(filePath, content);

      const written = await fs.readFile(filePath, 'utf-8');
      expect(written).toBe(content);
    });

    it('should create parent directories if they do not exist', async () => {
      const filePath = path.join(testDir, 'nested', 'folder', 'test.txt');

      await FileSystemUtils.writeFile(filePath, 'test content');

      expect(await fs.pathExists(filePath)).toBe(true);
    });
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      const filePath = path.join(testDir, 'test.txt');
      const content = 'Test content';
      await fs.writeFile(filePath, content, 'utf-8');

      const read = await FileSystemUtils.readFile(filePath);

      expect(read).toBe(content);
    });

    it('should throw error if file does not exist', async () => {
      const filePath = path.join(testDir, 'non-existent.txt');

      await expect(FileSystemUtils.readFile(filePath)).rejects.toThrow('File not found');
    });
  });

  describe('exists', () => {
    it('should return true for existing path', async () => {
      expect(await FileSystemUtils.exists(testDir)).toBe(true);
    });

    it('should return false for non-existent path', async () => {
      const nonExistent = path.join(testDir, 'non-existent');
      expect(await FileSystemUtils.exists(nonExistent)).toBe(false);
    });
  });

  describe('isDirectory', () => {
    it('should return true for directories', async () => {
      expect(await FileSystemUtils.isDirectory(testDir)).toBe(true);
    });

    it('should return false for files', async () => {
      const filePath = path.join(testDir, 'test.txt');
      await fs.writeFile(filePath, 'content', 'utf-8');

      expect(await FileSystemUtils.isDirectory(filePath)).toBe(false);
    });

    it('should return false for non-existent paths', async () => {
      expect(await FileSystemUtils.isDirectory(path.join(testDir, 'non-existent'))).toBe(false);
    });
  });

  describe('copy', () => {
    it('should copy file', async () => {
      const srcPath = path.join(testDir, 'source.txt');
      const destPath = path.join(testDir, 'destination.txt');
      await fs.writeFile(srcPath, 'content', 'utf-8');

      await FileSystemUtils.copy(srcPath, destPath);

      expect(await fs.pathExists(destPath)).toBe(true);
      const content = await fs.readFile(destPath, 'utf-8');
      expect(content).toBe('content');
    });

    it('should copy directory recursively', async () => {
      const srcDir = path.join(testDir, 'source-dir');
      const destDir = path.join(testDir, 'dest-dir');
      await fs.ensureDir(srcDir);
      await fs.writeFile(path.join(srcDir, 'file.txt'), 'content', 'utf-8');

      await FileSystemUtils.copy(srcDir, destDir);

      expect(await fs.pathExists(path.join(destDir, 'file.txt'))).toBe(true);
    });
  });

  describe('remove', () => {
    it('should remove file', async () => {
      const filePath = path.join(testDir, 'to-remove.txt');
      await fs.writeFile(filePath, 'content', 'utf-8');

      await FileSystemUtils.remove(filePath);

      expect(await fs.pathExists(filePath)).toBe(false);
    });

    it('should remove directory recursively', async () => {
      const dirPath = path.join(testDir, 'to-remove-dir');
      await fs.ensureDir(dirPath);
      await fs.writeFile(path.join(dirPath, 'file.txt'), 'content', 'utf-8');

      await FileSystemUtils.remove(dirPath);

      expect(await fs.pathExists(dirPath)).toBe(false);
    });
  });

  describe('readDir', () => {
    it('should list files in directory', async () => {
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file2.txt'), 'content', 'utf-8');

      const files = await FileSystemUtils.readDir(testDir);

      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
    });

    it('should throw error if path is not a directory', async () => {
      const filePath = path.join(testDir, 'file.txt');
      await fs.writeFile(filePath, 'content', 'utf-8');

      await expect(FileSystemUtils.readDir(filePath)).rejects.toThrow('Not a directory');
    });
  });

  describe('createFromTemplate', () => {
    it('should create file from template with variables', async () => {
      const template = 'Hello, {{name}}! You are {{age}} years old.';
      const variables = { name: 'John', age: '30' };
      const destPath = path.join(testDir, 'output.txt');

      await FileSystemUtils.createFromTemplate(destPath, template, variables);

      const content = await fs.readFile(destPath, 'utf-8');
      expect(content).toBe('Hello, John! You are 30 years old.');
    });

    it('should handle multiple occurrences of same variable', async () => {
      const template = '{{name}} said: "Hi, I am {{name}}!"';
      const variables = { name: 'Alice' };
      const destPath = path.join(testDir, 'output.txt');

      await FileSystemUtils.createFromTemplate(destPath, template, variables);

      const content = await fs.readFile(destPath, 'utf-8');
      expect(content).toBe('Alice said: "Hi, I am Alice!"');
    });
  });
});
