import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// auth.ts はサーバー側のみで実行される → INTERNAL_API_URL (Docker内部) を優先
const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const authConfig = {
  providers: [
    // Credentials プロバイダー（メール&パスワード）
    CredentialsProvider({
      async authorize(credentials: any) {
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
    async signIn({ user, account }: any) {
      if (account?.provider === "google" && account.id_token) {
        try {
          const res = await fetch(`${API_URL}/api/auth/google/callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: account.id_token }),
          });

          if (!res.ok) {
            return false;
          }

          const data = await res.json();
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

    async jwt({ token, user }: any) {
      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  session: {
    strategy: "jwt" as const,
    maxAge: 24 * 60 * 60,
  },

  jwt: {
    maxAge: 24 * 60 * 60,
  },
};

export const { handlers: { GET, POST }, auth } = NextAuth({
  ...authConfig,
  skipCSRFCheck: process.env.NODE_ENV === "development",
});
