"use client";

import { Navigation } from "@/widgets/Navigation";
import { StatusBar } from "@/widgets/StatusBar";

const foods = [
  { name: "りんご", quantity: 3, expiry: "2026-04-13", icon: "🍎", status: "ok" },
  { name: "バナナ", quantity: 1, expiry: "2026-04-10", icon: "🍌", status: "warn" },
  { name: "トマト", quantity: 5, expiry: "2026-04-12", icon: "🍅", status: "ok" },
  { name: "ニンジン", quantity: 2, expiry: "2026-04-20", icon: "🥕", status: "ok" },
];

const actions = [
  { icon: "📱", label: "バーコード", sub: "スキャン", gradient: "from-rose-500/20 to-pink-500/10", border: "border-rose-500/20" },
  { icon: "🧾", label: "レシート", sub: "OCR", gradient: "from-amber-500/20 to-orange-500/10", border: "border-amber-500/20" },
  { icon: "✏️", label: "手動", sub: "入力", gradient: "from-blue-500/20 to-indigo-500/10", border: "border-blue-500/20" },
];

export default function FoodPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] bg-grid">
      <Navigation />
      <StatusBar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 w-96 h-96 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #ef4444, transparent)" }} />
      </div>

      <main className="relative max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">🍎 食材管理</h1>
            <p className="text-slate-400">バーコードや OCR で簡単に食材を登録・管理</p>
          </div>
          <span className="badge-green">4 品目</span>
        </div>

        {/* 登録方法 */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {actions.map((a) => (
            <button key={a.label}
              className={`glass-card-hover p-6 text-center bg-gradient-to-br ${a.gradient} border ${a.border}`}
            >
              <div className="text-4xl mb-3">{a.icon}</div>
              <p className="font-semibold text-white">{a.label}</p>
              <p className="text-sm text-slate-400">{a.sub}</p>
            </button>
          ))}
        </div>

        {/* 食材一覧 */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <h2 className="section-title text-base">在庫一覧</h2>
            <span className="text-xs text-slate-500">消費期限順</span>
          </div>

          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {foods.map((f, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="text-3xl">{f.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{f.name}</p>
                  <p className="text-sm text-slate-400">{f.quantity} 個</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    f.status === "warn" ? "text-amber-400" : "text-slate-300"
                  }`}>
                    {f.expiry}
                  </p>
                  {f.status === "warn" && (
                    <span className="badge-gold text-xs">まもなく期限</span>
                  )}
                </div>
                <button className="text-slate-600 hover:text-red-400 transition-colors ml-2 p-1">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
