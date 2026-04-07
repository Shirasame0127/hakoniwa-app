import { ApiClient } from "./client";

export interface EnvironmentData {
  weather: "clear" | "rain" | "snow" | "cloudy" | "foggy" | "thunder";
  time_of_day: "dawn" | "morning" | "afternoon" | "evening" | "night";
  season: "spring" | "summer" | "autumn" | "winter";
  temperature: number | null;
  city_name: string;
  is_known_city: boolean;
}

export function fetchEnvironment(token: string): Promise<EnvironmentData> {
  return ApiClient.fetch<EnvironmentData>(
    `/api/garden/weather/environment?token=${token}`,
  );
}

export function setCity(city_name: string, token: string): Promise<{ city_name: string }> {
  return ApiClient.patch("/api/garden/weather/city", { city_name });
}
