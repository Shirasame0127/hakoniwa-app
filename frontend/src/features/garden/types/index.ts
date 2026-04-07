/**
 * Garden機能の型定義
 */

export interface GardenObject {
  id: string;
  type: "tree" | "desk" | "gadget" | "food" | "animal";
  position: [number, number, number];
  modelPath: string;
}

export interface GardenState {
  userId: string;
  level: number;
  exp: number;
  objects: GardenObject[];
  environment: {
    theme: "grass" | "snow" | "desert";
    size: number;
  };
}
