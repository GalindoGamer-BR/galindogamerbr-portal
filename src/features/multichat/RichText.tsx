import { Fragment, type ReactNode } from "react";
import { parseRich } from "./parseRich";

// Texto de descrição de canal com negrito e links (ver parseRich); só âncoras http(s), sem HTML injetado.
export function RichText({ text }: { text: string }): ReactNode {
  return parseRich(text).map((token, index) =>
    token.type === "bold" ? (
      <strong key={index}>{token.text}</strong>
    ) : token.type === "link" ? (
      <a key={index} href={token.href} target="_blank" rel="noopener noreferrer nofollow">{token.text}</a>
    ) : (
      <Fragment key={index}>{token.text}</Fragment>
    ),
  );
}
