import Redis from 'ioredis';
import logger from '../utils/logger';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) {
      logger.warn('Redis unavailable — running without cache');
      return null; // stop retrying
    }
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', () => {
  // silenced — retryStrategy handles logging
});

// Try to connect but don't block the app if Redis is down
redis.connect().catch(() => {
  logger.warn('Redis not available — auth refresh tokens will use in-memory fallback');
});

export default redis;
