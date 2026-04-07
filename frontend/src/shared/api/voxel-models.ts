import type {
  HakoniwaObjectDetail,
  HakoniwaObjectListResponse,
} from "@/features/voxel_models/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchObjects(params: {
  category?: string;
  subcategory?: string;
  rarity?: string;
  sort?: string;
  page?: number;
  limit?: number;
  token?: string;
}): Promise<HakoniwaObjectListResponse> {
  const url = new URL(`${BASE}/api/objects`);
  if (params.category)    url.searchParams.set("category", params.category);
  if (params.subcategory) url.searchParams.set("subcategory", params.subcategory);
  if (params.rarity)      url.searchParams.set("rarity", params.rarity);
  if (params.sort)        url.searchParams.set("sort", params.sort);
  if (params.page)        url.searchParams.set("page", String(params.page));
  if (params.limit)       url.searchParams.set("limit", String(params.limit));
  if (params.token)       url.searchParams.set("token", params.token);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("図鑑一覧の取得に失敗しました");
  return res.json();
}

export async function fetchObject(
  objectId: string,
  token?: string,
): Promise<HakoniwaObjectDetail> {
  const url = new URL(`${BASE}/api/objects/${objectId}`);
  if (token) url.searchParams.set("token", token);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("オブジェクトの取得に失敗しました");
  return res.json();
}

export async function fetchObjectByCatalogId(
  catalogId: string,
  token?: string,
): Promise<HakoniwaObjectDetail> {
  const url = new URL(`${BASE}/api/objects/catalog/${catalogId}`);
  if (token) url.searchParams.set("token", token);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("オブジェクトの取得に失敗しました");
  return res.json();
}

export async function uploadObject(params: {
  file: File;
  catalog_id: string;
  name: string;
  name_en?: string;
  category: string;
  subcategory?: string;
  description?: string;
  flavor_text?: string;
  rarity?: string;
  locations?: string[];
  seasons?: string[];
  obtain_method?: string;
  token: string;
}): Promise<HakoniwaObjectDetail> {
  const form = new FormData();
  form.append("file", params.file);
  form.append("catalog_id", params.catalog_id);
  form.append("name", params.name);
  form.append("category", params.category);
  form.append("token", params.token);
  if (params.name_en)      form.append("name_en", params.name_en);
  if (params.subcategory)  form.append("subcategory", params.subcategory);
  if (params.description)  form.append("description", params.description);
  if (params.flavor_text)  form.append("flavor_text", params.flavor_text);
  if (params.rarity)       form.append("rarity", params.rarity);
  if (params.locations)    form.append("locations", JSON.stringify(params.locations));
  if (params.seasons)      form.append("seasons", JSON.stringify(params.seasons));
  if (params.obtain_method) form.append("obtain_method", params.obtain_method);

  const res = await fetch(`${BASE}/api/objects/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "アップロードに失敗しました");
  }
  return res.json();
}

export async function toggleObjectLike(
  objectId: string,
  token: string,
): Promise<{ liked: boolean }> {
  const res = await fetch(`${BASE}/api/objects/${objectId}/like?token=${token}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("いいねの処理に失敗しました");
  return res.json();
}
