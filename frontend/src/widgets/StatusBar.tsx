"use client";

import { Icons } from "@/shared/ui/icons";

const stats = [
  { label: "Lv.", value: "1", icon: "Zap", color: "text-yellow-400" },
  { label: "EXP", value: "100 / 500", icon: "Sparkles", color: "text-blue-400" },
  { label: "食材", value: "4", icon: "Apple", color: "text-red-400" },
  { label: "連続", value: "3日", icon: "Flame", color: "text-orange-400" },
];

export function StatusBar() {
  const expPercent = (100 / 500) * 100;

  return (
    <div className="border-b"
      style={{
        background: "rgba(255,255,255,0.02)",
        borderColor: "rgba(255,255,255,0.05)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6 overflow-x-auto">
        {/* EXP Bar */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Lv.1</span>
          <div className="w-32 exp-bar">
            <div className="exp-bar-fill" style={{ width: `${expPercent}%` }} />
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap">100 / 500</span>
        </div>

        <div className="h-4 w-px bg-white/10 flex-shrink-0" />

        {/* Stats */}
        <div className="flex items-center gap-4">
          {stats.map((stat) => {
            const IconComponent = Icons[stat.icon as keyof typeof Icons];
            return (
              <div key={stat.label} className="flex items-center gap-1.5 flex-shrink-0">
                <IconComponent size={16} className={stat.color} />
                <span className="text-xs text-slate-400">{stat.label}</span>
                <span className={`text-xs font-bold ${stat.color}`}>{stat.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
