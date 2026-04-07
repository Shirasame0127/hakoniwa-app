"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchObjects,
  fetchObject,
  toggleObjectLike,
} from "@/shared/api/voxel-models";
import type { ObjectCategory, ObjectSubcategory, ObjectRarity } from "@/features/voxel_models/types";

export function useObjects(params: {
  category?: ObjectCategory | "all";
  subcategory?: ObjectSubcategory;
  rarity?: ObjectRarity;
  sort?: string;
}) {
  const token = typeof window !== "undefined" ? (localStorage.getItem("token") ?? undefined) : undefined;
  const query = {
    ...params,
    category: params.category === "all" ? undefined : params.category,
  };
  return useQuery({
    queryKey: ["objects", params],
    queryFn: () => fetchObjects({ ...query, limit: 20, token }),
  });
}

export function useObject(objectId: string | null) {
  const token = typeof window !== "undefined" ? (localStorage.getItem("token") ?? undefined) : undefined;
  return useQuery({
    queryKey: ["object", objectId],
    queryFn: () => fetchObject(objectId!, token),
    enabled: !!objectId,
  });
}

export function useLikeObject(objectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => toggleObjectLike(objectId, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["objects"] });
      qc.invalidateQueries({ queryKey: ["object", objectId] });
    },
  });
}

// 後方互換エイリアス（既存のコンポーネントが voxel-models フックを使っている箇所用）
export { useObjects as useVoxelModels };
export { useObject as useVoxelModel };
export { useLikeObject as useLike };
