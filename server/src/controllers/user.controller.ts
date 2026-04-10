import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await userService.getAll(req.query as any);
    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.getById(Number(req.params.id));
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.update(Number(req.params.id), req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.updateStatus(Number(req.params.id), req.body.isActive);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
