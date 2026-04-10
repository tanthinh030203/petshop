import { Request, Response, NextFunction } from 'express';
import { getBranchId } from '../middlewares/branch.middleware';
import * as customerService from '../services/customer.service';

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await customerService.getAll(req.query as any);
    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customer = await customerService.getById(Number(req.params.id));
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req);
    if (!branchId) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Branch ID is required' } });
      return;
    }
    const customer = await customerService.create(branchId, req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customer = await customerService.update(Number(req.params.id), req.body);
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req);
    if (!branchId) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Branch ID is required' } });
      return;
    }
    const customers = await customerService.search(branchId, req.query.q as string);
    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

export const getPets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pets = await customerService.getPets(Number(req.params.id));
    res.json({ success: true, data: pets });
  } catch (error) {
    next(error);
  }
};
