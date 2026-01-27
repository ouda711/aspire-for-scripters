import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import { ExpressGenerator } from '@/generators/express-generator';
import { getDefaultConfig } from '@/config/defaults';
import { TEST_DIR } from '../../setup';
import type { ProjectConfig } from '@/config/schema';

describe('ExpressGenerator', () => {
  let config: ProjectConfig;
  let projectPath: string;
  let generator: ExpressGenerator;

  beforeEach(async () => {
    config = getDefaultConfig('test-express-app');
    projectPath = path.join(TEST_DIR, 'test-express-app');
    await fs.ensureDir(projectPath);

    // Mock the template path to use test templates
    const templatePath = path.join(TEST_DIR, 'express-templates');
    await fs.ensureDir(templatePath);
    
    // Create minimal template structure for testing
    await createMockTemplates(templatePath);

    generator = new ExpressGenerator(config, projectPath);
    // Override template path for testing
    generator['templatePath'] = templatePath;
  });

  describe('constructor', () => {
    it('should initialize with Express template path', () => {
      expect(generator['config']).toEqual(config);
      expect(generator['projectPath']).toBe(projectPath);
    });
  });

  describe('generate', () => {
    it('should generate Express.js project successfully', async () => {
      await generator.generate();

      // Check that base files are created
      expect(await fs.pathExists(path.join(projectPath, 'package.json'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, '.gitignore'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'tsconfig.json'))).toBe(true);
    });

    it('should create source directory structure', async () => {
      await generator.generate();

      expect(await fs.pathExists(path.join(projectPath, 'src/index.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'src/app.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'src/config'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'src/routes'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'src/controllers'))).toBe(true);
    });

    it('should generate auth files when includeAuth is true', async () => {
      config.includeAuth = true;
      generator = new ExpressGenerator(config, projectPath);
      generator['templatePath'] = path.join(TEST_DIR, 'express-templates');
      await createMockTemplates(generator['templatePath']);

      await generator.generate();

      expect(
        await fs.pathExists(path.join(projectPath, 'src/middleware/auth.middleware.ts'))
      ).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'src/utils/jwt.ts'))).toBe(true);
    });

    it('should generate database files when database is configured', async () => {
      config.sqlDatabase = 'postgresql';
      generator = new ExpressGenerator(config, projectPath);
      generator['templatePath'] = path.join(TEST_DIR, 'express-templates');
      await createMockTemplates(generator['templatePath']);

      await generator.generate();

      expect(
        await fs.pathExists(path.join(projectPath, 'src/config/database.config.ts'))
      ).toBe(true);
      expect(
        await fs.pathExists(path.join(projectPath, 'src/database/connection.ts'))
      ).toBe(true);
    });

    it('should generate test files when includeTesting is true', async () => {
      config.includeTesting = true;
      generator = new ExpressGenerator(config, projectPath);
      generator['templatePath'] = path.join(TEST_DIR, 'express-templates');
      await createMockTemplates(generator['templatePath']);

      await generator.generate();

      expect(await fs.pathExists(path.join(projectPath, 'tests/setup.ts'))).toBe(true);
    });

    it('should generate Docker files when includeDocker is true', async () => {
      config.includeDocker = true;
      generator = new ExpressGenerator(config, projectPath);
      generator['templatePath'] = path.join(TEST_DIR, 'express-templates');
      await createMockTemplates(generator['templatePath']);

      await generator.generate();

      expect(await fs.pathExists(path.join(projectPath, 'Dockerfile'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'docker-compose.yml'))).toBe(true);
    });

    it('should generate CI files when includeCI is true', async () => {
      config.includeCI = true;
      config.ciProvider = 'github';
      generator = new ExpressGenerator(config, projectPath);
      generator['templatePath'] = path.join(TEST_DIR, 'express-templates');
      await createMockTemplates(generator['templatePath']);

      await generator.generate();

      expect(
        await fs.pathExists(path.join(projectPath, '.github/workflows/ci.yml'))
      ).toBe(true);
    });

    it('should create empty directories', async () => {
      await generator.generate();

      expect(await fs.pathExists(path.join(projectPath, 'src/database/migrations'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'logs'))).toBe(true);
    });
  });
});

