import { Router } from "express";
import { pool } from "../db/pool";
import { asyncRoute } from "../lib/http";

export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  asyncRoute(async (_req, res) => {
    const { rows } = await pool.query(
      "SELECT id, name, value FROM categories WHERE type = $1 ORDER BY id",
      ["clothing"],
    );
    res.json({ data: rows });
  }),
);
