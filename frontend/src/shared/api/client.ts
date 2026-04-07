/**
 * APIクライアント
 */

import { getSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiClient {
  static async fetch<T>(
    path: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_URL}${path}`;

    // next-auth のセッションから accessToken を取得
    const session = await getSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options?.headers,
    };

    // Authorization ヘッダを追加（Bearer トークン）
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }

    const response = await fetch(url, {
      headers,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  static get<T>(path: string): Promise<T> {
    return this.fetch<T>(path, { method: "GET" });
  }

  static post<T>(path: string, data?: unknown): Promise<T> {
    return this.fetch<T>(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static patch<T>(path: string, data?: unknown): Promise<T> {
    return this.fetch<T>(path, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static delete<T>(path: string): Promise<T> {
    return this.fetch<T>(path, { method: "DELETE" });
  }
}
