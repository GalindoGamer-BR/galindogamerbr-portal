// Menções a membros do portal: autocomplete de "@" no campo de envio e destaque de "te mencionaram" no chat.
// O nome de exibição do portal pode ter espaços; no texto ele vira "@Nome_com_underscores" (o "@" não aceita espaço).

/** Forma do nome usada depois do "@": sem espaços nas pontas e com "_" no lugar dos espaços do meio. */
export const mentionHandle = (name: string) => name.trim().replace(/\s+/g, "_");

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const HANDLE_CHARS = "[\\p{L}\\p{N}_]";
export type MentionQuery = { start: number; query: string };

/** Se o cursor está logo depois de um "@trecho" (no início ou depois de espaço), devolve onde começa o "@" e o trecho digitado. */
export function mentionQuery(text: string, caret: number): MentionQuery | null {
  const before = text.slice(0, caret);
  const match = new RegExp(`(^|\\s)@(${HANDLE_CHARS}{0,24})$`, "u").exec(before);
  return match ? { start: before.length - match[2].length - 1, query: match[2] } : null;
}

/** Nomes que começam com o trecho (sem diferenciar maiúsculas), sem repetir, em ordem alfabética. */
export function suggestMentions(handles: string[], query: string, limit = 6): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const handle of [...handles].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }))) {
    const key = handle.toLowerCase();
    if (!handle || seen.has(key) || !key.startsWith(query.toLowerCase())) continue;
    seen.add(key);
    result.push(handle);
    if (result.length >= limit) break;
  }
  return result;
}

/** Troca o "@trecho" pelo "@nome" escolhido, com um espaço depois (reaproveita o que já houver), e devolve o texto e o cursor. */
export function applyMention(text: string, caret: number, query: MentionQuery, handle: string) {
  const rest = text.slice(caret);
  const hasSpace = /^\s/.test(rest);
  const insert = `@${handle}` + (hasSpace ? "" : " ");
  return { text: text.slice(0, query.start) + insert + rest, caret: query.start + insert.length + (hasSpace ? 1 : 0) };
}

/** O texto cita algum dos nomes com "@" (palavra inteira, sem diferenciar maiúsculas)? */
export function mentionsAny(text: string, handles: string[]): boolean {
  const wanted = handles.map(mentionHandle).filter(Boolean);
  if (!wanted.length) return false;
  const re = new RegExp(`(?:^|[^\\p{L}\\p{N}_])@(${HANDLE_CHARS}+)`, "gu");
  for (const match of text.matchAll(re)) if (wanted.some((handle) => same(handle, match[1]))) return true;
  return false;
}
