import { ExpressGenerator } from './src/generators/express-generator.js';
import path from 'path';

const projectPath = path.join(process.cwd(), 'demo-output/my-api');

const config = {
  name: 'my-api',
  framework: 'express',
  projectPath: projectPath,
  sqlDatabase: 'postgresql',
  nosqlDatabases: ['redis'],
  includeAuth: true,
  includeDocker: true,
  includeKubernetes: true,
  includeTests: true,
  includeSwagger: true,
};

console.log('🚀 Generating Express.js project with full stack...\n');
console.log('Configuration:');
console.log('  - Framework: Express.js (TypeScript)');
console.log('  - Database: PostgreSQL');
console.log('  - Cache: Redis');
console.log('  - Features: Auth, Docker, Kubernetes, Tests, Swagger\n');

const generator = new ExpressGenerator(config, projectPath);
await generator.generate();

console.log('\n✅ Project generated successfully!\n');
console.log('📁 Location: demo-output/my-api\n');
