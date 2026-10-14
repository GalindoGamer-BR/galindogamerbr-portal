import { useEffect, useState } from "react";
import { z } from "zod";

const channelSchema = z.object({
  name: z.string(),
  description: z.string(),
  handle: z.string(),
  subscribers: z.number().nullable(),
  videos: z.number().nullable(),
});
export type YoutubeChannel = z.infer<typeof channelSchema>;

// Nome, descrição e contagens do canal no YouTube (cache de 1 h no servidor; custa 1 unidade de cota por consulta).
export function useYoutubeChannel(enabled: boolean) {
  const [channel, setChannel] = useState<YoutubeChannel | null>(null);
  useEffect(() => {
    if (!enabled || channel) return;
    let active = true;
    void fetch("/api/youtube-channel")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const parsed = channelSchema.parse(await response.json());
        if (active) setChannel(parsed);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [enabled, channel]);
  return channel;
}
