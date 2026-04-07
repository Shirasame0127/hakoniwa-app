"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Navigation } from "@/widgets/Navigation";
import { StatusBar } from "@/widgets/StatusBar";
import { Icons } from "@/shared/ui/icons";
import { useWeatherEnvironment } from "@/features/garden/hooks/useWeatherEnvironment";

// Three.js は SSR 非対応なので dynamic import
const GardenCanvas = dynamic(
  () => import("@/features/garden/components/GardenCanvas").then((m) => ({ default: m.GardenCanvas })),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0d1525]">
      <div className="text-center">
        <div className="mb-4">
          <Icons.Leaf size={48} className="animate-float text-green-400 mx-auto" />
        </div>
        <p className="text-slate-400 text-sm">箱庭を読み込み中...</p>
      </div>
    </div>
  )}
);

const TIME_ICONS: Record<string, keyof typeof Icons> = {
  dawn: "Sunrise",
  morning: "Sun",
  afternoon: "Sun",
  evening: "Sunset",
  night: "Moon",
};

const WEATHER_ICONS: Record<string, keyof typeof Icons> = {
  clear: "Sun",
  cloudy: "Cloud",
  rain: "CloudRain",
  snow: "CloudSnow",
  foggy: "CloudFog",
  thunder: "CloudLightning",
};

const SEASON_ICONS: Record<string, keyof typeof Icons> = {
  spring: "Flower2",
  summer: "Sun",
  autumn: "Leaf",
  winter: "Snowflake",
};

function WeatherBadge() {
  const { env } = useWeatherEnvironment();
  const TimeIcon = Icons[TIME_ICONS[env.time_of_day] ?? "Sun"];
  const WeatherIcon = Icons[WEATHER_ICONS[env.weather] ?? "Sun"];
  const SeasonIcon = Icons[SEASON_ICONS[env.season] ?? "Leaf"];

  return (
    <div className="glass-card px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2 flex-wrap">
      <TimeIcon size={16} className="text-amber-400" />
      <WeatherIcon size={16} className="text-blue-400" />
      <SeasonIcon size={16} className="text-green-400" />
      {env.temperature != null && <span>{env.temperature.toFixed(0)}°C</span>}
      <span className="text-slate-500 whitespace-nowrap">{env.city_name}</span>
    </div>
  );
}

const milestones = [
  { done: true, label: "食材を5個登録" },
  { done: false, label: "7日間連続運動" },
  { done: false, label: "Lv.2 に到達" },
  { done: false, label: "箱庭を初カスタマイズ" },
];

const recentActivity = [
  { icon: "Apple", label: "りんご 登録", time: "1時間前" },
  { icon: "Activity", label: "ランニング 30分", time: "昨日" },
  { icon: "Sparkles", label: "Exp +50 獲得", time: "昨日" },
];

export default function GardenPage() {
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [debugTimeOfDay, setDebugTimeOfDay] = useState<"dawn" | "morning" | "afternoon" | "evening" | "night" | undefined>(undefined);

  return (
    <div className="h-screen bg-[#0a0f1a] flex flex-col overflow-hidden">
      <Navigation />
      <StatusBar />

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* 3D Canvas - Desktop: flex-1, Mobile: 60vh */}
        <div className="flex-1 md:flex-1 relative md:h-auto h-[60vh]">
          <GardenCanvas overrideTimeOfDay={debugTimeOfDay} />

          {/* オーバーレイ左下 */}
          <div className="absolute bottom-6 left-6 flex flex-col gap-2">
            <WeatherBadge />
            <div className="glass-card px-4 py-2 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              ドラッグで視点変更 / スクロールでズーム
            </div>

            {/* デバッグ用: 時間帯セレクター */}
            <div className="glass-card px-4 py-2">
              <label className="text-xs text-slate-400 block mb-1">🔧 デバッグ：時間帯</label>
              <select
                value={debugTimeOfDay ?? ""}
                onChange={(e) => setDebugTimeOfDay(e.target.value as any || undefined)}
                className="w-full px-2 py-1 text-xs bg-slate-800/50 border border-slate-600/50 rounded text-slate-200 hover:border-slate-500 transition-colors"
              >
                <option value="">実際の時刻</option>
                <option value="dawn">夜明け (dawn)</option>
                <option value="morning">朝 (morning)</option>
                <option value="afternoon">昼 (afternoon)</option>
                <option value="evening">夕方 (evening)</option>
                <option value="night">夜 (night)</option>
              </select>
            </div>
          </div>

          {/* Mobile Bottom Panel Toggle Button */}
          <button
            onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
            className="md:hidden absolute bottom-6 right-6 p-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-xl transition-all z-10"
          >
            <Icons.Menu size={20} className="text-green-400" />
          </button>
        </div>

        {/* Right Panel - Desktop: fixed w-80, Mobile: hidden md:block */}
        <div className="hidden md:flex md:w-80 border-l flex-col overflow-y-auto"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <RightPanel />
        </div>

        {/* Bottom Panel - Mobile: h-[40vh] hidden md:hidden */}
        {isBottomPanelOpen && (
          <div className="md:hidden border-t flex-1 overflow-y-auto flex flex-col"
            style={{
              background: "rgba(255,255,255,0.02)",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <div className="p-4 flex-1 space-y-4 overflow-y-auto">
              <RightPanel />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RightPanel() {
  return (
    <div className="p-6 space-y-6">
      {/* Lv バッジ */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">庭園ステータス</h2>
          <span className="badge-gold">Lv.1</span>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>EXP</span>
              <span>100 / 500</span>
            </div>
            <div className="exp-bar">
              <div className="exp-bar-fill" style={{ width: "20%" }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">3</p>
              <p className="text-xs text-slate-400">オブジェクト</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">🌱 春</p>
              <p className="text-xs text-slate-400">テーマ</p>
            </div>
          </div>
        </div>
      </div>

      {/* マイルストーン */}
      <div className="glass-card p-5">
        <h3 className="section-title text-base mb-4 flex items-center gap-2">
          <Icons.Trophy size={18} />
          マイルストーン
        </h3>
        <ul className="space-y-3">
          {milestones.map((m, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                m.done
                  ? "bg-green-500/20 border border-green-500/50 text-green-400"
                  : "bg-white/5 border border-white/10 text-slate-600"
              }`}>
                {m.done ? "✓" : ""}
              </div>
              <span className={`text-sm ${m.done ? "text-slate-400 line-through" : "text-slate-300"}`}>
                {m.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 最近のアクティビティ */}
      <div className="glass-card p-5">
        <h3 className="section-title text-base mb-4 flex items-center gap-2">
          <Icons.Clock size={18} />
          最近
        </h3>
        <ul className="space-y-3">
          {recentActivity.map((a, i) => {
            const IconComponent = Icons[a.icon as keyof typeof Icons];
            return (
              <li key={i} className="flex items-center gap-3">
                <IconComponent size={18} className="flex-shrink-0 text-green-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300">{a.label}</p>
                  <p className="text-xs text-slate-500">{a.time}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* アクション */}
      <button className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2">
        <Icons.Palette size={16} />
        オブジェクトを追加
      </button>
    </div>
  );
}
