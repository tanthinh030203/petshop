import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('query', (e: { query: string; duration: number }) => {
  logger.debug(`Query: ${e.query}`);
  logger.debug(`Duration: ${e.duration}ms`);
});

prisma.$on('error', (e: { message: string }) => {
  logger.error(`Prisma error: ${e.message}`);
});

prisma.$on('warn', (e: { message: string }) => {
  logger.warn(`Prisma warning: ${e.message}`);
});

export default prisma;
