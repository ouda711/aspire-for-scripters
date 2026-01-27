import type { QuestionCollection } from 'inquirer';

export const additionalPrompts: QuestionCollection = [
  {
    type: 'confirm',
    name: 'includeDocker',
    message: 'Include Docker Compose configuration?',
    default: true,
  },
  {
    type: 'confirm',
    name: 'includeKubernetes',
    message: 'Include Kubernetes manifests?',
    default: false,
  },
  {
    type: 'confirm',
    name: 'includeMessageQueue',
    message: 'Include message queue for background jobs?',
    default: false,
  },
  {
    type: 'list',
    name: 'messageQueue',
    message: 'Choose message queue:',
    choices: [
      { name: 'BullMQ - Fast and robust queue based on Redis', value: 'bullmq' },
      { name: 'RabbitMQ - Traditional message broker', value: 'rabbitmq' },
    ],
    default: 'bullmq',
    when: (answers) => answers.includeMessageQueue === true,
  },
  {
    type: 'confirm',
    name: 'includeTesting',
    message: 'Include testing setup (Jest/Vitest)?',
    default: true,
  },
  {
    type: 'confirm',
    name: 'includeCI',
    message: 'Include CI/CD configuration?',
    default: true,
  },
  {
    type: 'list',
    name: 'ciProvider',
    message: 'Choose CI provider:',
    choices: [
      { name: 'GitHub Actions', value: 'github' },
      { name: 'GitLab CI', value: 'gitlab' },
    ],
    default: 'github',
    when: (answers) => answers.includeCI === true,
  },
  {
    type: 'confirm',
    name: 'includeHusky',
    message: 'Include Husky for Git hooks (linting, testing)?',
    default: true,
  },
  {
    type: 'confirm',
    name: 'includeLogging',
    message: 'Include structured logging?',
    default: true,
  },
  {
    type: 'list',
    name: 'loggingLibrary',
    message: 'Choose logging library:',
    choices: [
      { name: 'Winston - Versatile logging library', value: 'winston' },
      { name: 'Pino - Fast JSON logger', value: 'pino' },
    ],
    default: 'pino',
    when: (answers) => answers.includeLogging === true,
  },
  {
    type: 'confirm',
    name: 'includeMetrics',
    message: 'Include metrics and monitoring (Prometheus)?',
    default: false,
  },
];
