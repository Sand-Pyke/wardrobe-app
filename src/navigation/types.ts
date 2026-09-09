import { ClothingCategory } from "../constants";

export type Tab = "home" | "style" | "collection";

export type DetailRoute =
  | { type: "clothing"; category: ClothingCategory }
  | { type: "outfit"; category: string }
  | null;

// 登录接入后可扩展为 AuthStack 与 AppStack 的联合路由类型。
export type RootRoute = "auth" | "wardrobe";

