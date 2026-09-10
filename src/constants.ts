export const CLOTHING_CATEGORIES = [
  { label: "帽子", value: "hat" },
  { label: "围巾", value: "scarf" },
  { label: "上衣", value: "top", tip: "包含卫衣、羽绒服、外套等" },
  { label: "T恤", value: "tshirt" },
  { label: "裙子", value: "skirt" },
  { label: "裤子", value: "pants", tip: "包含裙子" },
  { label: "连衣裙", value: "dress" },
  { label: "袜子", value: "socks" },
  { label: "鞋子", value: "shoes" },
] as const;

export const DEFAULT_OUTFIT_CATEGORIES = ["春夏", "秋冬", "日常"] as const;
export type ClothingCategory = (typeof CLOTHING_CATEGORIES)[number]["value"];
export type OutfitPart = "head" | "neck" | "torso" | "legs" | "feet";

export const PART_LABELS: Record<OutfitPart, string> = {
  head: "头部",
  neck: "脖子",
  torso: "躯干",
  legs: "腿部",
  feet: "脚部",
};

export const PART_ALLOWED: Record<OutfitPart, readonly ClothingCategory[]> = {
  head: ["hat"],
  neck: ["scarf"],
  torso: ["top", "tshirt", "dress"],
  legs: ["pants", "skirt"],
  feet: ["socks", "shoes"],
};
