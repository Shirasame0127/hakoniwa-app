/**
 * 箱庭オブジェクト型定義
 *
 * カタログID 形式:
 *   F001~  food      食べ物
 *   P001~  plant     植物
 *   C001~  person    人
 *   I001~  furniture 家具
 *   B001~  building  建造物
 *   L001~  field     フィールド
 *   SP001~ special   特別 (ゲームソフト/本/食材仕分け)
 */

export type ObjectCategory =
  | "food"
  | "plant"
  | "person"
  | "furniture"
  | "building"
  | "field"
  | "special";

export type ObjectSubcategory =
  | "game_software"
  | "book"
  | "food_label";

export type ObjectRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "legendary";

/** 図鑑一覧用（軽量） */
export interface HakoniwaObjectSummary {
  id: string;
  catalog_id: string;        // F001, P001, ...
  name: string;
  name_en?: string;
  category: ObjectCategory;
  subcategory?: ObjectSubcategory;
  rarity: ObjectRarity;
  model_path?: string;       // /models/food/carrot.glb
  thumbnail_url?: string;
  like_count: number;
  view_count: number;
  is_liked: boolean;
  created_at: string;
}

/** 図鑑詳細（フルデータ） */
export interface HakoniwaObjectDetail extends HakoniwaObjectSummary {
  description?: string;
  flavor_text?: string;      // 図鑑フレーバーテキスト
  locations?: string[];      // 出現場所
  seasons?: string[];        // 登場季節
  obtain_method?: string;    // 入手方法
  size_w?: number;
  size_h?: number;
  size_d?: number;
}

export interface HakoniwaObjectListResponse {
  objects: HakoniwaObjectSummary[];
  total: number;
  page: number;
  limit: number;
}

// ---------------------------------------------------------------
// 表示用ラベル・定数
// ---------------------------------------------------------------

export const CATEGORY_LABELS: Record<ObjectCategory, string> = {
  food:      "食べ物",
  plant:     "植物",
  person:    "人",
  furniture: "家具",
  building:  "建造物",
  field:     "フィールド",
  special:   "特別",
};

export const SUBCATEGORY_LABELS: Record<ObjectSubcategory, string> = {
  game_software: "ゲームソフト",
  book:          "本",
  food_label:    "食材仕分け",
};

export const RARITY_LABELS: Record<ObjectRarity, string> = {
  common:    "コモン",
  uncommon:  "アンコモン",
  rare:      "レア",
  legendary: "レジェンダリー",
};

export const RARITY_COLORS: Record<ObjectRarity, { text: string; bg: string; border: string }> = {
  common:    { text: "#6B7280", bg: "#F3F4F6", border: "#D1D5DB" },
  uncommon:  { text: "#166534", bg: "#F0FDF4", border: "#86EFAC" },
  rare:      { text: "#1D4ED8", bg: "#EFF6FF", border: "#93C5FD" },
  legendary: { text: "#92400E", bg: "#FFFBEB", border: "#FCD34D" },
};

export const SEASON_LABELS: Record<string, string> = {
  spring: "春", summer: "夏", autumn: "秋", winter: "冬",
};

export const LOCATION_LABELS: Record<string, string> = {
  kitchen: "キッチン", garden: "庭", market: "市場", room: "部屋",
  forest: "森", farm: "農場", field: "フィールド", park: "公園",
  orchard: "果樹園", desert: "砂漠", library: "図書館", office: "オフィス",
  school: "学校", town: "町", path: "小道", storage: "倉庫",
  camping: "キャンプ場", flower_shop: "花屋",
};

export const CATALOG_PREFIXES: Record<ObjectCategory, string> = {
  food: "F", plant: "P", person: "C", furniture: "I",
  building: "B", field: "L", special: "SP",
};
