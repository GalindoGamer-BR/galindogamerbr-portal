import { useRef, useState, type ReactNode } from "react";
import { emoteKey, type Emote } from "./emotes";
import { PlatformIcon } from "./PlatformIcon";
import { ClockIcon, GlobeIcon, LockIcon, SearchIcon, UserIcon } from "../../components/ui/Icons";

// "mine": emote que o membro pode usar na Twitch (lido com o token dele).
export type PickerEmote = Emote & { mine?: boolean; /** id do canal dono do emote (só nos meus emotes). */ owner?: string; /** Motivo do bloqueio (sub, seguidor, bits); ausente = liberado. */ locked?: string };

const providerLabels: Record<Emote["provider"], string> = { twitch: "Twitch", kick: "Kick", bttv: "BTTV", ffz: "FFZ" };
const providerOrder: Emote["provider"][] = ["twitch", "kick", "bttv", "ffz"];

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
type Section = { id: string; tab: TabId; group?: string; avatar?: string; title: string; provider?: Emote["provider"]; emotes: PickerEmote[] };

// Seletor no estilo da Kick: busca no topo, abas de ícones e uma lista única rolável com seções
// (utilizados com frequência, meus, canal e globais, cada um separado por plataforma).
export function EmotePicker({
  emotes,
  recent,
  owners,
  state,
  notice,
  onSelect,
  onClose,
}: {
  emotes: PickerEmote[];
  /** Chaves (provider:id) dos últimos emotes usados, do mais recente ao mais antigo. */
  recent: string[];
  /** Nome e foto dos canais donos dos meus emotes, por id. */
  owners: Record<string, { name: string; avatar: string }>;
  state: string;
  notice?: { text: string; action: string; onAction: () => void };
  onSelect: (emote: PickerEmote) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<TabId | null>(null);
  const [hint, setHint] = useState("");
  // Filtro por plataforma (chips no topo): vale para todas as seções, inclusive os recentes.
  const [only, setOnly] = useState<Emote["provider"] | null>(null);
  const body = useRef<HTMLDivElement>(null);

  const needle = query.trim().toLowerCase();
  const matches = (e: Emote) => (!only || e.provider === only) && (!needle || e.code.toLowerCase().includes(needle));
  const presentProviders = providerOrder.filter((p) => emotes.some((e) => e.provider === p));
  const byKey = new Map(emotes.map((e) => [emoteKey(e), e]));
  const recentEmotes = recent.map((key) => byKey.get(key)).filter((e): e is PickerEmote => !!e && matches(e));

  // Um bloco por plataforma dentro do grupo (canal ou global). A Twitch lista alguns globais duas vezes (ids diferentes,
  // mesmo nome): cada nome aparece uma vez.
  const groupSections = (tab: "channel" | "global", group: string): Section[] =>
    providerOrder.flatMap((provider) => {
      const seen = new Set<string>();
      const list = emotes
        .filter((e) => e.provider === provider && matches(e) && (tab === "channel" ? e.source === "channel" : e.source === "global" || (!e.source && !e.mine)))
        .filter((e) => (seen.has(e.code) ? false : (seen.add(e.code), true)));
      return list.length ? [{ id: `${tab}-${provider}`, tab, group, title: providerLabels[provider], provider, emotes: list }] : [];
    });
  // Ordem: usados com frequência no topo, depois os emotes do Galindo, os meus (de outros canais) e os globais.
  // "Meus emotes" são só os de outros canais; os globais e os do canal que o usuário também tem ficam nas suas seções.
  const mine = emotes.filter((e) => e.mine && !e.source && matches(e));
  // Os de outros canais são agrupados pelo canal dono (como no seletor da Twitch), em ordem alfabética.
  const mineByOwner = new Map<string, PickerEmote[]>();
  for (const e of mine) mineByOwner.set(e.owner ?? "", [...(mineByOwner.get(e.owner ?? "") ?? []), e]);
  const mineSections: Section[] = [...mineByOwner.entries()]
    .map(([owner, list]) => ({ id: `mine-${owner || "outros"}`, tab: "mine" as const, group: "Meus emotes", title: owners[owner]?.name ?? "Outros emotes da Twitch", avatar: owners[owner]?.avatar || undefined, provider: "twitch" as const, emotes: list }))
    .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  const sections: Section[] = [
    ...(recentEmotes.length ? [{ id: "recent", tab: "recent" as const, title: "Utilizado com frequência", emotes: recentEmotes }] : []),
    ...groupSections("channel", "Emotes do Galindo"),
    ...mineSections,
    ...groupSections("global", "Emotes globais"),
  ];

  const tabs: { id: TabId; label: string; icon: ReactNode }[] = [
    { id: "recent", label: "Utilizados com frequência", icon: <ClockIcon /> },
    { id: "channel", label: "Emotes do Galindo", icon: <img src="/assets/logos/galindogamerbr.webp" alt="" className="mc-pk-logo" /> },
    { id: "mine", label: "Meus emotes", icon: <UserIcon /> },
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
      {presentProviders.length > 1 && (
        <div className="mc-pk-filters" role="group" aria-label="Filtrar por plataforma">
          {([null, ...presentProviders] as (Emote["provider"] | null)[]).map((p) => (
            <button type="button" key={p ?? "all"} className="mc-pk-chip" aria-pressed={only === p} onClick={() => setOnly(p)}>
              {p ? providerLabels[p] : "Todos"}
            </button>
          ))}
        </div>
      )}
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
        {hint && <p className="mc-pk-hint" role="status">{hint}</p>}
        {sections.map((s, index) => (
          <div key={s.id} data-tab={index === 0 || sections[index - 1].tab !== s.tab ? s.tab : undefined}>
            {s.group && sections[index - 1]?.group !== s.group && <h3 className="mc-pk-group">{s.group}</h3>}
            <p className="mc-pk-title">
              {s.avatar ? <img className="mc-pk-avatar" src={s.avatar} alt="" referrerPolicy="no-referrer" loading="lazy" /> : s.provider && <PlatformIcon platform={s.provider === "bttv" || s.provider === "ffz" ? "twitch" : s.provider} />}
              {s.title}
            </p>
            <div className="mc-pk-grid">
              {s.emotes.slice(0, 500).map((e) => (
                <button
                  type="button"
                  key={emoteKey(e)}
                  className={e.locked ? "mc-pk-locked" : undefined}
                  aria-label={e.locked ? `${e.code} bloqueado: ${e.locked}` : `Inserir ${e.code}`}
                  aria-disabled={e.locked ? true : undefined}
                  title={e.locked ? `${e.code} · ${e.locked}` : `${e.code} · ${providerLabels[e.provider]}${e.subOnly ? " · só inscritos" : ""}`}
                  onClick={() => (e.locked ? setHint(`${e.code}: ${e.locked}.`) : onSelect(e))}
                >
                  <EmoteImage emote={e} />
                  {e.locked && <LockIcon className="mc-pk-lock" />}
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
