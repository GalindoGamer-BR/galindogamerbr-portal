import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { command, supabase } from "./services";

// Exclusão da conta, compartilhada pela página /conta e pelo modal "Gerenciar conta" da área do membro.
// onDeleting roda antes do signOut local, para quem escuta SIGNED_OUT não redirecionar sem o aviso de exclusão.
export function AccountSettings({ onDeleting }: { onDeleting?: () => void }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false), [confirmation, setConfirmation] = useState("");
  async function remove(event: FormEvent) {
    event.preventDefault();
    if (confirmation !== "EXCLUIR") return;
    setBusy(true); setError("");
    try {
      await command("/api/account", { method: "DELETE", body: JSON.stringify({ confirmation: "EXCLUIR" }) });
      onDeleting?.();
      await supabase!.auth.signOut({ scope: "local" });
      navigate("/login", { replace: true, state: { accountDeleted: true } });
    } catch (err) { setError((err as Error).message); setBusy(false); }
  }
  return <div className="portal-account-danger">
    <h2>Excluir conta</h2>
    <p>Revoga a autorização deste aplicativo no TikTok e apaga seu cadastro e os vínculos salvos no portal. Sua conta TikTok continua existindo.</p>
    {!deleting ? <button disabled={busy} onClick={() => setDeleting(true)}>Excluir minha conta</button> :
      <form onSubmit={remove}>
        <label htmlFor="delete-confirmation">Digite EXCLUIR para confirmar</label>
        <input id="delete-confirmation" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="off" disabled={busy} />
        <button disabled={busy || confirmation !== "EXCLUIR"}>{busy ? "Excluindo…" : "Excluir definitivamente"}</button>
        <button type="button" disabled={busy} onClick={() => { setDeleting(false); setConfirmation(""); }}>Cancelar</button>
      </form>}
    {error && <p role="alert" className="portal-account-error">{error}</p>}
  </div>;
}
