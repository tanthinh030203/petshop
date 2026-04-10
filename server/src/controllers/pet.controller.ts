import { Request, Response, NextFunction } from 'express';
import { getBranchId } from '../middlewares/branch.middleware';
import * as petService from '../services/pet.service';

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await petService.getAll(req.query as any);
    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pet = await petService.getById(Number(req.params.id));
    res.json({ success: true, data: pet });
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
    const pet = await petService.create(branchId, req.body);
    res.status(201).json({ success: true, data: pet });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pet = await petService.update(Number(req.params.id), req.body);
    res.json({ success: true, data: pet });
  } catch (error) {
    next(error);
  }
};

export const getMedicalRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const records = await petService.getMedicalRecords(Number(req.params.id));
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

export const getVaccinations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vaccinations = await petService.getVaccinations(Number(req.params.id));
    res.json({ success: true, data: vaccinations });
  } catch (error) {
    next(error);
  }
};

export const getAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appointments = await petService.getAppointments(Number(req.params.id));
    res.json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};
