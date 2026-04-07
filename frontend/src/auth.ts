import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials プロバイダー（メール&パスワード）
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("メールアドレスとパスワードを入力してください");
        }

        try {
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || "ログイン失敗");
          }

          const data = await res.json();
          return {
            id: data.user.id,
            email: data.user.email,
            accessToken: data.access_token,
          };
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : "ログイン失敗");
        }
      },
    }),

    // Google プロバイダー
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  callbacks: {
    // Google トークンをバックエンド経由で JWT に変換
    async signIn({ user, account }) {
      if (account?.provider === "google" && account.id_token) {
        try {
          // バックエンドで Google トークンを検証
          const res = await fetch(`${API_URL}/api/auth/google/callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: account.id_token }),
          });

          if (!res.ok) {
            return false;
          }

          const data = await res.json();
          // ユーザーオブジェクトに accessToken を追加（JWT callback で使用）
          user.accessToken = data.access_token;
          user.id = data.user.id;
          user.email = data.user.email;
        } catch (error) {
          console.error("Google OAuth callback failed:", error);
          return false;
        }
      }
      return true;
    },

    // JWT コールバック：トークンを セッションに含める
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id;
      }
      return token;
    },

    // Session コールバック：JWT をセッションに含める
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 24 * 60 * 60,
  },

  events: {
    async signOut() {
      // ログアウト時の処理（必要に応じて）
    },
  },
};

export const handler = NextAuth(authOptions);
