import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;
    const data = await authService.login(username, password);

    res.json({
      success: true,
      data: {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const data = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: {
        accessToken: data.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.logout(req.user!.id);

    res.json({
      success: true,
      data: {
        message: 'Logged out',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getMe(req.user!.id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
