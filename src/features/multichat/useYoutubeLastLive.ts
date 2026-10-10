import { useEffect, useState } from "react";
import { z } from "zod";

const lastLiveSchema = z.object({ videoId: z.string().nullable(), title: z.string().optional(), endedAt: z.string().optional() });
export type YoutubeLastLive = { videoId: string; title: string; endedAt?: string };

// Última live encerrada do canal no YouTube (o arquivo dela), para o player não ficar vazio sem transmissão ao vivo.
export function useYoutubeLastLive(enabled: boolean) {
  const [last, setLast] = useState<YoutubeLastLive | null>(null);
  useEffect(() => {
    if (!enabled || last) return;
    let active = true;
    void fetch("/api/youtube-last-live")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const parsed = lastLiveSchema.parse(await response.json());
        if (active && parsed.videoId) setLast({ videoId: parsed.videoId, title: parsed.title ?? "", endedAt: parsed.endedAt });
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [enabled, last]);
  return last;
}
