import path from 'path';
import os from 'os';

/**
 * Path resolution and manipulation utilities
 */
export class PathUtils {
  /**
   * Get absolute path from relative path
   */
  static resolve(...paths: string[]): string {
    return path.resolve(...paths);
  }

  /**
   * Join path segments
   */
  static join(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * Get relative path from one path to another
   */
  static relative(from: string, to: string): string {
    return path.relative(from, to);
  }

  /**
   * Get directory name from path
   */
  static dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * Get base name from path
   */
  static basename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  /**
   * Get file extension
   */
  static extname(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * Normalize path (resolve . and ..)
   */
  static normalize(filePath: string): string {
    return path.normalize(filePath);
  }

  /**
   * Check if path is absolute
   */
  static isAbsolute(filePath: string): boolean {
    return path.isAbsolute(filePath);
  }

  /**
   * Get user's home directory
   */
  static getHomeDir(): string {
    return os.homedir();
  }

  /**
   * Get current working directory
   */
  static getCwd(): string {
    return process.cwd();
  }

  /**
   * Convert path to POSIX format (useful for templates)
   */
  static toPosix(filePath: string): string {
    return filePath.split(path.sep).join(path.posix.sep);
  }
}
