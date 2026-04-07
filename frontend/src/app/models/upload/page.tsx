import { ModelUploader } from "@/features/voxel_models/components/ModelUploader";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ModelUploadPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF8]">
      {/* ヘッダー */}
      <header className="flex items-center gap-2 px-4 py-3 bg-white border-b border-black/6 safe-top">
        <Link href="/models" className="p-1 -ml-1 rounded-lg active:bg-black/5">
          <ChevronLeft className="w-5 h-5 text-[#1A1A17]" />
        </Link>
        <h1 className="text-[17px] font-600 text-[#1A1A17]">モデルを追加</h1>
      </header>

      <ModelUploader />
    </div>
  );
}