/**
 * Helper function to create mock templates for testing
 */
async function createMockTemplates(templatePath: string): Promise<void> {
  // Create directory structure
  await fs.ensureDir(path.join(templatePath, 'base'));
  await fs.ensureDir(path.join(templatePath, 'src/config'));
  await fs.ensureDir(path.join(templatePath, 'src/middleware'));
  await fs.ensureDir(path.join(templatePath, 'src/routes'));
  await fs.ensureDir(path.join(templatePath, 'src/controllers'));
  await fs.ensureDir(path.join(templatePath, 'src/utils'));
  await fs.ensureDir(path.join(templatePath, 'src/types'));
  await fs.ensureDir(path.join(templatePath, 'src/database'));
  await fs.ensureDir(path.join(templatePath, 'src/services'));
  await fs.ensureDir(path.join(templatePath, 'src/models'));
  await fs.ensureDir(path.join(templatePath, 'src/repositories'));
  await fs.ensureDir(path.join(templatePath, 'tests/integration'));
  await fs.ensureDir(path.join(templatePath, 'tests/unit'));
  await fs.ensureDir(path.join(templatePath, 'docker'));
  await fs.ensureDir(path.join(templatePath, '.github/workflows'));

  // Create minimal template files
  const templates = {
    'base/.gitignore.template': 'node_modules/\n.env',
    'base/package.json.template': '{"name": "{{name}}"}',
    'base/tsconfig.json.template': '{}',
    'base/.eslintrc.js.template': 'module.exports = {};',
    'base/.prettierrc.template': '{}',
    'base/.env.example.template': 'PORT=3000',
    'base/README.md.template': '# {{name}}',
    'base/nodemon.json.template': '{}',
    'src/index.ts.template': 'console.log("{{name}}");',
    'src/app.ts.template': 'export const app = {};',
    'src/server.ts.template': 'export const server = {};',
    'src/config/index.ts.template': 'export const config = {};',
    'src/config/app.config.ts.template': 'export const appConfig = {};',
    'src/config/database.config.ts.template': 'export const dbConfig = {};',
    'src/middleware/error-handler.ts.template': 'export const errorHandler = () => {};',
    'src/middleware/request-logger.ts.template': 'export const requestLogger = () => {};',
    'src/middleware/async-handler.ts.template': 'export const asyncHandler = () => {};',
    'src/middleware/auth.middleware.ts.template': 'export const authMiddleware = () => {};',
    'src/routes/index.ts.template': 'export default {};',
    'src/routes/health.routes.ts.template': 'export const healthRoutes = {};',
    'src/routes/user.routes.ts.template': 'export const userRoutes = {};',
    'src/controllers/health.controller.ts.template': 'export const healthController = {};',
    'src/controllers/user.controller.ts.template': 'export const userController = {};',
    'src/services/user.service.ts.template': 'export const userService = {};',
    'src/models/user.model.ts.template': 'export const UserModel = {};',
    'src/repositories/user.repository.ts.template': 'export const userRepository = {};',
    'src/database/connection.ts.template': 'export const connection = {};',
    'src/utils/logger.ts.template': 'export const logger = {};',
    'src/utils/response.ts.template': 'export const response = {};',
    'src/utils/jwt.ts.template': 'export const jwt = {};',
    'src/types/index.ts.template': 'export {};',
    'src/types/express.d.ts.template': 'declare module "express";',
    'src/config/swagger.ts.template': 'export const swagger = {};',
    'tests/setup.ts.template': '// Test setup',
    'tests/integration/health.test.ts.template': 'test("health", () => {});',
    'tests/unit/utils.test.ts.template': 'test("utils", () => {});',
    'docker/Dockerfile.template': 'FROM node:18',
    'docker/docker-compose.yml.template': 'version: "3"',
    '.github/workflows/ci.yml.template': 'name: CI',
  };

  for (const [filePath, content] of Object.entries(templates)) {
    await fs.writeFile(path.join(templatePath, filePath), content, 'utf-8');
  }
}
