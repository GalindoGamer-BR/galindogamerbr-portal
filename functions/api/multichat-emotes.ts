import type { Env } from "../lib/env";
import { getAppAccessToken } from "../lib/twitch";
import { TWITCH_LOGIN } from "../lib/socialConstants";
import { fetchWithTimeout, json } from "../lib/http";
import { withEdgeCache } from "../lib/edgeCache";
type Emote = {
  id: string;
  code: string;
  provider: "twitch" | "bttv";
  url: string;
};
type TwitchEmote = { id: string; name: string };
type BttvEmote = { id: string; code: string };
export const onRequestGet: PagesFunction<Env> = async (context) =>
  withEdgeCache(
    context.request,
    (promise) => context.waitUntil(promise),
    async () => {
      const emotes: Emote[] = [];
      let partial = false;
      async function read<T>(
        url: string,
        headers?: Record<string, string>,
      ): Promise<T> {
        const response = await fetchWithTimeout(url, { headers });
        if (!response.ok) throw new Error("catalog_unavailable");
        return response.json() as Promise<T>;
      }
      function bttv(items: BttvEmote[]) {
        for (const e of items)
          if (typeof e.id === "string" && typeof e.code === "string")
            emotes.push({
              id: e.id,
              code: e.code,
              provider: "bttv",
              url: `https://cdn.betterttv.net/emote/${encodeURIComponent(e.id)}/2x`,
            });
      }
      const outcomes = await Promise.allSettled([
        read<BttvEmote[]>(
          "https://api.betterttv.net/3/cached/emotes/global",
        ).then(bttv),
        (async () => {
          if (
            !context.env.TWITCH_CLIENT_ID ||
            !context.env.TWITCH_CLIENT_SECRET
          )
            throw new Error("not_configured");
          const token = await getAppAccessToken(context.env);
          if (!token) throw new Error("not_configured");
          const headers = {
            authorization: `Bearer ${token}`,
            "client-id": context.env.TWITCH_CLIENT_ID,
          };
          const users = await read<{ data: { id: string }[] }>(
            `https://api.twitch.tv/helix/users?login=${TWITCH_LOGIN}`,
            headers,
          );
          const id = users.data[0]?.id;
          if (!id) throw new Error("channel_missing");
          const results = await Promise.allSettled([
            ...["chat/emotes/global", `chat/emotes?broadcaster_id=${id}`].map(
              async (path) => {
                const data = await read<{ data: TwitchEmote[] }>(
                  `https://api.twitch.tv/helix/${path}`,
                  headers,
                );
                for (const e of data.data)
                  emotes.push({
                    id: e.id,
                    code: e.name,
                    provider: "twitch",
                    url: `https://static-cdn.jtvnw.net/emoticons/v2/${encodeURIComponent(e.id)}/default/dark/2.0`,
                  });
              },
            ),
            (async () => {
              const response = await fetchWithTimeout(
                `https://api.betterttv.net/3/cached/users/twitch/${id}`,
              );
              if (response.status === 404) return;
              if (!response.ok) throw new Error("bttv_unavailable");
              const data = (await response.json()) as {
                channelEmotes: BttvEmote[];
                sharedEmotes: BttvEmote[];
              };
              bttv([...data.channelEmotes, ...data.sharedEmotes]);
            })(),
          ]);
          if (results.some((r) => r.status === "rejected")) partial = true;
        })(),
      ]);
      if (outcomes.some((r) => r.status === "rejected")) partial = true;
      const unique = [
        ...new Map(emotes.map((e) => [e.provider + ":" + e.id, e])).values(),
      ];
      return json(
        { emotes: unique, partial },
        { publicCacheSeconds: partial ? 30 : 3600 },
      );
    },
  );
