"use client";

import { useState } from "react";
import { Heart, Star, MapPin, Calendar, Box } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { HakoniwaObjectSummary, ObjectCategory, ObjectSubcategory } from "@/features/voxel_models/types";
import {
  CATEGORY_LABELS,
  SUBCATEGORY_LABELS,
  RARITY_LABELS,
  RARITY_COLORS,
  SEASON_LABELS,
  LOCATION_LABELS,
} from "@/features/voxel_models/types";
import { useObjects, useObject, useLikeObject } from "@/features/voxel_models/hooks/useVoxelModels";
import { GlbViewer } from "@/features/voxel_models/components/GlbViewer";
import { useGlbSnapshot } from "@/features/voxel_models/hooks/useGlbSnapshot";

const CATEGORIES: Array<{ value: ObjectCategory | "all"; label: string }> = [
  { value: "all",       label: "すべて" },
  { value: "food",      label: "食べ物" },
  { value: "plant",     label: "植物" },
  { value: "person",    label: "人" },
  { value: "furniture", label: "家具" },
  { value: "building",  label: "建造物" },
  { value: "field",     label: "フィールド" },
  { value: "special",   label: "特別" },
];

function RarityBadge({ rarity }: { rarity: string }) {
  const colors = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] ?? RARITY_COLORS.common;
  return (
    <span
      className="inline-block text-[10px] font-600 px-1.5 py-0.5 rounded-full border"
      style={{ color: colors.text, background: colors.bg, borderColor: colors.border }}
    >
      {RARITY_LABELS[rarity as keyof typeof RARITY_LABELS] ?? rarity}
    </span>
  );
}

