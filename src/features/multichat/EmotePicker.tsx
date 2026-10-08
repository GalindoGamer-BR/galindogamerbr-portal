import { useState } from "react";
import type { Emote } from "./emotes";
export function EmoteImage({ emote }: { emote: Emote }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <>{emote.code}</>
  ) : (
    <img
      className="mc-emote"
      src={emote.url}
      alt={emote.code}
      title={`${emote.code} · ${emote.provider === "bttv" ? "BTTV" : "Twitch"}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
export function EmotePicker({
  emotes,
  state,
  onSelect,
  onClose,
}: {
  emotes: Emote[];
  state: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("all");
  const filtered = emotes.filter(
    (e) =>
      (provider === "all" || e.provider === provider) &&
      e.code.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section
      className="mc-emote-picker"
      id="mc-emote-picker"
      aria-label="Seletor de emotes"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="mc-section-head">
        <strong>Emotes e figurinhas</strong>
        <button type="button" onClick={onClose} aria-label="Fechar emotes">
          ✕
        </button>
      </div>
      <input
        autoFocus
        aria-label="Buscar emote"
        placeholder="Buscar emote…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="mc-tabs">
        {[
          ["all", "Todos"],
          ["twitch", "Twitch"],
          ["bttv", "BTTV"],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            aria-pressed={provider === value}
            onClick={() => setProvider(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {state && <p className="mc-muted">{state}</p>}
      <div className="mc-emote-grid">
        {filtered.slice(0, 200).map((e) => (
          <button
            type="button"
            key={e.provider + e.id}
            aria-label={`Inserir ${e.code}`}
            title={e.code}
            onClick={() => onSelect(e.code)}
          >
            <EmoteImage emote={e} />
          </button>
        ))}
      </div>
      {!filtered.length && !state && (
        <p className="mc-muted">Nenhum emote encontrado.</p>
      )}
      {filtered.length > 200 && (
        <p className="mc-muted">Use a busca para encontrar mais emotes.</p>
      )}
      <p className="mc-muted">
        Emotes de sub exigem a inscrição correspondente na Twitch. Em outras
        plataformas, o código pode aparecer como texto.
      </p>
    </section>
  );
}
