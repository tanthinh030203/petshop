import { Request, Response, NextFunction } from 'express';
import * as branchService from '../services/branch.service';

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await branchService.getAll(req.query as any);
    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branch = await branchService.getById(Number(req.params.id));
    res.json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branch = await branchService.create(req.body);
    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branch = await branchService.update(Number(req.params.id), req.body);
    res.json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await branchService.remove(Number(req.params.id));
    res.json({ success: true, data: { message: 'Branch deactivated successfully' } });
  } catch (error) {
    next(error);
  }
};
