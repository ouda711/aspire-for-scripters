import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';

// Test directory for file operations
export const TEST_DIR = path.join(process.cwd(), 'tests', '.test-temp');

// Setup before all tests
beforeAll(async () => {
  // Ensure test directory exists
  await fs.ensureDir(TEST_DIR);
});

// Setup before each test
beforeEach(async () => {
  // Ensure test directory is clean and exists
  await fs.emptyDir(TEST_DIR);
});

// Cleanup after each test
afterEach(async () => {
  // Clean up test directory contents but keep the directory
  try {
    await fs.emptyDir(TEST_DIR);
  } catch (error) {
    // Ignore errors during cleanup
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Remove test directory completely
  try {
    await fs.remove(TEST_DIR);
  } catch (error) {
    // Ignore errors during cleanup
  }
});
