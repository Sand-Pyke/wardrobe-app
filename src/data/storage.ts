import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClothingItem, Outfit } from '../types';

const KEYS = { items: '@axue/items', outfits: '@axue/outfits', outfitCategories: '@axue/outfitCategories' };

async function get<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) as T : fallback;
}
async function set<T>(key: string, value: T) { await AsyncStorage.setItem(key, JSON.stringify(value)); }

export const repository = {
  getItems: () => get<ClothingItem[]>(KEYS.items, []),
  saveItems: (items: ClothingItem[]) => set(KEYS.items, items),
  getOutfits: () => get<Outfit[]>(KEYS.outfits, []),
  saveOutfits: (outfits: Outfit[]) => set(KEYS.outfits, outfits),
  getOutfitCategories: () => get<string[]>(KEYS.outfitCategories, []),
  saveOutfitCategories: (categories: string[]) => set(KEYS.outfitCategories, categories),
};
