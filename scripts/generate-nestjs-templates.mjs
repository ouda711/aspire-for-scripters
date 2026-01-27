import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.join(__dirname, '../templates/nestjs');

const templates = {
  // Base files
  'base/.gitignore.template': `# compiled output
/dist
/node_modules
/.pnp
.pnp.js

# Logs
logs
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store

# Tests
/coverage
/.nyc_output

# IDEs and editors
/.idea
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# IDE - VSCode
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json

# Environment variables
.env
.env.local
.env.*.local

# Temp
*.swp
*.swo
*~
`,

  'base/.eslintrc.js.template': `module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
`,

  'base/.prettierrc.template': `{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
`,

  'base/.env.example.template': `# Application
NODE_ENV=development
PORT=3000

# CORS
CORS_ORIGIN=*

{{#if includeAuth}}
# JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=1d
{{/if}}

{{#if hasPostgres}}
# PostgreSQL Database
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME={{name}}
DB_PASSWORD=password
DB_DATABASE={{name}}
DB_SYNCHRONIZE=true
{{/if}}

{{#if hasMySQL}}
# MySQL Database
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME={{name}}
DB_PASSWORD=password
DB_DATABASE={{name}}
DB_SYNCHRONIZE=true
{{/if}}

{{#if hasMongoDB}}
# MongoDB
MONGODB_URI=mongodb://localhost:27017/{{name}}
{{/if}}

{{#if hasRedis}}
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
{{/if}}
`,

  'base/README.md.template': `# {{projectNamePascal}}

{{#if description}}{{description}}{{else}}NestJS application generated with Aspire for Scripters{{/if}}

## Description

A NestJS application with:
- Framework: NestJS
{{#if sqlDatabase}}
- Database: {{sqlDatabase}}
{{/if}}
{{#if includeAuth}}
- Authentication: JWT
{{/if}}
{{#if includeSwagger}}
- API Documentation: Swagger/OpenAPI
{{/if}}
{{#if includeLogging}}
- Logging: {{loggingLibrary}}
{{/if}}

## Installation

\`\`\`bash
{{#eq packageManager "npm"}}
npm install
{{/eq}}
{{#eq packageManager "yarn"}}
yarn install
{{/eq}}
{{#eq packageManager "pnpm"}}
pnpm install
{{/eq}}
\`\`\`

## Running the app

\`\`\`bash
# development
{{#eq packageManager "npm"}}
npm run start:dev
{{/eq}}
{{#eq packageManager "yarn"}}
yarn start:dev
{{/eq}}
{{#eq packageManager "pnpm"}}
pnpm start:dev
{{/eq}}

# production mode
{{#eq packageManager "npm"}}
npm run start:prod
{{/eq}}
{{#eq packageManager "yarn"}}
yarn start:prod
{{/eq}}
{{#eq packageManager "pnpm"}}
pnpm start:prod
{{/eq}}
\`\`\`

{{#if includeTesting}}
## Test

\`\`\`bash
# unit tests
{{#eq packageManager "npm"}}
npm run test
{{/eq}}
{{#eq packageManager "yarn"}}
yarn test
{{/eq}}
{{#eq packageManager "pnpm"}}
pnpm test
{{/eq}}

# e2e tests
{{#eq packageManager "npm"}}
npm run test:e2e
{{/eq}}
{{#eq packageManager "yarn"}}
yarn test:e2e
{{/eq}}
{{#eq packageManager "pnpm"}}
pnpm test:e2e
{{/eq}}

# test coverage
{{#eq packageManager "npm"}}
npm run test:cov
{{/eq}}
{{#eq packageManager "yarn"}}
yarn test:cov
{{/eq}}
{{#eq packageManager "pnpm"}}
pnpm test:cov
{{/eq}}
\`\`\`
{{/if}}

{{#if includeSwagger}}
## API Documentation

Once the application is running, visit [http://localhost:3000/api-docs](http://localhost:3000/api-docs) to view the Swagger documentation.
{{/if}}

## Project Structure

\`\`\`
src/
├── main.ts              # Application entry point
├── app.module.ts        # Root module
├── app.controller.ts    # Root controller
├── app.service.ts       # Root service
├── config/              # Configuration
├── common/              # Shared utilities (filters, interceptors, guards)
├── health/              # Health check module
{{#if hasDatabase}}
├── database/            # Database configuration
{{/if}}
{{#if includeAuth}}
├── auth/                # Authentication module
├── users/               # Users module
{{/if}}
{{#if includeLogging}}
└── logger/              # Logging module
{{/if}}
\`\`\`

## Environment Variables

Copy \`.env.example\` to \`.env\` and update the values:

\`\`\`bash
cp .env.example .env
\`\`\`

## License

MIT

---

Generated with ❤️ by [Aspire for Scripters](https://github.com/ouda-paystack/aspire-for-scripters)
`,

  'base/package.json.template': `{
  "name": "{{name}}",
  "version": "1.0.0",
  "description": "{{#if description}}{{description}}{{else}}NestJS API built with Aspire for Scripters{{/if}}",
  "author": "{{#if author}}{{author}}{{else}}Your Name{{/if}}",
  "private": true,
  "license": "MIT",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \\"src/**/*.ts\\" \\"test/**/*.ts\\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \\"{src,apps,libs,test}/**/*.ts\\" --fix",
    {{#if includeTesting}}
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    {{/if}}
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/config": "^3.1.1",
    {{#if includeSwagger}}
    "@nestjs/swagger": "^7.1.17",
    {{/if}}
    {{#if hasPostgres}}
    "@nestjs/typeorm": "^10.0.1",
    "typeorm": "^0.3.19",
    "pg": "^8.11.3",
    {{/if}}
    {{#if hasMySQL}}
    "@nestjs/typeorm": "^10.0.1",
    "typeorm": "^0.3.19",
    "mysql2": "^3.6.5",
    {{/if}}
    {{#if hasMongoDB}}
    "@nestjs/mongoose": "^10.0.2",
    "mongoose": "^8.0.3",
    {{/if}}
    {{#if hasRedis}}
    "@nestjs/cache-manager": "^2.1.1",
    "cache-manager": "^5.3.2",
    "cache-manager-redis-store": "^3.0.1",
    {{/if}}
    {{#if includeAuth}}
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "bcryptjs": "^2.4.3",
    {{/if}}
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.1.14",
    "rxjs": "^7.8.1",
    {{#if includeLogging}}
    {{#eq loggingLibrary "winston"}}
    "nest-winston": "^1.9.4",
    "winston": "^3.11.0",
    {{/eq}}
    {{#eq loggingLibrary "pino"}}
    "nestjs-pino": "^3.5.0",
    "pino-http": "^8.6.0",
    "pino-pretty": "^10.3.1",
    {{/eq}}
    {{/if}}
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/schematics": "^10.1.0",
    "@nestjs/testing": "^10.3.0",
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.6",
    {{#if includeAuth}}
    "@types/passport-jwt": "^4.0.0",
    "@types/bcryptjs": "^2.4.6",
    {{/if}}
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "@typescript-eslint/parser": "^6.17.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.2",
    "prettier": "^3.1.1",
    {{#if includeTesting}}
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "@types/supertest": "^6.0.2",
    {{/if}}
    "source-map-support": "^0.5.21",
    "ts-loader": "^9.5.1",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.3.3"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\\\.spec\\\\.ts$",
    "transform": {
      "^.+\\\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
`,

  'base/tsconfig.json.template': `{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
`,

  'base/tsconfig.build.json.template': `{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
`,

  'base/nest-cli.json.template': `{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
`,

  // Source files
  'src/main.ts.template': `import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
{{#if includeSwagger}}
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
{{/if}}
import { AppModule } from './app.module';
{{#if includeLogging}}
{{#eq loggingLibrary "winston"}}
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
{{/eq}}
{{#eq loggingLibrary "pino"}}
import { Logger } from 'nestjs-pino';
{{/eq}}
{{/if}}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  {{#if includeLogging}}
  {{#eq loggingLibrary "winston"}}
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  {{/eq}}
  {{#eq loggingLibrary "pino"}}
  app.useLogger(app.get(Logger));
  {{/eq}}
  {{/if}}

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  {{#if includeSwagger}}
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('{{projectNamePascal}} API')
    .setDescription('{{#if description}}{{description}}{{else}}API documentation for {{name}}{{/if}}')
    .setVersion('1.0')
    {{#if includeAuth}}
    .addBearerAuth()
    {{/if}}
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  {{/if}}

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(\`Application is running on: http://localhost:\${port}\`);
  {{#if includeSwagger}}
  console.log(\`Swagger documentation: http://localhost:\${port}/api-docs\`);
  {{/if}}
}

bootstrap();
`,

  'src/app.module.ts.template': `import { Module } from '@nestjs/common';
{{#if includeLogging}}
{{#eq loggingLibrary "winston"}}
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
{{/eq}}
{{#eq loggingLibrary "pino"}}
import { LoggerModule } from 'nestjs-pino';
{{/eq}}
{{/if}}
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
{{#if hasDatabase}}
import { DatabaseModule } from './database/database.module';
{{/if}}
{{#if includeAuth}}
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
{{/if}}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    {{#if includeLogging}}
    {{#eq loggingLibrary "winston"}}
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return \`\${timestamp} [\${context}] \${level}: \${message}\`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
    {{/eq}}
    {{#eq loggingLibrary "pino"}}
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      },
    }),
    {{/eq}}
    {{/if}}
    HealthModule,
    {{#if hasDatabase}}
    DatabaseModule,
    {{/if}}
    {{#if includeAuth}}
    AuthModule,
    UsersModule,
    {{/if}}
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`,

  'src/app.controller.ts.template': `import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
{{#if includeSwagger}}
import { ApiTags, ApiOperation } from '@nestjs/swagger';
{{/if}}

{{#if includeSwagger}}
@ApiTags('app')
{{/if}}
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  {{#if includeSwagger}}
  @ApiOperation({ summary: 'Get API welcome message' })
  {{/if}}
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
`,

  'src/app.service.ts.template': `import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to {{projectNamePascal}} API!';
  }
}
`,

};

// Function to write all templates
async function generateTemplates() {
  console.log('Generating NestJS templates...\n');
  
  let count = 0;
  for (const [filePath, content] of Object.entries(templates)) {
    const fullPath = path.join(templatesDir, filePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf-8');
    console.log(`✓ Created: ${filePath}`);
    count++;
  }
  
  console.log(`\n✨ Successfully generated ${count} template files!\n`);
}

generateTemplates().catch(console.error);
