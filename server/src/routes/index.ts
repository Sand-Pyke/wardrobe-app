import { Router } from "express";
import { categoriesRouter } from "./categories";
import { itemsRouter } from "./items";
import { outfitCategoriesRouter } from "./outfitCategories";
import { outfitsRouter } from "./outfits";

export const apiRouter = Router();

apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/items", itemsRouter);
apiRouter.use("/outfit-categories", outfitCategoriesRouter);
apiRouter.use("/outfits", outfitsRouter);
