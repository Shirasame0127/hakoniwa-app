"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Icons } from "@/shared/ui/icons";

const navItems = [
  { href: "/", label: "ホーム", icon: "Home" },
  { href: "/garden", label: "箱庭", icon: "Leaf" },
  { href: "/models", label: "図鑑", icon: "Grid3x3" },
  { href: "/food", label: "食材", icon: "Apple" },
  { href: "/exercise", label: "運動", icon: "Activity" },
] as const;

export function Navigation() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav className="sticky top-0 z-50 border-b backdrop-blur-xl"
      style={{
        background: "rgba(10, 15, 26, 0.85)",
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-float"
            style={{ background: "linear-gradient(135deg, #16a34a, #7c3aed)" }}
          >
            <Icons.Leaf size={20} className="text-green-400" />
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:inline"
            style={{
              background: "linear-gradient(90deg, #4ade80, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            箱庭 OS
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const IconComponent = Icons[item.icon as keyof typeof Icons];
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: isActive
                    ? "rgba(74, 222, 128, 0.12)"
                    : "transparent",
                  color: isActive ? "#4ade80" : "#94a3b8",
                  border: isActive
                    ? "1px solid rgba(74, 222, 128, 0.25)"
                    : "1px solid transparent",
                }}
              >
                <IconComponent size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="badge-green hidden sm:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span>v0.1 Dev</span>
          </div>

          {/* ユーザー情報・ログアウト */}
          {session?.user && (
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-sm text-slate-400">{session.user.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-all border border-white/10 hover:border-red-500/30"
              >
                <Icons.LogOut size={16} className="inline mr-1.5" />
                ログアウト
              </button>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {isDrawerOpen ? (
              <Icons.X size={20} className="text-slate-300" />
            ) : (
              <Icons.Menu size={20} className="text-slate-300" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isDrawerOpen && (
        <div className="md:hidden border-t"
          style={{
            background: "rgba(10, 15, 26, 0.95)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <div className="px-6 py-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const IconComponent = Icons[item.icon as keyof typeof Icons];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                  style={{
                    background: isActive
                      ? "rgba(74, 222, 128, 0.12)"
                      : "transparent",
                    color: isActive ? "#4ade80" : "#94a3b8",
                  }}
                  onClick={() => setIsDrawerOpen(false)}
                >
                  <IconComponent size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            {session?.user && (
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-red-400 hover:bg-red-500/10 mt-2"
              >
                <Icons.LogOut size={20} />
                <span className="font-medium">ログアウト</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
