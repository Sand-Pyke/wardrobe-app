import { ClothingCategory, OutfitPart } from "./constants";

export type ClothingItem = {
  id: string;
  category: ClothingCategory;
  imageUris: string[];
  createdAt: string;
  sortOrder: number;
};

export type Outfit = {
  id: string;
  category: string;
  parts: Partial<Record<OutfitPart, ClothingItem>>;
  createdAt: string;
  sortOrder: number;
};
