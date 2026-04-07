"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icons } from "@/shared/ui/icons";
import { useAuthStore } from "@/shared/stores/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { setToken, setUser } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // TODO: API にログイン要求
      // const response = await fetch("/api/auth/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, password }),
      // });
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.message || "ログイン失敗");
      // setToken(data.token);
      // setUser({ id: data.user.id, email: data.user.email });
      // router.push("/garden");

      // Mock login for now
      console.log("Login attempted:", { email, password });
      alert("現在、バックエンド認証は未実装です。dev版では直接ガーデンへ遷移します。");
      setToken("mock-token");
      setUser({ id: "1", email });
      router.push("/garden");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        {/* ヒーロー */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black mb-3 leading-tight">
            <span style={{
              background: "linear-gradient(135deg, #4ade80, #7c3aed)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              ログイン
            </span>
          </h1>
          <p className="text-slate-400 text-sm">
            箱庭OSにログインして、AI ライフマネジメントを始めましょう
          </p>
        </div>

        {/* ログインフォーム */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              メールアドレス
            </label>
            <div className="relative">
              <Icons.Mail size={18} className="absolute left-3 top-3.5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              パスワード
            </label>
            <div className="relative">
              <Icons.Lock size={18} className="absolute left-3 top-3.5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 border border-red-500/30 rounded-lg bg-red-500/10">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Icons.Loader2 size={18} className="animate-spin" />
                ログイン中...
              </>
            ) : (
              <>
                <Icons.Mail size={18} />
                ログイン
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#0a0f1a] text-slate-400">または</span>
          </div>
        </div>

        {/* Links */}
        <div className="space-y-2">
          <Link
            href="/"
            className="w-full px-4 py-3 border border-white/10 rounded-xl text-center text-slate-300 font-medium hover:border-slate-500/50 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            <Icons.Home size={18} />
            ホームへ戻る
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>
            アカウントを持っていませんか？
            <Link href="/auth/register" className="text-green-400 hover:text-green-300 ml-1">
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
