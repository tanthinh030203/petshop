import { Request, Response, NextFunction } from 'express';
import * as invoiceService from '../services/invoice.service';
import { getBranchId } from '../middlewares/branch.middleware';

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req)!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status as string | undefined;
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const { data, meta } = await invoiceService.getAll({
      page, limit, branchId, status, customerId, from, to,
    });

    res.json({ success: true, data, meta });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const data = await invoiceService.getById(id);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req)!;
    const createdBy = req.user!.id;
    const data = await invoiceService.create(branchId, createdBy, req.body);

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const data = await invoiceService.updateStatus(id, status);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const addPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const invoiceId = Number(req.params.id);
    const branchId = getBranchId(req)!;
    const createdBy = req.user!.id;
    const data = await invoiceService.addPayment(invoiceId, branchId, createdBy, req.body);

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