function ObjectCard({ object, onClick }: { object: HakoniwaObjectSummary; onClick: () => void }) {
  const like = useLikeObject(object.id);
  // thumbnail_url があれば優先、なければオフスクリーン GLB スナップショットを使用
  const snapshot = useGlbSnapshot(object.thumbnail_url ? null : object.model_path);
  const thumbnailSrc = object.thumbnail_url || snapshot;

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    const token = localStorage.getItem("token") ?? "";
    like.mutate(token);
  }

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="w-full text-left rounded-2xl overflow-hidden bg-white border border-black/8 shadow-sm active:shadow-none transition-shadow cursor-pointer"
    >
      {/* サムネイル - オフスクリーンレンダリングの静止画を表示（WebGL コンテキスト消費なし） */}
      <div className="aspect-square bg-gradient-to-br from-[#F5F5F2] to-[#E5E5E2] flex items-center justify-center relative overflow-hidden">
        {thumbnailSrc ? (
          <img src={thumbnailSrc} alt={object.name} className="w-full h-full object-contain" draggable={false} />
        ) : (
          <div className="w-6 h-6 border-2 border-[#D1D1CC] border-t-transparent rounded-full animate-spin" />
        )}

        {/* カタログID */}
        <span className="absolute top-2 left-2 text-[10px] font-700 text-[#9A9A8E] bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
          {object.catalog_id}
        </span>
      </div>

      {/* 情報 */}
      <div className="px-3 pt-2 pb-3 space-y-1.5">
        <p className="text-[13px] font-500 text-[#1A1A17] truncate">{object.name}</p>
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            {/* スマホ: カテゴリ非表示、レアリティは色つきの丸のみ */}
            {(() => {
              const rc = RARITY_COLORS[object.rarity as keyof typeof RARITY_COLORS] ?? RARITY_COLORS.common;
              return (
                <span
                  className="sm:hidden w-2.5 h-2.5 rounded-full shrink-0 border"
                  style={{ background: rc.bg, borderColor: rc.border }}
                  title={RARITY_LABELS[object.rarity as keyof typeof RARITY_LABELS] ?? object.rarity}
                />
              );
            })()}
            {/* タブレット+: カテゴリバッジ + レアリティテキストバッジ */}
            <span className="hidden sm:inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#166534] border border-green-200 shrink-0">
              {CATEGORY_LABELS[object.category]}
            </span>
            <span className="hidden sm:inline-block">
              <RarityBadge rarity={object.rarity} />
            </span>
          </div>
          <motion.button
            onClick={handleLike}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-1 text-[12px] text-[#9A9A8E] shrink-0 touch-manipulation active:opacity-70"
          >
            <Heart
              className="w-3.5 h-3.5"
              fill={object.is_liked ? "#DC2626" : "none"}
              stroke={object.is_liked ? "#DC2626" : "currentColor"}
            />
            {object.like_count}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export function ModelGallery() {
  const [category, setCategory] = useState<ObjectCategory | "all">("all");
  const [sort, setSort] = useState("recent");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useObjects({ category, sort });

  return (
    <div className="flex flex-col h-full bg-[#FAFAF8]">
      {/* カテゴリフィルタ */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-black/6">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value as ObjectCategory | "all")}
            className={`shrink-0 text-[13px] font-medium px-3 py-1.5 rounded-full transition-colors ${
              category === c.value
                ? "bg-[#22C55E] text-white"
                : "bg-white border border-black/8 text-[#6B6B5E]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ソート */}
      <div className="flex justify-end px-4 py-2">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-[13px] text-[#6B6B5E] border border-black/8 rounded-lg px-2 py-1 bg-white"
        >
          <option value="recent">新着</option>
          <option value="popular">人気</option>
        </select>
      </div>

      {/* グリッド */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-black/8 aspect-[1/1.3] animate-pulse" />
            ))}
          </div>
        ) : !data?.objects.length ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#9A9A8E] text-[14px]">
            <div className="w-12 h-12 mb-3 rounded-full bg-[#F0F0EC] flex items-center justify-center">
              <Box className="w-6 h-6 text-[#C8C8C0]" />
            </div>
            まだオブジェクトがありません
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {data.objects.map((obj) => (
              <ObjectCard key={obj.id} object={obj} onClick={() => setSelectedId(obj.id)} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedId && (
          <ObjectDetailSheet objectId={selectedId} onClose={() => setSelectedId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ObjectDetailSheet({ objectId, onClose }: { objectId: string; onClose: () => void }) {
  const { data } = useObject(objectId);
  const like = useLikeObject(objectId);

  function handleLike() {
    const token = localStorage.getItem("token") ?? "";
    like.mutate(token);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 z-40"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[88vh] overflow-y-auto"
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#D1D1CC]" />
        </div>

        <div className="px-5 pb-10">
          {data ? (
            <>
              {/* 3Dビューア */}
              <GlbViewer modelPath={data.model_path} height={260} backgroundColor="#F5F5F2" enableInteraction={true} />

              <div className="mt-5 space-y-4">
                {/* ヘッダー */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] text-[#9A9A8E] font-500">{data.catalog_id}</span>
                      <RarityBadge rarity={data.rarity} />
                      {data.subcategory && (
                        <span className="text-[11px] text-[#6B6B5E] border border-black/8 rounded-full px-2 py-0.5">
                          {SUBCATEGORY_LABELS[data.subcategory] ?? data.subcategory}
                        </span>
                      )}
                    </div>
                    <h2 className="text-[20px] font-700 text-[#1A1A17]">{data.name}</h2>
                    {data.name_en && (
                      <p className="text-[13px] text-[#9A9A8E]">{data.name_en}</p>
                    )}
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#166534] border border-green-200 shrink-0">
                    {CATEGORY_LABELS[data.category]}
                  </span>
                </div>

                {/* フレーバーテキスト */}
                {data.flavor_text && (
                  <div className="bg-[#FAFAF8] border border-black/6 rounded-2xl px-4 py-3">
                    <p className="text-[13px] text-[#6B6B5E] italic leading-relaxed">
                      {data.flavor_text}
                    </p>
                  </div>
                )}

                {/* 説明 */}
                {data.description && (
                  <p className="text-[14px] text-[#6B6B5E] leading-relaxed">{data.description}</p>
                )}

                {/* 詳細情報 */}
                <div className="space-y-2">
                  {data.locations && data.locations.length > 0 && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#9A9A8E] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] text-[#9A9A8E] mb-1">出現場所</p>
                        <div className="flex flex-wrap gap-1">
                          {data.locations.map((loc) => (
                            <span key={loc} className="text-[12px] text-[#6B6B5E] bg-[#F5F5F2] px-2 py-0.5 rounded-full">
                              {LOCATION_LABELS[loc] ?? loc}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {data.seasons && data.seasons.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-[#9A9A8E] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] text-[#9A9A8E] mb-1">登場季節</p>
                        <div className="flex gap-1">
                          {data.seasons.map((s) => (
                            <span key={s} className="text-[12px] text-[#6B6B5E] bg-[#F5F5F2] px-2 py-0.5 rounded-full">
                              {SEASON_LABELS[s] ?? s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {data.obtain_method && (
                    <div className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-[#9A9A8E] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] text-[#9A9A8E] mb-0.5">入手方法</p>
                        <p className="text-[13px] text-[#6B6B5E]">{data.obtain_method}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* サイズ */}
                {(data.size_w || data.size_h || data.size_d) && (
                  <p className="text-[12px] text-[#9A9A8E]">
                    サイズ: {data.size_w ?? "?"} × {data.size_h ?? "?"} × {data.size_d ?? "?"} px
                  </p>
                )}

                {/* いいね */}
                <button
                  onClick={handleLike}
                  className="flex items-center gap-2 text-[14px] text-[#6B6B5E] py-1 touch-manipulation"
                >
                  <Heart
                    className="w-4 h-4"
                    fill={data.is_liked ? "#DC2626" : "none"}
                    stroke={data.is_liked ? "#DC2626" : "currentColor"}
                  />
                  {data.like_count} いいね
                </button>
              </div>
            </>
          ) : (
            <div className="h-60 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
