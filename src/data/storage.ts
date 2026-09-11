import AsyncStorage from "@react-native-async-storage/async-storage";
import { ClothingCategory, OutfitPart } from "../constants";
import {
  ClothingItem,
  Outfit,
  StoredClothingItem,
  StoredOutfit,
  WardrobeState,
} from "../types";
import {
  deleteImageAssetFiles,
  imageSourceKey,
  importImageAsset,
} from "./imageAssets";

const STATE_KEY = "@axue/wardrobe:v2";
const LEGACY_KEYS = {
  items: "@axue/items",
  outfits: "@axue/outfits",
  outfitCategories: "@axue/outfitCategories",
};

type LegacyClothingItem = Omit<ClothingItem, "imageAssetIds">;
type LegacyOutfit = Omit<Outfit, "parts"> & {
  parts: Partial<Record<OutfitPart, LegacyClothingItem>>;
};

export const createEmptyWardrobeState = (): WardrobeState => ({
  schemaVersion: 2,
  assetsById: {},
  itemsById: {},
  outfitsById: {},
  outfitCategories: [],
});

function parseOr<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function isWardrobeState(value: unknown): value is WardrobeState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<WardrobeState>;
  return (
    candidate.schemaVersion === 2 &&
    Boolean(candidate.assetsById) &&
    Boolean(candidate.itemsById) &&
    Boolean(candidate.outfitsById) &&
    Array.isArray(candidate.outfitCategories)
  );
}

async function migrateLegacyState(): Promise<WardrobeState> {
  const [itemsEntry, outfitsEntry, categoriesEntry] =
    await AsyncStorage.multiGet([
      LEGACY_KEYS.items,
      LEGACY_KEYS.outfits,
      LEGACY_KEYS.outfitCategories,
    ]);
  const legacyItems = parseOr<LegacyClothingItem[]>(itemsEntry[1], []);
  const legacyOutfits = parseOr<LegacyOutfit[]>(outfitsEntry[1], []);
  const outfitCategories = parseOr<string[]>(categoriesEntry[1], []);
  const next = createEmptyWardrobeState();
  next.outfitCategories = outfitCategories;

  if (!legacyItems.length && !legacyOutfits.length && !outfitCategories.length) {
    await AsyncStorage.setItem(STATE_KEY, JSON.stringify(next));
    return next;
  }

  const importedAssets = [];
  const assetIdBySource = new Map<string, string>();

  try {
    for (const legacyItem of legacyItems) {
      const imageAssetIds: string[] = [];
      for (const uri of legacyItem.imageUris ?? []) {
        const sourceKey = imageSourceKey(uri);
        let assetId = assetIdBySource.get(sourceKey);
        if (!assetId) {
          const asset = await importImageAsset(uri);
          importedAssets.push(asset);
          next.assetsById[asset.id] = asset;
          assetIdBySource.set(sourceKey, asset.id);
          assetId = asset.id;
        }
        imageAssetIds.push(assetId);
      }

      const storedItem: StoredClothingItem = {
        id: legacyItem.id,
        category: legacyItem.category as ClothingCategory,
        imageAssetIds,
        createdAt: legacyItem.createdAt,
        sortOrder: legacyItem.sortOrder,
      };
      next.itemsById[storedItem.id] = storedItem;
    }

    for (const legacyOutfit of legacyOutfits) {
      const parts: Partial<Record<OutfitPart, string>> = {};
      (Object.entries(legacyOutfit.parts) as Array<
        [OutfitPart, LegacyClothingItem | undefined]
      >).forEach(([part, item]) => {
        if (item && next.itemsById[item.id]) parts[part] = item.id;
      });

      const storedOutfit: StoredOutfit = {
        id: legacyOutfit.id,
        category: legacyOutfit.category,
        parts,
        createdAt: legacyOutfit.createdAt,
        sortOrder: legacyOutfit.sortOrder,
      };
      next.outfitsById[storedOutfit.id] = storedOutfit;
    }

    await AsyncStorage.setItem(STATE_KEY, JSON.stringify(next));
    return next;
  } catch (error) {
    deleteImageAssetFiles(importedAssets);
    throw error;
  }
}

export const repository = {
  async getState(): Promise<WardrobeState> {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    const parsed = parseOr<unknown>(raw, null);
    if (isWardrobeState(parsed)) return parsed;
    return migrateLegacyState();
  },

  saveState(state: WardrobeState) {
    return AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
  },
};
