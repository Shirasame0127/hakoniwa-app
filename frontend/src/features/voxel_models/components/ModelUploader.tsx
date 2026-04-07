"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileBox, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { uploadVoxModel } from "@/shared/api/voxel-models";
import { CATEGORY_LABELS, CATEGORY_MAX_SIZE, type VoxelCategory } from "@/features/voxel_models/types";

type Step = "select" | "meta" | "uploading" | "done" | "error";

export function ModelUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("select");
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<VoxelCategory>("food");
  const [description, setDescription] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith(".vox")) {
      setErrorMsg(".vox ファイルのみ対応しています");
      setStep("error");
      return;
    }
    setFile(f);
    setName(f.name.replace(".vox", ""));
    setStep("meta");
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  async function handleUpload() {
    if (!file) return;
    const token = localStorage.getItem("token") ?? "";
    if (!token) {
      setErrorMsg("ログインが必要です");
      setStep("error");
      return;
    }
    setStep("uploading");
    try {
      await uploadVoxModel({ file, name, category, description: description || undefined, token });
      setStep("done");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "アップロードに失敗しました");
      setStep("error");
    }
  }

  if (step === "select" || step === "error") {
    return (
      <div className="flex flex-col gap-4 px-4 py-6">
        {step === "error" && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 text-[14px]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* ドロップゾーン */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 h-52 rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${
            isDragging
              ? "border-[#22C55E] bg-[#F0FDF4]"
              : "border-black/12 bg-[#FAFAF8] active:bg-[#F5F5F2]"
          }`}
        >
          <Upload className="w-8 h-8 text-[#9A9A8E]" />
          <div className="text-center">
            <p className="text-[14px] font-medium text-[#1A1A17]">.vox をここにドロップ</p>
            <p className="text-[13px] text-[#9A9A8E] mt-0.5">またはタップして選択</p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".vox"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {/* MagicaVoxelのヒント */}
        <div className="px-4 py-3 rounded-xl bg-[#F5F5F2] text-[13px] text-[#6B6B5E] space-y-1">
          <p className="font-medium text-[#1A1A17]">💡 MagicaVoxel でのエクスポート方法:</p>
          <p>① Export → .vox を選択</p>
          <p>② 上記エリアにドロップ</p>
          <p className="mt-2 font-medium">ジャンル別最大サイズ:</p>
          {(Object.keys(CATEGORY_MAX_SIZE) as VoxelCategory[]).map((cat) => {
            const s = CATEGORY_MAX_SIZE[cat];
            return (
              <p key={cat}>
                {CATEGORY_LABELS[cat]}: {s.w}×{s.h}×{s.d} px
              </p>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === "meta") {
    return (
      <div className="flex flex-col gap-4 px-4 py-6">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F0FDF4] border border-green-200">
          <FileBox className="w-5 h-5 text-[#22C55E]" />
          <div>
            <p className="text-[13px] font-medium text-[#1A1A17]">{file?.name}</p>
            <p className="text-[12px] text-[#6B6B5E]">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : ""}
            </p>
          </div>
        </div>

        {/* 名前 */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-[#1A1A17]">名前</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="にんじん"
            className="w-full px-3 py-2.5 rounded-xl border border-black/12 text-[15px] bg-white focus:border-[#22C55E] focus:ring-2 focus:ring-green-200 outline-none"
          />
        </div>

        {/* カテゴリ */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-[#1A1A17]">カテゴリ</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(CATEGORY_LABELS) as VoxelCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`py-2 rounded-xl text-[13px] font-medium border transition-colors ${
                  category === cat
                    ? "bg-[#22C55E] text-white border-transparent"
                    : "bg-white border-black/8 text-[#6B6B5E]"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* 説明（任意） */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-[#1A1A17]">
            説明 <span className="text-[#9A9A8E] font-normal">（任意）</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="このモデルについての説明..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-black/12 text-[14px] bg-white focus:border-[#22C55E] focus:ring-2 focus:ring-green-200 outline-none resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => { setStep("select"); setFile(null); }}
            className="flex-1 py-3 rounded-xl border border-black/8 text-[15px] font-medium text-[#6B6B5E] bg-white"
          >
            戻る
          </button>
          <button
            onClick={handleUpload}
            disabled={!name.trim()}
            className="flex-1 py-3 rounded-xl bg-[#22C55E] text-white text-[15px] font-medium disabled:opacity-40"
          >
            アップロード
          </button>
        </div>
      </div>
    );
  }

  if (step === "uploading") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-3 border-[#22C55E] border-t-transparent rounded-full"
        />
        <p className="text-[14px] text-[#6B6B5E]">アップロード中...</p>
      </div>
    );
  }

  // done
  return (
    <div className="flex flex-col items-center justify-center gap-4 h-64 px-4">
      <CheckCircle className="w-12 h-12 text-[#22C55E]" />
      <p className="text-[16px] font-medium text-[#1A1A17]">登録完了！</p>
      <p className="text-[13px] text-[#6B6B5E] text-center">
        モデルが図鑑に追加されました
      </p>
      <button
        onClick={() => router.push("/models")}
        className="mt-2 px-6 py-2.5 rounded-xl bg-[#22C55E] text-white text-[14px] font-medium"
      >
        図鑑を見る
      </button>
    </div>
  );
}
