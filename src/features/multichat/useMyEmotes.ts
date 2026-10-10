import { useEffect, useState } from "react";
import { command } from "./services";
import { emoteSchema, type Emote } from "./emotes";

export type MyEmotesStatus = "idle" | "ok" | "needs_reauth" | "unavailable";
const idle: { status: MyEmotesStatus; emotes: Emote[] } = { status: "idle", emotes: [] };

// Emotes que o membro pode usar na Twitch (inscrições, follower, bits, globais), lidos com o token dele.
export function useMyEmotes(signedIn: boolean) {
  const [state, setState] = useState<{ status: MyEmotesStatus; emotes: Emote[] }>({ status: "idle", emotes: [] });
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    void command<{ status: string; emotes: unknown }>("/api/accounts/twitch/emotes")
      .then((data) => {
        if (!active) return;
        if (data.status === "ok") setState({ status: "ok", emotes: emoteSchema.array().parse(data.emotes) });
        else setState({ status: data.status === "needs_reauth" ? "needs_reauth" : "unavailable", emotes: [] });
      })
      .catch(() => { if (active) setState({ status: "unavailable", emotes: [] }); });
    return () => { active = false; };
  }, [signedIn]);
  // Deslogado: sem lista (deriva no retorno em vez de limpar o estado dentro do efeito).
  return signedIn ? state : idle;
}
