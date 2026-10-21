import type { OnlineMembers as Online } from "./presence";

/** Aba "Membros": quem está logado no chat agora, com a opção de não aparecer na lista. */
export function OnlineMembers({
  online,
  canToggle,
  visible,
  onToggle,
}: {
  online: Online;
  /** Só quem está logado pode escolher aparecer ou não. */
  canToggle: boolean;
  visible: boolean;
  onToggle: (visible: boolean) => void;
}) {
  const hidden = online.count - online.names.length;
  return (
    <section className="mc-members" aria-label="Membros online">
      <h3>
        {online.count} {online.count === 1 ? "membro online" : "membros online"}
      </h3>
      {online.names.length > 0 ? (
        <ul>
          {online.names.map((name) => (
            <li key={name}>{name}</li>
          ))}
          {hidden > 0 && <li className="mc-muted">e mais {hidden}</li>}
        </ul>
      ) : (
        <p className="mc-muted">Ninguém logado no chat agora.</p>
      )}
      {canToggle && (
        <label className="mc-online-toggle">
          <input type="checkbox" checked={visible} onChange={(event) => onToggle(event.target.checked)} /> Aparecer como online
        </label>
      )}
    </section>
  );
}
