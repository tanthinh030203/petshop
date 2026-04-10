import { Request, Response, NextFunction } from 'express';
import * as appointmentService from '../services/appointment.service';
import { getBranchId } from '../middlewares/branch.middleware';

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req)!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;
    const date = req.query.date as string | undefined;
    const assignedUserId = req.query.assignedUserId ? Number(req.query.assignedUserId) : undefined;

    const { data, meta } = await appointmentService.getAll({
      page, limit, branchId, status, type, date, assignedUserId,
    });

    res.json({ success: true, data, meta });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const data = await appointmentService.getById(id);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req)!;
    const createdBy = req.user!.id;
    const data = await appointmentService.create(branchId, createdBy, req.body);

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const data = await appointmentService.update(id, req.body);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const data = await appointmentService.updateStatus(id, status);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getCalendar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req)!;
    const from = req.query.from as string;
    const to = req.query.to as string;

    if (!from || !to) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Query parameters "from" and "to" are required' },
      });
      return;
    }

    const data = await appointmentService.getCalendar(branchId, from, to);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
