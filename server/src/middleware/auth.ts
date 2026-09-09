import { NextFunction, Request, Response } from "express";

export type AuthPrincipal = {
  userId: string;
};

export type AuthenticatedRequest = Request & {
  auth: AuthPrincipal;
};

/**
 * 登录功能接入点。
 * 将来由 JWT/session 解析中间件写入 req.auth，再在受保护路由上启用此中间件。
 * 当前未挂载，不会改变现有匿名使用方式。
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!("auth" in req) || !req.auth) {
    res.status(401).json({ error: "请先登录" });
    return;
  }
  next();
}
