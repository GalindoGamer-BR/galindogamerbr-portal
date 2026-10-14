import { useEffect, useState } from "react";
import { z } from "zod";

const channelSchema = z.object({ name: z.string(), description: z.string(), title: z.string(), game: z.string() });
export type TwitchChannel = z.infer<typeof channelSchema>;

// Título, categoria e descrição do canal na Twitch; o título e a categoria mudam durante a live, então reconsulta a cada 2 min.
export function useTwitchChannel() {
  const [channel, setChannel] = useState<TwitchChannel | null>(null);
  useEffect(() => {
    let active = true;
    const load = () => {
      void fetch("/api/twitch-channel")
        .then(async (response) => {
          if (!response.ok) throw new Error();
          const parsed = channelSchema.parse(await response.json());
          if (active) setChannel(parsed);
        })
        .catch(() => undefined);
    };
    load();
    const timer = setInterval(load, 120_000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  return channel;
}
