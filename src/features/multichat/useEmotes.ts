import { useEffect, useMemo, useState } from "react";
import { emoteSchema, type Emote } from "./emotes";
export function useEmotes() {
  const [emotes, setEmotes] = useState<Emote[]>([]);
  const [state, setState] = useState("Carregando emotes…");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/multichat-emotes", { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const data = await r.json();
        const parsed = emoteSchema.array().parse(data.emotes);
        setEmotes(parsed);
        setState(
          data.partial
            ? "Alguns catálogos estão indisponíveis. Os demais continuam funcionando."
            : "",
        );
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setState("Não foi possível carregar os emotes.");
      });
    return () => controller.abort();
  }, []);
  const catalog = useMemo(
    () => new Map(emotes.map((e) => [e.code, e])),
    [emotes],
  );
  return { emotes, catalog, state };
}
