import { NextFunction, Request, Response } from "express";

export const asyncRoute =
  (handler: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    handler(req, res).catch(next);

export const paging = (req: Request) => ({
  limit: Math.min(Math.max(Number(req.query.limit) || 10, 1), 100),
  offset: Math.max(Number(req.query.offset) || 0, 0),
});
