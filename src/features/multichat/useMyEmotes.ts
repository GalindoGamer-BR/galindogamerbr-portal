import { useEffect, useState } from "react";
import { z } from "zod";
import { command } from "./services";
import { emoteSchema, type Emote } from "./emotes";

export type MyEmotesStatus = "idle" | "ok" | "needs_reauth" | "unavailable";
export type EmoteOwner = { name: string; avatar: string };
export type MyEmote = Emote & { owner?: string; /** Tipo da coleção na Twitch (prime, hypetrain, limitedtime, rewards, twofactor...). */ type?: string };
type State = { status: MyEmotesStatus; emotes: MyEmote[]; owners: Record<string, EmoteOwner> };
const idle: State = { status: "idle", emotes: [], owners: {} };

const myEmoteSchema = emoteSchema.extend({ owner: z.string().optional(), type: z.string().optional() });
const ownersSchema = z.record(z.string(), z.object({ name: z.string(), avatar: z.string() }));

// Emotes que o membro pode usar na Twitch (inscrições, follower, bits, globais), lidos com o token dele; "owners" traz o
// nome e a foto do canal dono de cada grupo.
export function useMyEmotes(signedIn: boolean) {
  const [state, setState] = useState<State>(idle);
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    void command<{ status: string; emotes: unknown; owners?: unknown }>("/api/accounts/twitch/emotes")
      .then((data) => {
        if (!active) return;
        if (data.status === "ok") setState({ status: "ok", emotes: myEmoteSchema.array().parse(data.emotes), owners: ownersSchema.catch({}).parse(data.owners ?? {}) });
        else setState({ ...idle, status: data.status === "needs_reauth" ? "needs_reauth" : "unavailable" });
      })
      .catch(() => { if (active) setState({ ...idle, status: "unavailable" }); });
    return () => { active = false; };
  }, [signedIn]);
  // Deslogado: sem lista (deriva no retorno em vez de limpar o estado dentro do efeito).
  return signedIn ? state : idle;
}
