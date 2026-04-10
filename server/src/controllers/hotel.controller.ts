import { Request, Response, NextFunction } from 'express';
import * as hotelService from '../services/hotel.service';
import { getBranchId } from '../middlewares/branch.middleware';

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req)!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status as string | undefined;

    const { data, meta } = await hotelService.getAll({ page, limit, branchId, status });

    res.json({ success: true, data, meta });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req)!;
    const data = await hotelService.create(branchId, req.body);

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const data = await hotelService.checkIn(id);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const data = await hotelService.checkOut(id);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
