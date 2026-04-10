import { Request, Response, NextFunction } from 'express';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  branch_mgr: [
    'customers:*', 'pets:*', 'products:*', 'orders:*',
    'appointments:*', 'medical:read', 'services:*',
    'reports:*', 'users:manage',
  ],
  veterinarian: [
    'customers:read', 'pets:read', 'pets:write',
    'appointments:read', 'appointments:write',
    'medical:*', 'vaccinations:*',
  ],
  receptionist: [
    'customers:*', 'pets:read', 'pets:write',
    'appointments:*', 'orders:create', 'orders:read',
    'invoices:create', 'invoices:read',
  ],
  sales_staff: [
    'customers:read', 'products:read', 'orders:*',
    'invoices:create', 'invoices:read', 'stock:read',
  ],
  groomer: [
    'appointments:read', 'pets:read', 'services:read',
  ],
  accountant: [
    'reports:*', 'invoices:read', 'payments:read',
  ],
};

function hasPermission(rolePermissions: string[], required: string): boolean {
  // Wildcard: role has all permissions
  if (rolePermissions.includes('*')) {
    return true;
  }

  // Exact match
  if (rolePermissions.includes(required)) {
    return true;
  }

  // Module wildcard match: e.g. 'pets:*' covers 'pets:read'
  const [module] = required.split(':');
  if (rolePermissions.includes(`${module}:*`)) {
    return true;
  }

  return false;
}

export const authorize = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

    const rolePerms = ROLE_PERMISSIONS[req.user.role];

    if (!rolePerms) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Role has no configured permissions',
        },
      });
      return;
    }

    const hasAll = permissions.every((perm) => hasPermission(rolePerms, perm));

    if (!hasAll) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
        },
      });
      return;
    }

    next();
  };
};
