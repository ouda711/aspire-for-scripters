import type { QuestionCollection } from 'inquirer';

export const databasePrompts: QuestionCollection = [
  {
    type: 'list',
    name: 'sqlDatabase',
    message: 'Choose your primary SQL database:',
    choices: [
      { name: 'PostgreSQL - Advanced open-source relational database', value: 'postgresql' },
      { name: 'MySQL - Popular open-source relational database', value: 'mysql' },
      { name: 'SQLite - Lightweight file-based database (development only)', value: 'sqlite' },
      { name: 'None - Skip SQL database', value: 'none' },
    ],
    default: 'postgresql',
  },
  {
    type: 'checkbox',
    name: 'nosqlDatabases',
    message: 'Select additional NoSQL databases (optional):',
    choices: [
      { name: 'MongoDB - Document-oriented database', value: 'mongodb' },
      { name: 'Redis - In-memory data structure store (caching/sessions)', value: 'redis' },
    ],
    default: [],
  },
];
