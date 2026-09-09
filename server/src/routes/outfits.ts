import { Router } from "express";
import { pool } from "../db/pool";
import { asyncRoute, paging } from "../lib/http";

export const outfitsRouter = Router();

outfitsRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const { limit, offset } = paging(req);
    const categoryId = req.query.categoryId as string | undefined;
    const { rows } = await pool.query(
      "SELECT * FROM outfits WHERE ($1::uuid IS NULL OR outfit_category_id = $1) ORDER BY sort_order, created_at DESC LIMIT $2 OFFSET $3",
      [categoryId ?? null, limit, offset],
    );
    res.json({ data: rows, page: { limit, offset } });
  }),
);

outfitsRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const {
      outfitCategoryId,
      parts,
      thumbnailUrl = null,
      userId = null,
    } = req.body as {
      outfitCategoryId?: string;
      thumbnailUrl?: string | null;
      userId?: string | null;
      parts?: Record<
        string,
        { clothingItemId: string; category: string }
      >;
    };
    if (
      !outfitCategoryId ||
      !parts?.torso ||
      (parts.torso.category !== "dress" && !parts.legs)
    ) {
      res.status(400).json({ error: "躯干必填；选择上衣时腿部必填" });
      return;
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        "INSERT INTO outfits (outfit_category_id, thumbnail_url, user_id) VALUES ($1, $2, $3) RETURNING *",
        [outfitCategoryId, thumbnailUrl, userId],
      );
      for (const [partType, part] of Object.entries(parts)) {
        if (part?.clothingItemId) {
          await client.query(
            "INSERT INTO outfit_parts (outfit_id, part_type, clothing_item_id) VALUES ($1, $2, $3)",
            [result.rows[0].id, partType, part.clothingItemId],
          );
        }
      }
      await client.query("COMMIT");
      res.status(201).json({ data: result.rows[0] });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }),
);

outfitsRouter.put(
  "/:id",
  asyncRoute(async (req, res) => {
    const { outfitCategoryId, thumbnailUrl } = req.body;
    const { rows } = await pool.query(
      "UPDATE outfits SET outfit_category_id = COALESCE($1, outfit_category_id), thumbnail_url = COALESCE($2, thumbnail_url), updated_at = NOW() WHERE id = $3 RETURNING *",
      [outfitCategoryId ?? null, thumbnailUrl ?? null, req.params.id],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "未找到穿搭" });
      return;
    }
    res.json({ data: rows[0] });
  }),
);

outfitsRouter.delete(
  "/",
  asyncRoute(async (req, res) => {
    const ids = req.body.ids;
    if (!Array.isArray(ids) || !ids.length) {
      res.status(400).json({ error: "ids 必填" });
      return;
    }
    await pool.query("DELETE FROM outfits WHERE id = ANY($1::uuid[])", [ids]);
    res.status(204).end();
  }),
);
