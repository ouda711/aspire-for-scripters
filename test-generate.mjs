import { ExpressGenerator } from './dist/cli.js';

const config = {
  name: 'test-dashboard-project',
  framework: 'express',
  sqlDatabase: 'postgres',
  nosqlDatabases: [],
  includeAuth: false,
  includeSwagger: false,
  includeLogging: false,
  includeTesting: false,
  includeDocker: true,
  includeKubernetes: false,
  includeMessageQueue: false,
  includeCI: false,
  frontend: 'none',
  monorepo: false,
  packageManager: 'npm'
};

const projectPath = './test-output/test-dashboard-project';
const generator = new ExpressGenerator(config, projectPath);

try {
  await generator.generate();
  console.log('\n✅ Project generated successfully!');
} catch (err) {
  console.error('❌ Generation failed:', err);
  process.exit(1);
}
