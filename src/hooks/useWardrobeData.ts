import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  ClothingCategory,
  DEFAULT_OUTFIT_CATEGORIES,
  OutfitPart,
} from "../constants";
import {
  cleanupUntrackedImageFiles,
  deleteImageAssetFile,
  deleteImageAssetFiles,
  imageSourceKey,
  importImageAsset,
  resolveImageAssetUri,
} from "../data/imageAssets";
import {
  createEmptyWardrobeState,
  repository,
} from "../data/storage";
import {
  ClothingItem,
  ImageAsset,
  Outfit,
  StoredClothingItem,
  StoredOutfit,
  WardrobeState,
} from "../types";

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function hydrateItems(state: WardrobeState): ClothingItem[] {
  return Object.values(state.itemsById)
    .map((item) => ({
      ...item,
      imageUris: item.imageAssetIds
        .map((assetId) => state.assetsById[assetId])
        .filter((asset): asset is ImageAsset => Boolean(asset))
        .map(resolveImageAssetUri),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function hydrateOutfits(
  state: WardrobeState,
  items: ClothingItem[],
): Outfit[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  return Object.values(state.outfitsById)
    .map((outfit) => {
      const parts: Partial<Record<OutfitPart, ClothingItem>> = {};
      (Object.entries(outfit.parts) as Array<
        [OutfitPart, string | undefined]
      >).forEach(([part, itemId]) => {
        const item = itemId ? itemById.get(itemId) : undefined;
        if (item) parts[part] = item;
      });
      return { ...outfit, parts };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function storeItem(item: ClothingItem): StoredClothingItem {
  const { imageUris: _imageUris, ...stored } = item;
  return stored;
}

function storeOutfit(outfit: Outfit): StoredOutfit {
  const parts: Partial<Record<OutfitPart, string>> = {};
  (Object.entries(outfit.parts) as Array<
    [OutfitPart, ClothingItem | undefined]
  >).forEach(([part, item]) => {
    if (item) parts[part] = item.id;
  });
  return { ...outfit, parts };
}

function sameImage(left: ImageAsset, right: ImageAsset) {
  return Boolean(
    left.checksum &&
      right.checksum &&
      left.checksum === right.checksum &&
      left.byteSize === right.byteSize,
  );
}

export function useWardrobeData() {
  const [state, setState] = useState<WardrobeState>(createEmptyWardrobeState);
  const items = useMemo(() => hydrateItems(state), [state]);
  const outfits = useMemo(() => hydrateOutfits(state, items), [items, state]);
  const customCategories = state.outfitCategories;

  useEffect(() => {
    void (async () => {
      try {
        const loadedState = await repository.getState();
        cleanupUntrackedImageFiles(Object.values(loadedState.assetsById));
        setState(loadedState);
      } catch {
        Alert.alert(
          "衣柜数据迁移失败",
          "原有数据仍然保留，请重新启动应用后再试。",
        );
      }
    })();
  }, []);

  async function commit(next: WardrobeState) {
    await repository.saveState(next);
    setState(next);
  }

  async function persistItems(nextItems: ClothingItem[]) {
    const itemsById = Object.fromEntries(
      nextItems.map((item) => [item.id, storeItem(item)]),
    );
    await commit({ ...state, itemsById });
  }

  async function persistOutfits(nextOutfits: Outfit[]) {
    const outfitsById = Object.fromEntries(
      nextOutfits.map((outfit) => [outfit.id, storeOutfit(outfit)]),
    );
    await commit({ ...state, outfitsById });
  }

  async function addItems(category: ClothingCategory, imageUris: string[]) {
    const knownSourceKeys = new Set(
      Object.values(state.assetsById).map((asset) => asset.sourceKey),
    );
    const nextAssetsById = { ...state.assetsById };
    const nextItemsById = { ...state.itemsById };
    const createdAssets: ImageAsset[] = [];
    let nextSortOrder = Object.values(state.itemsById).filter(
      (item) => item.category === category,
    ).length;

    try {
      for (const uri of imageUris) {
        const sourceKey = imageSourceKey(uri);
        if (knownSourceKeys.has(sourceKey)) continue;
        knownSourceKeys.add(sourceKey);

        const asset = await importImageAsset(uri);
        const duplicate = Object.values(nextAssetsById).find((existing) =>
          sameImage(existing, asset),
        );
        if (duplicate) {
          deleteImageAssetFile(asset);
          continue;
        }

        createdAssets.push(asset);
        nextAssetsById[asset.id] = asset;
        const id = createId();
        nextItemsById[id] = {
          id,
          category,
          imageAssetIds: [asset.id],
          createdAt: new Date().toISOString(),
          sortOrder: nextSortOrder,
        };
        nextSortOrder += 1;
      }

      if (!createdAssets.length) return;
      await commit({
        ...state,
        assetsById: nextAssetsById,
        itemsById: nextItemsById,
      });
    } catch (error) {
      deleteImageAssetFiles(createdAssets);
      throw error;
    }
  }

  async function deleteItems(ids: string[]) {
    const deletedIds = new Set(ids);
    const itemsById = Object.fromEntries(
      Object.entries(state.itemsById).filter(([id]) => !deletedIds.has(id)),
    );
    const outfitsById = Object.fromEntries(
      Object.entries(state.outfitsById).map(([outfitId, outfit]) => {
        const parts = Object.fromEntries(
          Object.entries(outfit.parts).filter(
            ([, itemId]) => !itemId || !deletedIds.has(itemId),
          ),
        ) as Partial<Record<OutfitPart, string>>;
        return [outfitId, { ...outfit, parts }];
      }),
    );
    const usedAssetIds = new Set(
      Object.values(itemsById).flatMap((item) => item.imageAssetIds),
    );
    const orphanedAssets = Object.values(state.assetsById).filter(
      (asset) => !usedAssetIds.has(asset.id),
    );
    const assetsById = Object.fromEntries(
      Object.entries(state.assetsById).filter(([id]) => usedAssetIds.has(id)),
    );

    await commit({ ...state, itemsById, outfitsById, assetsById });
    deleteImageAssetFiles(orphanedAssets);
  }

  async function deleteOutfits(ids: string[]) {
    const deletedIds = new Set(ids);
    const outfitsById = Object.fromEntries(
      Object.entries(state.outfitsById).filter(([id]) => !deletedIds.has(id)),
    );
    await commit({ ...state, outfitsById });
  }

  async function replaceItemImage(itemId: string, imageUri: string) {
    const currentItem = state.itemsById[itemId];
    if (!currentItem) return;

    const importedAsset = await importImageAsset(imageUri);
    const duplicate = Object.values(state.assetsById).find((asset) =>
      sameImage(asset, importedAsset),
    );
    const replacementAsset = duplicate ?? importedAsset;
    if (duplicate) deleteImageAssetFile(importedAsset);

    const itemsById = {
      ...state.itemsById,
      [itemId]: {
        ...currentItem,
        imageAssetIds: [
          replacementAsset.id,
          ...currentItem.imageAssetIds.slice(1),
        ],
      },
    };
    const usedAssetIds = new Set(
      Object.values(itemsById).flatMap((item) => item.imageAssetIds),
    );
    const assetsWithReplacement = duplicate
      ? state.assetsById
      : { ...state.assetsById, [importedAsset.id]: importedAsset };
    const orphanedAssets = Object.values(assetsWithReplacement).filter(
      (asset) => !usedAssetIds.has(asset.id),
    );
    const assetsById = Object.fromEntries(
      Object.entries(assetsWithReplacement).filter(([id]) =>
        usedAssetIds.has(id),
      ),
    );

    try {
      await commit({ ...state, itemsById, assetsById });
      deleteImageAssetFiles(orphanedAssets);
    } catch (error) {
      if (!duplicate) deleteImageAssetFile(importedAsset);
      throw error;
    }
  }

  async function saveOutfit(outfit: Outfit, isNewCategory: boolean) {
    const storedOutfit = storeOutfit(outfit);
    const outfitsById = {
      ...state.outfitsById,
      [storedOutfit.id]: storedOutfit,
    };
    const shouldAddCategory =
      isNewCategory &&
      !DEFAULT_OUTFIT_CATEGORIES.includes(outfit.category as never) &&
      !state.outfitCategories.includes(outfit.category);
    const outfitCategories = shouldAddCategory
      ? [...state.outfitCategories, outfit.category]
      : state.outfitCategories;
    await commit({ ...state, outfitsById, outfitCategories });
  }

  return {
    items,
    outfits,
    customCategories,
    addItems,
    deleteItems,
    deleteOutfits,
    replaceItemImage,
    persistItems,
    persistOutfits,
    saveOutfit,
  };
}
