import { Request, Response, NextFunction } from 'express';
import * as medicalService from '../services/medical.service';
import { getBranchId } from '../middlewares/branch.middleware';

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req)!;
    const vetId = req.user!.id;
    const data = await medicalService.create(branchId, vetId, req.body);

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const data = await medicalService.getById(id);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const data = await medicalService.update(id, req.body);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const addPrescriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const medicalRecordId = Number(req.params.id);
    const data = await medicalService.addPrescriptions(medicalRecordId, req.body.items);

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
