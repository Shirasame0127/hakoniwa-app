"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Icons } from "@/shared/ui/icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validatePassword = (pwd: string) => {
    if (pwd.length < 6) return "パスワードは6文字以上である必要があります";
    if (!/[A-Z]/.test(pwd)) return "大文字を1つ以上含める必要があります";
    if (!/[0-9]/.test(pwd)) return "数字を1つ以上含める必要があります";
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // バリデーション
    if (!email || !password || !confirmPassword) {
      setError("すべてのフィールドを入力してください");
      return;
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    if (!agreeTerms) {
      setError("利用規約に同意する必要があります");
      return;
    }

    setLoading(true);

    try {
      // バックエンドに登録要求
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "登録失敗");
      }

      // 登録成功後、自動ログイン
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/garden");
      } else {
        setError("登録後のログインに失敗しました");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/garden",
      });

      if (result?.error) {
        setError("Google 登録に失敗しました");
        return;
      }

      if (result?.ok) {
        router.push("/garden");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google 登録に失敗しました");
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
              新規登録
            </span>
          </h1>
          <p className="text-slate-400 text-sm">
            箱庭OSでAIライフマネジメントを始めよう
          </p>
        </div>

        {/* 登録フォーム */}
        <form onSubmit={handleRegister} className="space-y-4">
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
            <p className="text-xs text-slate-400 mt-2">
              6文字以上、大文字と数字を含める
            </p>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              パスワード確認
            </label>
            <div className="relative">
              <Icons.Lock size={18} className="absolute left-3 top-3.5 text-slate-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
              />
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 rounded border-white/10 bg-white/5 text-green-500 focus:ring-green-500/20"
            />
            <label htmlFor="terms" className="text-xs text-slate-400">
              <span>AI箱庭ライフOSの</span>
              <Link href="#" className="text-green-400 hover:text-green-300">
                利用規約
              </Link>
              <span>と</span>
              <Link href="#" className="text-green-400 hover:text-green-300">
                プライバシーポリシー
              </Link>
              <span>に同意します</span>
            </label>
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
                登録中...
              </>
            ) : (
              <>
                <Icons.Mail size={18} />
                メールで登録
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

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={loading}
          className="w-full px-4 py-3 border border-white/10 rounded-xl text-center text-slate-300 font-medium hover:border-slate-500/50 hover:bg-white/5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google で登録
        </button>

        {/* Links */}
        <div className="space-y-2 mt-4">
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
            既にアカウントをお持ちですか？
            <Link href="/auth/login" className="text-green-400 hover:text-green-300 ml-1">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
