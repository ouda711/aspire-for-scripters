import type { QuestionCollection } from 'inquirer';

export const frontendPrompts: QuestionCollection = [
  {
    type: 'list',
    name: 'frontend',
    message: 'Include a frontend framework?',
    choices: [
      { name: 'None - Backend only', value: 'none' },
      { name: 'React (with Vite)', value: 'react' },
      { name: 'Next.js', value: 'nextjs' },
      { name: 'Vue.js', value: 'vue' },
      { name: 'Angular', value: 'angular' },
    ],
    default: 'none',
  },
  {
    type: 'confirm',
    name: 'monorepo',
    message: 'Include frontend in the same repository (monorepo)?',
    default: true,
    when: (answers) => answers.frontend !== 'none',
  },
];
