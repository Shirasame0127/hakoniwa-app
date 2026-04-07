/**
 * モデルURL解決ユーティリティ
 * - 本番: R2 (NEXT_PUBLIC_R2_URL が設定されている場合)
 * - ローカル: /public/models にフォールバック
 */
const R2_URL = process.env.NEXT_PUBLIC_R2_URL ?? "";

/**
 * model_path ("/models/food/apple.glb") を実際の配信URLに変換する
 */
export function getModelUrl(modelPath: string | null | undefined): string | null {
  if (!modelPath) return null;
  if (modelPath.startsWith("http")) return modelPath; // すでにフルURL
  if (R2_URL) return `${R2_URL}${modelPath}`;
  return modelPath; // ローカル: Next.js public/ から配信
}
