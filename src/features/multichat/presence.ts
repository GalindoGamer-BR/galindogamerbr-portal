// Membros online no canal do chat (Supabase Presence). O nome vem do próprio navegador de cada membro, então a lista é
// informativa: nunca decida permissão por ela. Visitantes sem login não entram (só quem está logado faz `track`).
export type PresenceState = Record<string, { name?: unknown }[]>;
export type OnlineMembers = { count: number; names: string[] };
export const MAX_ONLINE_NAMES = 200;
const MAX_NAME_LENGTH = 40;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

const emptyOnline: OnlineMembers = { count: 0, names: [] };
export { emptyOnline };

/** Nomes distintos (sem diferenciar maiúsculas) do estado do Presence, limpos e em ordem alfabética. `count` é o total real. */
export function onlineMembers(state: PresenceState): OnlineMembers {
  const unique = new Map<string, string>();
  for (const entries of Object.values(state ?? {}))
    for (const entry of Array.isArray(entries) ? entries : []) {
      if (typeof entry?.name !== "string") continue;
      const name = entry.name.replace(CONTROL_CHARS, "").trim().slice(0, MAX_NAME_LENGTH);
      if (name && !unique.has(name.toLowerCase())) unique.set(name.toLowerCase(), name);
    }
  const names = [...unique.values()].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
  return { count: names.length, names: names.slice(0, MAX_ONLINE_NAMES) };
}
