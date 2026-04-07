import { ModelGallery } from "@/features/voxel_models/components/ModelGallery";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function ModelsPage() {
  return (
    <div className="flex flex-col h-screen bg-[#FAFAF8]">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-black/6 safe-top">
        <h1 className="text-[17px] font-600 text-[#14532D]">図鑑</h1>
        <Link
          href="/models/upload"
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#22C55E] text-white text-[13px] font-medium"
        >
          <Plus className="w-4 h-4" />
          追加
        </Link>
      </header>

      <div className="flex-1 overflow-hidden">
        <ModelGallery />
      </div>
    </div>
  );
}
