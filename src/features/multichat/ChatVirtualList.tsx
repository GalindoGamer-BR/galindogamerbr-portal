import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type ChatMessage } from "./types";
import { messageParts, type Emote } from "./emotes";
import { EmoteImage } from "./EmotePicker";
import { PlatformIcon } from "./PlatformIcon";
import type { Badge } from "./useBadges";
export function ChatVirtualList({
  messages,
  catalog,
  badges,
}: {
  messages: ChatMessage[];
  catalog: Map<string, Emote>;
  badges?: Map<string, Badge>;
}) {
  const parent = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [paused, setPaused] = useState(false);
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parent.current,
    estimateSize: () => 38,
    overscan: 8,
    getItemKey: (index) => messages[index].id,
  });
  useEffect(() => {
    if (following.current && messages.length)
      virtualizer.scrollToIndex(messages.length - 1, { align: "end" });
  }, [messages, virtualizer]);
  return (
    <div className="mc-timeline-wrap">
      <div
        ref={parent}
        className="mc-timeline"
        role="region"
        aria-label="Mensagens do multichat"
        tabIndex={0}
        onScroll={() => {
          const el = parent.current;
          if (el) {
            following.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 120;
            setPaused(!following.current);
          }
        }}
      >
        {!messages.length && (
          <div className="mc-empty">
            <span>✦</span>
            <strong>A conversa começa aqui</strong>
            <p>As próximas mensagens aparecerão neste espaço.</p>
          </div>
        )}
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((row) => {
            const message = messages[row.index];
            return (
              <article
                key={row.key}
                data-index={row.index}
                ref={virtualizer.measureElement}
                className="mc-message"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${row.start}px)`,
                }}
              >
                <time dateTime={message.timestamp} title={new Date(message.timestamp).toLocaleString("pt-BR")}>
                  {new Date(message.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </time>
                <PlatformIcon platform={message.platform} />
                {message.platform === "twitch" && message.metadata?.badges?.map((id) => {
                  const badge = badges?.get(id);
                  return badge ? <img key={id} className="mc-badge" src={badge.url} alt={badge.title} title={badge.title} loading="lazy" /> : null;
                })}
                <strong
                  className="mc-message-user"
                  style={{
                    color: /^#[0-9a-f]{6}$/i.test(message.metadata?.color || "")
                      ? message.metadata!.color
                      : undefined,
                  }}
                >
                  {message.user.displayName}
                </strong>
                <span>: </span>
                <span className="mc-message-text">
                  {messageParts(message, catalog).map((part, index) =>
                    part.emote ? (
                      <EmoteImage
                        key={index + part.emote.id}
                        emote={part.emote}
                      />
                    ) : /^https?:\/\/\S+$/i.test(part.text) ? (
                      <a
                        key={index}
                        href={part.text}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {part.text}
                      </a>
                    ) : (
                      part.text
                    ),
                  )}
                </span>
                {message.metadata?.donation && (
                  <small>
                    Contribuição: {message.metadata.donation.amount}{" "}
                    {message.metadata.donation.currency}
                  </small>
                )}
              </article>
            );
          })}
        </div>
      </div>
      {paused && (
        <button
          className="mc-follow"
          onClick={() => {
            following.current = true;
            setPaused(false);
            virtualizer.scrollToIndex(Math.max(0, messages.length - 1), {
              align: "end",
            });
          }}
        >
          ↓ Voltar ao vivo
        </button>
      )}
    </div>
  );
}
