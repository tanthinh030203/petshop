declare namespace Express {
  interface Request {
    user?: {
      id: number;
      branchId: number;
      role: string;
      username: string;
    };
  }
}
