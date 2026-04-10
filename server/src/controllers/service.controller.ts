import { Request, Response, NextFunction } from 'express';
import * as serviceModuleService from '../services/serviceModule.service';

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await serviceModuleService.getAll(req.query as any);
    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const service = await serviceModuleService.getById(Number(req.params.id));
    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const service = await serviceModuleService.create(req.body);
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const service = await serviceModuleService.update(Number(req.params.id), req.body);
    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};
