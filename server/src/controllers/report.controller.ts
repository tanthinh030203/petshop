import { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/report.service';
import { getBranchId } from '../middlewares/branch.middleware';

export const getRevenue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req);
    const from = req.query.from as string;
    const to = req.query.to as string;

    if (!from || !to) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Query parameters "from" and "to" are required' },
      });
      return;
    }

    const data = await reportService.getRevenue(branchId, from, to);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getTopProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req);
    const from = req.query.from as string;
    const to = req.query.to as string;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    if (!from || !to) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Query parameters "from" and "to" are required' },
      });
      return;
    }

    const data = await reportService.getTopProducts(branchId, from, to, limit);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getTopServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req);
    const from = req.query.from as string;
    const to = req.query.to as string;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    if (!from || !to) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Query parameters "from" and "to" are required' },
      });
      return;
    }

    const data = await reportService.getTopServices(branchId, from, to, limit);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getCustomerStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req);
    const from = req.query.from as string;
    const to = req.query.to as string;

    if (!from || !to) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Query parameters "from" and "to" are required' },
      });
      return;
    }

    const data = await reportService.getCustomerStats(branchId, from, to);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getAppointmentStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req);
    const from = req.query.from as string;
    const to = req.query.to as string;

    if (!from || !to) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Query parameters "from" and "to" are required' },
      });
      return;
    }

    const data = await reportService.getAppointmentStats(branchId, from, to);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getStockAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req);
    const data = await reportService.getStockAlerts(branchId);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
