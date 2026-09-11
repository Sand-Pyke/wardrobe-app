import { ClothingCategory, OutfitPart } from "./constants";

export type ImageAsset = {
  id: string;
  localFileName: string;
  mimeType: string;
  byteSize: number | null;
  checksum: string | null;
  sourceKey: string;
  createdAt: string;
};

export type StoredClothingItem = {
  id: string;
  category: ClothingCategory;
  imageAssetIds: string[];
  createdAt: string;
  sortOrder: number;
};

export type StoredOutfit = {
  id: string;
  category: string;
  parts: Partial<Record<OutfitPart, string>>;
  createdAt: string;
  sortOrder: number;
};

export type WardrobeState = {
  schemaVersion: 2;
  assetsById: Record<string, ImageAsset>;
  itemsById: Record<string, StoredClothingItem>;
  outfitsById: Record<string, StoredOutfit>;
  outfitCategories: string[];
};

// UI 使用的已解析视图模型；持久层不会保存 imageUris 或完整衣物副本。
export type ClothingItem = StoredClothingItem & {
  imageUris: string[];
};

export type Outfit = Omit<StoredOutfit, "parts"> & {
  parts: Partial<Record<OutfitPart, ClothingItem>>;
};
