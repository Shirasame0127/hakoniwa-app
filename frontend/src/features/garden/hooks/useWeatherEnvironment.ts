"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchEnvironment, type EnvironmentData } from "@/shared/api/weather";

// 天候・時間帯ごとの環境パラメータ
export interface EnvironmentParams {
  // 照明
  ambientIntensity: number;
  ambientColor: string;
  directionalIntensity: number;
  directionalColor: string;
  directionalPosition: [number, number, number];

  // 霧
  fogColor: string;
  fogNear: number;
  fogFar: number;

  // 空の色
  skyColor: string;
  groundColor: string;

  // エフェクト
  rainEnabled: boolean;
  snowEnabled: boolean;
  fogEnabled: boolean;
  thunderEnabled: boolean;
}

const TIME_LIGHTING: Record<EnvironmentData["time_of_day"], Pick<EnvironmentParams,
  "ambientIntensity" | "ambientColor" | "directionalIntensity" | "directionalColor" | "directionalPosition" | "skyColor" | "groundColor"
>> = {
  dawn: {
    ambientIntensity: 0.4,
    ambientColor: "#FFB347",
    directionalIntensity: 0.6,
    directionalColor: "#FF8C42",
    directionalPosition: [-5, 3, 10],
    skyColor: "#FFB347",
    groundColor: "#8B7355",
  },
  morning: {
    ambientIntensity: 0.7,
    ambientColor: "#FFF5E0",
    directionalIntensity: 1.2,
    directionalColor: "#FFFBE6",
    directionalPosition: [5, 10, 5],
    skyColor: "#87CEEB",
    groundColor: "#90EE90",
  },
  afternoon: {
    ambientIntensity: 0.8,
    ambientColor: "#FFFFFF",
    directionalIntensity: 1.5,
    directionalColor: "#FFFFFF",
    directionalPosition: [0, 15, 0],
    skyColor: "#4FC3F7",
    groundColor: "#66BB6A",
  },
  evening: {
    ambientIntensity: 0.5,
    ambientColor: "#FF6B6B",
    directionalIntensity: 0.8,
    directionalColor: "#FF7043",
    directionalPosition: [-8, 3, 5],
    skyColor: "#FF6B35",
    groundColor: "#A0522D",
  },
  night: {
    ambientIntensity: 0.2,
    ambientColor: "#1A237E",
    directionalIntensity: 0.3,
    directionalColor: "#B0BEC5",
    directionalPosition: [3, 8, -5],
    skyColor: "#0D1B2A",
    groundColor: "#1B5E20",
  },
};

function buildParams(env: EnvironmentData): EnvironmentParams {
  const light = TIME_LIGHTING[env.time_of_day];

  // 天候による補正
  const weatherMod = {
    clear:   { ambientMul: 1.0, fogFar: 100 },
    cloudy:  { ambientMul: 0.7, fogFar: 80 },
    rain:    { ambientMul: 0.5, fogFar: 40 },
    snow:    { ambientMul: 0.6, fogFar: 30 },
    foggy:   { ambientMul: 0.4, fogFar: 15 },
    thunder: { ambientMul: 0.3, fogFar: 35 },
  }[env.weather];

  // 季節による地面色調整
  const seasonMod: Record<EnvironmentData["season"], { hue: number }> = {
    spring: { hue: 1.0 },    // 緑
    summer: { hue: 0.9 },    // より濃い緑
    autumn: { hue: 1.1 },    // 茶色っぽく
    winter: { hue: 0.8 },    // 淡い色
  };

  // 季節に応じた地面色の調整（簡易版）
  function adjustGroundColorForSeason(baseColor: string, season: EnvironmentData["season"]): string {
    // 簡易版: 季節による色相気
    const seasonAdjust = seasonMod[season];
    // 実装をシンプルにするため、ここでは基本色に季節情報を組み込む
    // hex色を操作するのは複雑なため、RGB値の直接操作が必要な場合は別途実装
    // 今は基本の TIME_LIGHTING を使用して、季節による明るさはライティングで表現
    return baseColor;
  }

  let groundColor = light.groundColor;
  // 季節による明るさ調整
  if (env.season === "winter") {
    // 冬は全体的に薄暗く
    // skyColor も調整 (winter sky は青白くなる)
  }

  return {
    ambientIntensity: light.ambientIntensity * weatherMod.ambientMul,
    ambientColor: light.ambientColor,
    directionalIntensity: light.directionalIntensity * weatherMod.ambientMul,
    directionalColor: light.directionalColor,
    directionalPosition: light.directionalPosition,
    fogColor: env.weather === "foggy" ? "#C8C8C8" : light.skyColor,
    fogNear: env.weather === "foggy" ? 3 : 20,
    fogFar: weatherMod.fogFar,
    skyColor: light.skyColor,
    groundColor,
    rainEnabled: env.weather === "rain" || env.weather === "thunder",
    snowEnabled: env.weather === "snow",
    fogEnabled: env.weather === "foggy" || env.weather === "rain" || env.weather === "thunder",
    thunderEnabled: env.weather === "thunder",
  };
}

// トークンなしのフォールバック（クライアントサイドのみ）
function getLocalEnvironment(overrideTimeOfDay?: EnvironmentData["time_of_day"]): EnvironmentData {
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth() + 1;

  const getTimeOfDay = (h: number): EnvironmentData["time_of_day"] => {
    if (h >= 5 && h < 7) return "dawn";
    if (h >= 7 && h < 11) return "morning";
    if (h >= 11 && h < 17) return "afternoon";
    if (h >= 17 && h < 20) return "evening";
    return "night";
  };

  const getSeason = (m: number): EnvironmentData["season"] => {
    if (m >= 3 && m <= 5) return "spring";
    if (m >= 6 && m <= 8) return "summer";
    if (m >= 9 && m <= 11) return "autumn";
    return "winter";
  };

  return {
    weather: "clear",
    time_of_day: overrideTimeOfDay ?? getTimeOfDay(hour),
    season: getSeason(month),
    temperature: null,
    city_name: "local",
    is_known_city: false,
  };
}

export function useWeatherEnvironment(overrideTimeOfDay?: EnvironmentData["time_of_day"]) {
  const token = typeof window !== "undefined" ? (localStorage.getItem("token") ?? "") : "";

  const { data } = useQuery({
    queryKey: ["weather-environment", overrideTimeOfDay],
    queryFn: () => {
      const env = token ? fetchEnvironment(token) : Promise.resolve(getLocalEnvironment(overrideTimeOfDay));
      return env.then(e => overrideTimeOfDay ? { ...e, time_of_day: overrideTimeOfDay } : e);
    },
    refetchInterval: 5 * 60 * 1000,  // 5分ごとに更新
    staleTime: 4 * 60 * 1000,
  });

  const env = data ?? getLocalEnvironment(overrideTimeOfDay);
  return { env, params: buildParams(env) };
}
