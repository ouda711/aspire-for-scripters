import type { QuestionCollection } from 'inquirer';
import { validators } from '../utils/validator.js';

export const projectPrompts: QuestionCollection = [
  {
    type: 'input',
    name: 'projectName',
    message: 'What is your project name?',
    default: 'my-aspire-app',
    validate: validators.projectName,
    filter: (input: string) => input.trim().toLowerCase(),
  },
  {
    type: 'input',
    name: 'description',
    message: 'Project description (optional):',
    default: '',
  },
  {
    type: 'input',
    name: 'author',
    message: 'Author name (optional):',
    default: '',
  },
  {
    type: 'list',
    name: 'packageManager',
    message: 'Which package manager would you like to use?',
    choices: [
      { name: 'npm', value: 'npm' },
      { name: 'yarn', value: 'yarn' },
      { name: 'pnpm', value: 'pnpm' },
    ],
    default: 'npm',
  },
];
