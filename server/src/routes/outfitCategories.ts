import { Router } from "express";
import { pool } from "../db/pool";
import { asyncRoute } from "../lib/http";

export const outfitCategoriesRouter = Router();

outfitCategoriesRouter.get(
  "/",
  asyncRoute(async (_req, res) => {
    const { rows } = await pool.query(
      "SELECT * FROM outfit_categories ORDER BY created_at",
    );
    res.json({ data: rows });
  }),
);

outfitCategoriesRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const { name, userId = null } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: "name 必填" });
      return;
    }
    const { rows } = await pool.query(
      "INSERT INTO outfit_categories (name, user_id) VALUES ($1, $2) ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING *",
      [name.trim(), userId],
    );
    res.status(201).json({ data: rows[0] });
  }),
);
