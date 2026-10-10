import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

const badgeSchema = z.object({ url: z.string().url().startsWith("https://static-cdn.jtvnw.net/"), title: z.string() });
export type Badge = z.infer<typeof badgeSchema>;

// Catálogo de badges da Twitch ("set_id/versão" -> imagem), para exibir ao lado do nome no chat.
export function useBadges() {
  const [badges, setBadges] = useState<Record<string, Badge>>({});
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/multichat-badges", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data = await response.json();
        setBadges(z.record(z.string(), badgeSchema).parse(data.badges));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  return useMemo(() => new Map(Object.entries(badges)), [badges]);
}
