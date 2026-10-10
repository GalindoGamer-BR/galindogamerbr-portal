import { useRef, useState, type ReactNode } from "react";
import { emoteKey, type Emote } from "./emotes";
import { PlatformIcon } from "./PlatformIcon";
import { ClockIcon, GlobeIcon, SearchIcon, UserIcon } from "../../components/ui/Icons";

// "mine": emote que o membro pode usar na Twitch (lido com o token dele).
export type PickerEmote = Emote & { mine?: boolean };

const providerLabels: Record<Emote["provider"], string> = { twitch: "Twitch", kick: "Kick", bttv: "BTTV" };
const providerOrder: Emote["provider"][] = ["twitch", "kick", "bttv"];

export function EmoteImage({ emote }: { emote: Emote }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <>{emote.code}</>
  ) : (
    <img
      className="mc-emote"
      src={emote.url}
      alt={emote.code}
      title={`${emote.code} · ${providerLabels[emote.provider]}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

type TabId = "recent" | "mine" | "channel" | "global";
type Section = { id: string; tab: TabId; title: string; provider?: Emote["provider"]; emotes: PickerEmote[] };

// Seletor no estilo da Kick: busca no topo, abas de ícones e uma lista única rolável com seções
// (utilizados com frequência, meus, canal e globais, cada um separado por plataforma).
export function EmotePicker({
  emotes,
  recent,
  state,
  notice,
  onSelect,
  onClose,
}: {
  emotes: PickerEmote[];
  /** Chaves (provider:id) dos últimos emotes usados, do mais recente ao mais antigo. */
  recent: string[];
  state: string;
  notice?: { text: string; action: string; onAction: () => void };
  onSelect: (emote: PickerEmote) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<TabId | null>(null);
  const body = useRef<HTMLDivElement>(null);

  const needle = query.trim().toLowerCase();
  const matches = (e: Emote) => !needle || e.code.toLowerCase().includes(needle);
  const byKey = new Map(emotes.map((e) => [emoteKey(e), e]));
  const recentEmotes = recent.map((key) => byKey.get(key)).filter((e): e is PickerEmote => !!e && matches(e));

  const sections: Section[] = [];
  if (recentEmotes.length) sections.push({ id: "recent", tab: "recent", title: "Utilizado com frequência", emotes: recentEmotes });
  const mine = emotes.filter((e) => e.mine && matches(e));
  if (mine.length) sections.push({ id: "mine", tab: "mine", title: "Meus emotes · Twitch", provider: "twitch", emotes: mine });
  for (const [tab, label] of [["channel", "Canal"], ["global", "Global"]] as const) {
    for (const provider of providerOrder) {
      const list = emotes.filter(
        (e) => e.provider === provider && matches(e) && (tab === "channel" ? e.source === "channel" : e.source !== "channel"),
      );
      if (list.length) sections.push({ id: `${tab}-${provider}`, tab, title: `${label} · ${providerLabels[provider]}`, provider, emotes: list });
    }
  }

  const tabs: { id: TabId; label: string; icon: ReactNode }[] = [
    { id: "recent", label: "Utilizados com frequência", icon: <ClockIcon /> },
    { id: "mine", label: "Meus emotes", icon: <UserIcon /> },
    { id: "channel", label: "Emotes do canal", icon: <img src="/assets/logos/galindogamerbr.webp" alt="" className="mc-pk-logo" /> },
    { id: "global", label: "Emotes globais", icon: <GlobeIcon /> },
  ];
  const visibleTabs = tabs.filter((t) => sections.some((s) => s.tab === t.id));
  const current = active && visibleTabs.some((t) => t.id === active) ? active : visibleTabs[0]?.id;

  const jump = (tab: TabId) => {
    setActive(tab);
    const target = body.current?.querySelector<HTMLElement>(`[data-tab="${tab}"]`);
    if (target && body.current) body.current.scrollTo({ top: target.offsetTop - body.current.offsetTop, behavior: "smooth" });
  };
  // Acompanha a rolagem: a aba ativa é a da última seção que já passou do topo da lista.
  const spy = () => {
    const el = body.current;
    if (!el) return;
    let found: TabId | null = null;
    for (const node of el.querySelectorAll<HTMLElement>("[data-tab]"))
      if (node.offsetTop - el.offsetTop <= el.scrollTop + 8) found = node.dataset.tab as TabId;
    if (found && found !== active) setActive(found);
  };

  return (
    <section
      className="mc-emote-picker mc-pk"
      id="mc-emote-picker"
      aria-label="Seletor de emotes"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="mc-pk-search">
        <SearchIcon />
        <input
          autoFocus
          aria-label="Buscar emote"
          placeholder="Buscar emotes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" onClick={onClose} aria-label="Fechar emotes">
          ✕
        </button>
      </div>
      <div className="mc-pk-tabs" role="tablist" aria-label="Categorias de emotes">
        {visibleTabs.map((t) => (
          <button
            type="button"
            role="tab"
            key={t.id}
            className="mc-pk-tab"
            aria-selected={current === t.id}
            aria-label={t.label}
            title={t.label}
            onClick={() => jump(t.id)}
          >
            {t.icon}
          </button>
        ))}
      </div>
      <div className="mc-pk-body" ref={body} onScroll={spy}>
        {state && <p className="mc-muted">{state}</p>}
        {notice && (
          <p className="mc-muted">
            {notice.text}{" "}
            <button type="button" onClick={notice.onAction}>{notice.action}</button>
          </p>
        )}
        {sections.map((s, index) => (
          <div key={s.id} data-tab={index === 0 || sections[index - 1].tab !== s.tab ? s.tab : undefined}>
            <p className="mc-pk-title">
              {s.provider && <PlatformIcon platform={s.provider === "bttv" ? "twitch" : s.provider} />}
              {s.title}
            </p>
            <div className="mc-pk-grid">
              {s.emotes.slice(0, 300).map((e) => (
                <button
                  type="button"
                  key={emoteKey(e)}
                  aria-label={`Inserir ${e.code}`}
                  title={`${e.code} · ${providerLabels[e.provider]}${e.subOnly ? " · só inscritos" : ""}`}
                  onClick={() => onSelect(e)}
                >
                  <EmoteImage emote={e} />
                </button>
              ))}
            </div>
          </div>
        ))}
        {!sections.length && !state && (
          <p className="mc-muted">{needle ? "Nenhum emote encontrado." : "Carregando emotes…"}</p>
        )}
        <p className="mc-muted mc-pk-foot">
          Emote da Twitch só vai para a Twitch, e emote da Kick só para a Kick. Os de sub exigem a inscrição na
          plataforma. BTTV vai como texto nas demais.
        </p>
      </div>
    </section>
  );
}
