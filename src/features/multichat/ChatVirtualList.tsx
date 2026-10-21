import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { labels, type ChatMessage } from "./types";
import { messageParts, type Emote } from "./emotes";
import { EmoteImage } from "./EmotePicker";
import { PlatformIcon } from "./PlatformIcon";
import { ShortsIcon } from "./ShortsIcon";
import { readableColor } from "./chatColors";
import { noticeText } from "./notices";
import { mentionsAny } from "./mentions";
import type { Badge } from "./useBadges";
import { isBadgeHidden } from "./badgeDefs";
import { PlatformBadge } from "./PlatformBadge";
export function ChatVirtualList({
  messages,
  catalog,
  badges,
  hiddenBadges = [],
  onReply,
  mentionNames,
}: {
  messages: ChatMessage[];
  catalog: Map<string, Emote>;
  badges?: Map<string, Badge>;
  /** Selos que o usuário desligou nas configurações (chaves "plataforma:selo"). */
  hiddenBadges?: readonly string[];
  /** Sem ela (visitante sem login) a mensagem não mostra o botão de responder. */
  onReply?: (message: ChatMessage) => void;
  /** Nomes do próprio usuário: mensagens de outras pessoas que o citam com "@" ganham destaque. */
  mentionNames?: string[];
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
            const notice = noticeText(message);
            const removed = message.metadata?.removed;
            const reply = message.metadata?.replyTo;
            const canReply = !!onReply && !message.metadata?.pending && !message.metadata?.portal && !removed && !notice;
            const own = !!mentionNames?.some((name) => name.toLowerCase() === message.user.username.toLowerCase() || name.toLowerCase() === message.user.displayName.toLowerCase());
            const mentioned = !!mentionNames?.length && !own && !notice && !removed && mentionsAny(message.message, mentionNames);
            return (
              <article
                key={row.key}
                data-index={row.index}
                ref={virtualizer.measureElement}
                className={
                  "mc-message" +
                  (message.metadata?.pending ? " mc-message-pending" : "") +
                  (notice ? " mc-message-event" : "") +
                  (mentioned ? " mc-message-mention" : "") +
                  (removed ? " mc-message-removed" : "")
                }
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${row.start}px)`,
                }}
              >
                {reply && (
                  <div className="mc-reply-to">
                    Em resposta a <strong>{reply.displayName ?? "outra mensagem"}</strong>
                    {reply.text ? `: ${reply.text}` : ""}
                  </div>
                )}
                <time dateTime={message.timestamp} title={new Date(message.timestamp).toLocaleString("pt-BR")}>
                  {new Date(message.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </time>
                {message.metadata?.portal ? (
                  <span className="mc-portal-icons" title={`Enviada pelo portal para ${message.metadata.portal.platforms.map((p) => labels[p]).join(", ")}`}>
                    {message.metadata.portal.platforms.map((p) => <PlatformIcon key={p} platform={p} />)}
                  </span>
                ) : message.platform === "youtube" && message.metadata?.short ? (
                  <ShortsIcon />
                ) : (
                  <PlatformIcon platform={message.platform} />
                )}
                {notice ? (
                  <strong className="mc-notice-text">{notice}</strong>
                ) : (
                  <>
                    {message.platform === "twitch" && message.metadata?.badges?.map((id) => {
                      const badge = badges?.get(id);
                      return badge && !isBadgeHidden(hiddenBadges, "twitch", id) ? <img key={id} className="mc-badge" src={badge.url} alt={badge.title} title={badge.title} loading="lazy" /> : null;
                    })}
                    {(message.platform === "youtube" || message.platform === "kick") && message.metadata?.badges?.map((id) =>
                      isBadgeHidden(hiddenBadges, message.platform, id) ? null : <PlatformBadge key={id} platform={message.platform as "youtube" | "kick"} id={id} />,
                    )}
                    <strong
                      className="mc-message-user"
                      style={{ color: readableColor(message.metadata?.color) }}
                    >
                      {message.user.displayName}
                    </strong>
                    <span>: </span>
                  </>
                )}
                {removed ? (
                  <em className="mc-removed">mensagem removida pela moderação</em>
                ) : (message.message || !notice) && (
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
                )}
                {message.metadata?.bits && !removed && <small className="mc-bits">{message.metadata.bits} bits</small>}
                {message.metadata?.donation && (
                  <small>
                    Contribuição: {message.metadata.donation.amount}{" "}
                    {message.metadata.donation.currency}
                  </small>
                )}
                {canReply && (
                  <button type="button" className="mc-reply-button" onClick={() => onReply(message)} aria-label={`Responder a ${message.user.displayName}`}>
                    Responder
                  </button>
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
