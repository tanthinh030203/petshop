import { Request, Response, NextFunction } from 'express';

export const getBranchId = (req: Request): number | undefined => {
  if (!req.user) {
    return undefined;
  }

  // super_admin can query any branch via ?branchId=
  if (req.user.role === 'super_admin' && req.query.branchId) {
    return Number(req.query.branchId);
  }

  // All other roles are restricted to their own branch
  return req.user.branchId;
};

export const branchFilter = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication is required',
      },
    });
    return;
  }

  const effectiveBranchId = getBranchId(req);

  if (effectiveBranchId !== undefined) {
    req.query.branchId = String(effectiveBranchId);
  }

  next();
};
