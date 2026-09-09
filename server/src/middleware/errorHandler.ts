import { NextFunction, Request, Response } from "express";

export function notFoundHandler(
  _req: Request,
  res: Response,
) {
  res.status(404).json({ error: "接口不存在" });
}

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(error);
  res.status(500).json({ error: "服务器暂时不可用" });
}
