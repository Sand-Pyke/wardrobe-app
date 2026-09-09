import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { Pool } from "pg";

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const port = Number(process.env.PORT ?? 3000);
app.use(cors());
app.use(express.json({ limit: "4mb" }));

const asyncRoute =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);
const paging = (req: Request) => ({
  limit: Math.min(Math.max(Number(req.query.limit) || 10, 1), 100),
  offset: Math.max(Number(req.query.offset) || 0, 0),
});

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get(
  "/api/categories",
  asyncRoute(async (_req, res) => {
    const { rows } = await pool.query(
      "SELECT id, name, value FROM categories WHERE type = $1 ORDER BY id",
      ["clothing"],
    );
    res.json({ data: rows });
  }),
);
app.get(
  "/api/items",
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
app.post(
  "/api/items",
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
app.put(
  "/api/items/:id/sort",
  asyncRoute(async (req, res) => {
    const { sortOrder } = req.body;
    await pool.query(
      "UPDATE clothing_items SET sort_order = $1 WHERE id = $2",
      [sortOrder, req.params.id],
    );
    res.status(204).end();
  }),
);
app.delete(
  "/api/items",
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

app.get(
  "/api/outfit-categories",
  asyncRoute(async (_req, res) => {
    const { rows } = await pool.query(
      "SELECT * FROM outfit_categories ORDER BY created_at",
    );
    res.json({ data: rows });
  }),
);
app.post(
  "/api/outfit-categories",
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
app.get(
  "/api/outfits",
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
app.post(
  "/api/outfits",
  asyncRoute(async (req, res) => {
    const { outfitCategoryId, parts, thumbnailUrl = null, userId = null } = req.body as {
      outfitCategoryId?: string;
      thumbnailUrl?: string | null;
      userId?: string | null;
      parts?: Record<string, { clothingItemId: string; category: string }>;
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
      for (const [partType, part] of Object.entries(parts))
        if (part?.clothingItemId)
          await client.query(
            "INSERT INTO outfit_parts (outfit_id, part_type, clothing_item_id) VALUES ($1, $2, $3)",
            [result.rows[0].id, partType, part.clothingItemId],
          );
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
app.put(
  "/api/outfits/:id",
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
app.delete(
  "/api/outfits",
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
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ error: "服务器暂时不可用" });
});
app.listen(port, () => console.log(`Wardrobe API listening on :${port}`));
