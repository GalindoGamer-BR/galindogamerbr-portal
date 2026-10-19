import type { OnlineMembers as Online } from "./presence";

/** Membros logados que estão no chat agora, com a opção de não aparecer na lista. */
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
  if (!online.count && !canToggle) return null;
  const hidden = online.count - online.names.length;
  return (
    <details className="mc-online">
      <summary>
        {online.count} {online.count === 1 ? "membro online" : "membros online"}
      </summary>
      {online.names.length > 0 && (
        <ul>
          {online.names.map((name) => (
            <li key={name}>{name}</li>
          ))}
          {hidden > 0 && <li className="mc-muted">e mais {hidden}</li>}
        </ul>
      )}
      {canToggle && (
        <label className="mc-online-toggle">
          <input type="checkbox" checked={visible} onChange={(event) => onToggle(event.target.checked)} /> Aparecer como online
        </label>
      )}
    </details>
  );
}
