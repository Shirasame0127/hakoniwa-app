"use client";

import { Navigation } from "@/widgets/Navigation";
import { StatusBar } from "@/widgets/StatusBar";

const logs = [
  { type: "ランニング", icon: "🏃", duration: 30, date: "2026-04-06", exp: 15 },
  { type: "サイクリング", icon: "🚴", duration: 45, date: "2026-04-05", exp: 22 },
  { type: "ウォーキング", icon: "🚶", duration: 20, date: "2026-04-04", exp: 10 },
];

const weekStats = [
  { day: "月", min: 30, active: true },
  { day: "火", min: 0, active: false },
  { day: "水", min: 45, active: true },
  { day: "木", min: 20, active: true },
  { day: "金", min: 0, active: false },
  { day: "土", min: 0, active: false },
  { day: "日", min: 0, active: false },
];

const maxMin = Math.max(...weekStats.map((d) => d.min), 1);

export default function ExercisePage() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] bg-grid">
      <Navigation />
      <StatusBar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #f97316, transparent)" }} />
      </div>

      <main className="relative max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">🏃 運動記録</h1>
            <p className="text-slate-400">毎日の運動をログしてレベルアップ</p>
          </div>
          <span className="badge-gold">3日連続 🔥</span>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {/* 統計カード */}
          {[
            { value: "95分", label: "今週の合計", icon: "⏱", color: "text-blue-400" },
            { value: "3日", label: "連続記録", icon: "🔥", color: "text-orange-400" },
            { value: "+47", label: "獲得 EXP", icon: "✨", color: "text-yellow-400" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-6 flex items-center gap-4">
              <div className="text-4xl">{s.icon}</div>
              <div>
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-sm text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* 週間グラフ */}
          <div className="glass-card p-6">
            <h2 className="section-title text-base mb-6">📊 今週のアクティビティ</h2>
            <div className="flex items-end gap-2 h-24">
              {weekStats.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t-md relative"
                    style={{
                      height: `${(d.min / maxMin) * 80}px`,
                      minHeight: d.min > 0 ? "8px" : "0",
                      background: d.active
                        ? "linear-gradient(180deg, #4ade80, #16a34a)"
                        : "rgba(255,255,255,0.05)",
                    }}
                  />
                  <span className="text-xs text-slate-500">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 新規記録 */}
          <div className="glass-card p-6">
            <h2 className="section-title text-base mb-4">➕ 新規記録</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-medium">種目</label>
                <select className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <option>🏃 ランニング</option>
                  <option>🚴 サイクリング</option>
                  <option>🚶 ウォーキング</option>
                  <option>🏊 スイミング</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-medium">時間 (分)</label>
                <input type="number" placeholder="30"
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>
              <button className="w-full btn-primary py-2.5 text-sm">
                ✅ 記録する
              </button>
            </div>
          </div>
        </div>

        {/* 実施履歴 */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <h2 className="section-title text-base">📝 実施履歴</h2>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {logs.map((log, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition">
                <div className="text-3xl">{log.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{log.type}</p>
                  <p className="text-xs text-slate-500">{log.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-orange-400">{log.duration}分</p>
                  <p className="text-xs text-green-400">+{log.exp} Exp</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
