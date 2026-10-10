export type RichToken =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "link"; text: string; href: string };

// Descrições de canal vêm com um pouco de markdown (**negrito**, [texto](https://link)) e com links soltos. Só esses
// três casos são interpretados; qualquer outro texto fica como está, e só links http(s) viram âncoras.
const pattern = /\*\*([^*\n]+?)\*\*|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/g;

export function parseRich(input: string): RichToken[] {
  const tokens: RichToken[] = [];
  let last = 0;
  for (const match of input.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) tokens.push({ type: "text", text: input.slice(last, start) });
    if (match[1] !== undefined) tokens.push({ type: "bold", text: match[1] });
    else if (match[2] !== undefined) tokens.push({ type: "link", text: match[2], href: match[3] });
    else {
      // Link solto: a pontuação final da frase não faz parte do endereço.
      const url = match[4].replace(/[.,;:!?)\]]+$/, "");
      tokens.push({ type: "link", text: url, href: url });
      if (url.length < match[4].length) tokens.push({ type: "text", text: match[4].slice(url.length) });
    }
    last = start + match[0].length;
  }
  if (last < input.length) tokens.push({ type: "text", text: input.slice(last) });
  return tokens;
}

