import fs from 'fs-extra';
import path from 'path';

/**
 * Safe file system operations with error handling
 */
export class FileSystemUtils {
  /**
   * Safely create a directory, ensuring parent directories exist
   */
  static async ensureDir(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath);
  }

  /**
   * Safely write a file, ensuring parent directories exist
   */
  static async writeFile(filePath: string, content: string): Promise<void> {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Safely read a file
   */
  static async readFile(filePath: string): Promise<string> {
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File not found: ${filePath}`);
    }
    return await fs.readFile(filePath, 'utf-8');
  }

  /**
   * Check if path exists
   */
  static async exists(targetPath: string): Promise<boolean> {
    return await fs.pathExists(targetPath);
  }

  /**
   * Check if path is a directory
   */
  static async isDirectory(targetPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(targetPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Copy file or directory
   */
  static async copy(src: string, dest: string, options?: fs.CopyOptions): Promise<void> {
    await fs.copy(src, dest, options);
  }

  /**
   * Remove file or directory
   */
  static async remove(targetPath: string): Promise<void> {
    await fs.remove(targetPath);
  }

  /**
   * List files in directory
   */
  static async readDir(dirPath: string): Promise<string[]> {
    if (!(await this.isDirectory(dirPath))) {
      throw new Error(`Not a directory: ${dirPath}`);
    }
    return await fs.readdir(dirPath);
  }

  /**
   * Create file with template content
   */
  static async createFromTemplate(
    destPath: string,
    template: string,
    variables: Record<string, string>
  ): Promise<void> {
    let content = template;

    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    });

    await this.writeFile(destPath, content);
  }
}
