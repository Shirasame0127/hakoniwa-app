"use client";

import Link from "next/link";
import { Navigation } from "@/widgets/Navigation";
import { StatusBar } from "@/widgets/StatusBar";
import { Icons } from "@/shared/ui/icons";

const features = [
  {
    icon: "Leaf",
    title: "3D 箱庭",
    desc: "生活データをリアルタイムで 3D 空間に反映。オブジェクトが増えていく喜びを体験。",
    gradient: "from-green-500/20 to-emerald-500/10",
    border: "border-green-500/20",
    badge: "3D インタラクティブ",
    badgeClass: "badge-green",
    href: "/garden",
  },
  {
    icon: "Apple",
    title: "食材管理",
    desc: "バーコードスキャン・レシート OCR で瞬時に登録。AI が消費期限と献立をサポート。",
    gradient: "from-red-500/20 to-orange-500/10",
    border: "border-red-500/20",
    badge: "AI 解析",
    badgeClass: "badge-gold",
    href: "/food",
  },
  {
    icon: "Activity",
    title: "運動記録",
    desc: "毎日の運動をログしてレベルアップ。継続報酬で箱庭をどんどんカスタマイズ。",
    gradient: "from-blue-500/20 to-indigo-500/10",
    border: "border-blue-500/20",
    badge: "ゲーミフィケーション",
    badgeClass: "badge-purple",
    href: "/exercise",
  },
];

const stats = [
  { value: "3+", label: "コア機能" },
  { value: "AI", label: "Powered" },
  { value: "3D", label: "ビジュアル" },
  { value: "∞", label: "カスタマイズ" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] bg-grid">
      <Navigation />
      <StatusBar />

      {/* 背景グロー */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #4ade80, transparent)" }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
      </div>

      <main className="relative max-w-7xl mx-auto px-6 py-20">
        {/* ヒーロー */}
        <section className="text-center mb-28">
          <div className="inline-block mb-6">
            <span className="badge-green px-4 py-1.5 text-sm flex items-center gap-1.5">
              <Icons.Zap size={14} />
              プロトタイプ v0.1
            </span>
          </div>

          <h1 className="text-7xl font-black mb-6 leading-tight tracking-tight">
            <span style={{
              background: "linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, #4ade80 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              AI 箱庭
            </span>
            <br />
            <span style={{
              background: "linear-gradient(135deg, #4ade80, #7c3aed)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              ライフ OS
            </span>
          </h1>

          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            食材・運動・所有物をAIが一元管理。<br />
            あなたの日常がリアルタイムで3D空間に広がる、新しいライフスタイルOS。
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/garden" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2">
              <Icons.Leaf size={18} />
              箱庭を開く
            </Link>
            <Link href="/food"
              className="px-8 py-3.5 rounded-xl font-semibold text-slate-300 border transition-all duration-200 hover:border-green-500/50 hover:text-green-400 flex items-center gap-2"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              <Icons.Sparkles size={18} />
              機能を見る
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          {stats.map((s) => (
            <div key={s.label} className="glass-card p-6 text-center">
              <div className="text-4xl font-black mb-1"
                style={{
                  background: "linear-gradient(135deg, #4ade80, #a78bfa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {s.value}
              </div>
              <div className="text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </section>

        {/* 機能カード */}
        <section className="grid md:grid-cols-3 gap-6 mb-20">
          {features.map((f) => {
            const IconComponent = Icons[f.icon as keyof typeof Icons];
            return (
              <Link key={f.href} href={f.href} className="glass-card-hover p-8 block group">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 bg-gradient-to-br ${f.gradient} border ${f.border}`}>
                  <IconComponent size={28} className="text-green-400" />
                </div>

                <div className="mb-3">
                  <span className={f.badgeClass}>{f.badge}</span>
                </div>

                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors">
                  {f.title}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>

                <div className="mt-6 flex items-center gap-2 text-sm text-slate-500 group-hover:text-green-400 transition-colors">
                  <span>詳細を見る</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            );
          })}
        </section>

        {/* CTA */}
        <section className="glass-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{ background: "linear-gradient(135deg, #4ade80, #7c3aed)" }} />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-4">
              今すぐ始めましょう
            </h2>
            <p className="text-slate-400 mb-8">
              セットアップ不要。すぐに使い始められます。
            </p>
            <Link href="/auth/login" className="btn-primary inline-flex items-center gap-2 text-base px-10 py-4">
              <Icons.Leaf size={18} />
              スタート
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t text-center py-8 mt-20"
        style={{ borderColor: "rgba(255,255,255,0.05)", color: "#475569" }}
      >
        <p className="text-sm">AI箱庭ライフOS v0.1 — Powered by Anthropic Claude</p>
      </footer>
    </div>
  );
}
