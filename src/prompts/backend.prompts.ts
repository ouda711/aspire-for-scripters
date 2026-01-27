import type { QuestionCollection } from 'inquirer';

export const backendPrompts: QuestionCollection = [
  {
    type: 'list',
    name: 'framework',
    message: 'Choose your backend framework:',
    choices: [
      {
        name: 'Express.js - Fast, unopinionated, minimalist web framework',
        value: 'express',
      },
      {
        name: 'NestJS - Progressive Node.js framework with TypeScript',
        value: 'nestjs',
      },
    ],
    default: 'express',
  },
  {
    type: 'confirm',
    name: 'includeAuth',
    message: 'Include authentication setup (JWT)?',
    default: true,
  },
  {
    type: 'confirm',
    name: 'includeSwagger',
    message: 'Include Swagger/OpenAPI documentation?',
    default: true,
  },
];
