import { Request, Response, NextFunction } from 'express';
import * as stockService from '../services/stock.service';
import { getBranchId } from '../middlewares/branch.middleware';

export const getStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req)!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;
    const lowStock = req.query.lowStock === 'true';

    const { data, meta } = await stockService.getStock(branchId, { page, limit, search, lowStock });

    res.json({ success: true, data, meta });
  } catch (error) {
    next(error);
  }
};

export const importStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req)!;
    const userId = req.user!.id;
    const data = await stockService.importStock(branchId, userId, req.body.items);

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const exportStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req)!;
    const userId = req.user!.id;
    const data = await stockService.exportStock(branchId, userId, req.body.items);

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const transferStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fromBranchId = getBranchId(req)!;
    const userId = req.user!.id;
    const { toBranchId, items } = req.body;
    const data = await stockService.transferStock(fromBranchId, toBranchId, userId, items);

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getMovements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = getBranchId(req)!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const productId = req.query.productId ? Number(req.query.productId) : undefined;
    const type = req.query.type as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const { data, meta } = await stockService.getMovements(branchId, {
      page, limit, productId, type, from, to,
    });

    res.json({ success: true, data, meta });
  } catch (error) {
    next(error);
  }
};
