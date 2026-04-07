/**
 * Garden API通信hook
 */

import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "../api/client";
import type { GardenState } from "@/features/garden/types";

export function useGarden() {
  return useQuery({
    queryKey: ["garden"],
    queryFn: async () => {
      try {
        const data = await ApiClient.get<GardenState>("/api/garden");
        return data;
      } catch {
        // APIがまだ未実装の場合はダミーデータを返す
        return {
          userId: "demo-user",
          level: 1,
          exp: 100,
          objects: [
            {
              id: "1",
              type: "tree",
              position: [0, 0, 0],
              modelPath: "/models/tree.glb",
            },
          ],
          environment: { theme: "grass" as const, size: 10 },
        };
      }
    },
  });
}
