import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { labels, type ChatMessage } from "./types";
export function ChatVirtualList({ messages }: { messages: ChatMessage[] }) {
  const parent = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [paused, setPaused] = useState(false);
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parent.current,
    estimateSize: () => 82,
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
                <div className={`mc-avatar mc-${message.platform}`}>
                  {message.user.displayName.slice(0, 1).toUpperCase()}
                </div>
                <div className="mc-message-content">
                  <div className="mc-message-meta">
                    <strong>{message.user.displayName}</strong>
                    <span className={`mc-platform mc-${message.platform}`}>
                      {labels[message.platform]}
                    </span>
                    <time dateTime={message.timestamp}>
                      {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  <p>{message.message}</p>
                  {message.metadata?.donation && (
                    <small>
                      Contribuição: {message.metadata.donation.amount}{" "}
                      {message.metadata.donation.currency}
                    </small>
                  )}
                </div>
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
