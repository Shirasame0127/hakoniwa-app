/**
 * Garden フィーチャーの Zustand ストア
 */

import { create } from "zustand";
import type { GardenState as GardenStateType } from "../types";

interface GardenStoreState {
  garden: GardenStateType | null;
  loading: boolean;
  setGarden: (garden: GardenStateType) => void;
  setLoading: (loading: boolean) => void;
}

export const useGardenStore = create<GardenStoreState>((set) => ({
  garden: null,
  loading: false,
  setGarden: (garden) => set({ garden }),
  setLoading: (loading) => set({ loading }),
}));
