import { Router } from "express";
import { pool } from "../db/pool";
import { asyncRoute, paging } from "../lib/http";

export const itemsRouter = Router();

itemsRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const { limit, offset } = paging(req);
    const categoryId = req.query.categoryId as string | undefined;
    const { rows } = await pool.query(
      `SELECT i.*, c.name AS category_name, c.value AS category_value FROM clothing_items i JOIN categories c ON c.id = i.category_id WHERE ($1::uuid IS NULL OR i.category_id = $1) ORDER BY i.sort_order, i.created_at DESC LIMIT $2 OFFSET $3`,
      [categoryId ?? null, limit, offset],
    );
    res.json({ data: rows, page: { limit, offset } });
  }),
);

itemsRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const {
      categoryId,
      imageUrls,
      userId = null,
    } = req.body as {
      categoryId?: string;
      imageUrls?: string[];
      userId?: string | null;
    };
    if (!categoryId || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      res
        .status(400) 
        .json({ error: "categoryId 与至少一张 imageUrls 为必填项" });
      return;
    }
    const { rows } = await pool.query(
      "INSERT INTO clothing_items (category_id, image_urls, user_id, sort_order) VALUES ($1, $2, $3, COALESCE((SELECT MAX(sort_order) + 1 FROM clothing_items WHERE category_id = $1), 0)) RETURNING *",
      [categoryId, JSON.stringify(imageUrls), userId],
    );
    res.status(201).json({ data: rows[0] });
  }),
);

itemsRouter.put(
  "/:id/sort",
  asyncRoute(async (req, res) => {
    const { sortOrder } = req.body;
    await pool.query(
      "UPDATE clothing_items SET sort_order = $1 WHERE id = $2",
      [sortOrder, req.params.id],
    );
    res.status(204).end();
  }),
);

itemsRouter.delete(
  "/",
  asyncRoute(async (req, res) => {
    const ids = req.body.ids;
    if (!Array.isArray(ids) || !ids.length) {
      res.status(400).json({ error: "ids 必填" });
      return;
    }
    await pool.query("DELETE FROM clothing_items WHERE id = ANY($1::uuid[])", [
      ids,           
    ]);
    res.status(204).end();
  }),
);
