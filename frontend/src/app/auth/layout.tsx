import Link from "next/link";
import { Icons } from "@/shared/ui/icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0f1a] bg-grid">
      {/* 背景グロー */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #4ade80, transparent)" }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
      </div>

      {/* Header with logo */}
      <header className="relative z-10 border-b backdrop-blur-xl"
        style={{
          background: "rgba(10, 15, 26, 0.85)",
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
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
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}
