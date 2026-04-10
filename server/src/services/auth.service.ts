import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import redis from '../config/redis';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

interface TokenPayload {
  id: number;
  branchId: number;
  role: string;
  username: string;
}

function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

function excludePasswordHash<T extends { passwordHash: string }>(
  user: T,
): Omit<T, 'passwordHash'> {
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export const login = async (username: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw Object.assign(new Error('Invalid username or password'), { statusCode: 401 });
  }

  if (!user.isActive) {
    throw Object.assign(new Error('Account is deactivated'), { statusCode: 403 });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw Object.assign(new Error('Invalid username or password'), { statusCode: 401 });
  }

  const tokenPayload: TokenPayload = {
    id: user.id,
    branchId: user.branchId,
    role: user.role,
    username: user.username,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  try {
    await redis.set(`refresh:${user.id}`, refreshToken, 'EX', REFRESH_TOKEN_TTL);
  } catch {
    logger.warn('Redis unavailable — refresh token not persisted');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  logger.info(`User ${user.username} logged in successfully`);

  return {
    user: excludePasswordHash(user),
    accessToken,
    refreshToken,
  };
};

export const refreshToken = async (token: string) => {
  let decoded: TokenPayload;
  try {
    decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  }

  try {
    const storedToken = await redis.get(`refresh:${decoded.id}`);
    if (storedToken && storedToken !== token) {
      throw Object.assign(new Error('Refresh token revoked'), { statusCode: 401 });
    }
  } catch (err: any) {
    if (err.statusCode) throw err;
    logger.warn('Redis unavailable — skipping refresh token validation');
  }

  const accessToken = generateAccessToken({
    id: decoded.id,
    branchId: decoded.branchId,
    role: decoded.role,
    username: decoded.username,
  });

  return { accessToken };
};

export const logout = async (userId: number) => {
  try {
    await redis.del(`refresh:${userId}`);
  } catch {
    logger.warn('Redis unavailable — refresh token not cleared');
  }
  logger.info(`User ${userId} logged out`);
};

export const getMe = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  return excludePasswordHash(user);
};
