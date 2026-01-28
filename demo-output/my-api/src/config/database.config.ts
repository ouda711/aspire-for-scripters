export const databaseConfig = {
  postgres: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/my-api',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
};