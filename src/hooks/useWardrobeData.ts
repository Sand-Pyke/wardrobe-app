import { useEffect, useState } from "react";
import {
  ClothingCategory,
  DEFAULT_OUTFIT_CATEGORIES,
  OutfitPart,
} from "../constants";
import { repository } from "../data/storage";
import { ClothingItem, Outfit } from "../types";

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function useWardrobeData() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const [loadedItems, loadedOutfits, loadedCategories] = await Promise.all([
      repository.getItems(),
      repository.getOutfits(),
      repository.getOutfitCategories(),
    ]);
    setItems(loadedItems);
    setOutfits(loadedOutfits);
    setCustomCategories(loadedCategories);
  }

  async function persistItems(next: ClothingItem[]) {
    setItems(next);
    await repository.saveItems(next);
  }

  async function persistOutfits(next: Outfit[]) {
    setOutfits(next);
    await repository.saveOutfits(next);
  }

  async function addItems(
    category: ClothingCategory,
    imageUris: string[],
  ) {
    const existingUris = new Set(
      items.flatMap((item) =>
        item.imageUris.map((uri) => uri.split("?")[0].toLowerCase()),
      ),
    );
    const uniqueUris = imageUris.filter((uri) => {
      const key = uri.split("?")[0].toLowerCase();
      if (existingUris.has(key)) return false;
      existingUris.add(key);
      return true;
    });
    if (!uniqueUris.length) return;
    const existing = items.filter((item) => item.category === category).length;
    const additions = uniqueUris.map(
      (uri, index): ClothingItem => ({
        id: createId(),
        category,
        imageUris: [uri],
        createdAt: new Date().toISOString(),
        sortOrder: existing + index,
      }),
    );
    await persistItems([...items, ...additions]);
  }

  async function deleteItems(ids: string[]) {
    await persistItems(items.filter((item) => !ids.includes(item.id)));
  }

  async function deleteOutfits(ids: string[]) {
    await persistOutfits(outfits.filter((outfit) => !ids.includes(outfit.id)));
  }

  async function replaceItemImage(itemId: string, imageUri: string) {
    const nextItems = items.map((item) =>
      item.id === itemId
        ? { ...item, imageUris: [imageUri, ...item.imageUris.slice(1)] }
        : item,
    );
    const replacement = nextItems.find((item) => item.id === itemId);
    if (!replacement) return;

    const nextOutfits = outfits.map((outfit) => {
      const parts = { ...outfit.parts };
      (Object.keys(parts) as OutfitPart[]).forEach((part) => {
        if (parts[part]?.id === itemId) parts[part] = replacement;
      });
      return { ...outfit, parts };
    });

    setItems(nextItems);
    setOutfits(nextOutfits);
    await Promise.all([
      repository.saveItems(nextItems),
      repository.saveOutfits(nextOutfits),
    ]);
  }

  async function saveOutfit(outfit: Outfit, isNewCategory: boolean) {
    const next = outfits.some((entry) => entry.id === outfit.id)
      ? outfits.map((entry) => (entry.id === outfit.id ? outfit : entry))
      : [outfit, ...outfits];
    await persistOutfits(next);

    if (
      isNewCategory &&
      !DEFAULT_OUTFIT_CATEGORIES.includes(outfit.category as never) &&
      !customCategories.includes(outfit.category)
    ) {
      const categories = [...customCategories, outfit.category];
      setCustomCategories(categories);
      await repository.saveOutfitCategories(categories);
    }
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
