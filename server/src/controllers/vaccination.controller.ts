import { Request, Response, NextFunction } from 'express';
import * as vaccinationService from '../services/vaccination.service';
import { getBranchId } from '../middlewares/branch.middleware';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req)!;
    const vetId = req.user!.id;
    const data = await vaccinationService.create(branchId, vetId, req.body);

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const data = await vaccinationService.getById(id);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getReminders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req)!;
    const daysAhead = req.query.daysAhead ? Number(req.query.daysAhead) : 7;
    const data = await vaccinationService.getReminders(branchId, daysAhead);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
