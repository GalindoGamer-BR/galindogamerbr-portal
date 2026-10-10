import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { command, supabase } from "./services";
import { BackIcon } from "../../components/ui/Icons";
import "./member.css";
import "./account.css";

export default function PortalAccount() {
  const navigate = useNavigate();
  const accountDeleted = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false), [confirmation, setConfirmation] = useState("");
  useEffect(() => {
    if (!supabase) { setError("O login ainda não está configurado."); return; }
    let active = true;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) { navigate("/login", { replace: true }); return; }
      setUser(data.user);
    }).catch(() => { if (active) setError("Não foi possível carregar a conta."); });
    const { data } = supabase.auth.onAuthStateChange((event) => { if (event === "SIGNED_OUT" && active && !accountDeleted.current) navigate("/login", { replace: true }); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [navigate]);
  async function logout() {
    setBusy(true); setError("");
    const { error } = await supabase!.auth.signOut();
    if (error) { setError("Não foi possível sair. Tente novamente."); setBusy(false); }
    else navigate("/login", { replace: true });
  }
  async function remove(event: FormEvent) {
    event.preventDefault();
    if (confirmation !== "EXCLUIR") return;
    setBusy(true); setError("");
    try {
      await command("/api/account", { method: "DELETE", body: JSON.stringify({ confirmation: "EXCLUIR" }) });
      accountDeleted.current = true;
      await supabase!.auth.signOut({ scope: "local" });
      navigate("/login", { replace: true, state: { accountDeleted: true } });
    } catch (err) { setError((err as Error).message); setBusy(false); }
  }
  return <main className="portal-account"><section className="portal-account-card">
    <span className="portal-account-eyebrow">Comunidade GalindoGamerBR</span>
    <h1>Minha conta</h1>
    {user ? <>
      <button disabled={busy} onClick={() => void logout()}>Sair da conta</button>
      <Link to="/membro"><BackIcon /> Voltar à área do membro</Link>
      <div className="portal-account-danger"><h2>Excluir conta</h2><p>Revoga a autorização deste aplicativo no TikTok e apaga seu cadastro e os vínculos salvos no portal. Sua conta TikTok continua existindo.</p>
      {!deleting ? <button disabled={busy} onClick={() => setDeleting(true)}>Excluir minha conta</button> :
      <form onSubmit={remove}><label htmlFor="delete-confirmation">Digite EXCLUIR para confirmar</label><input id="delete-confirmation" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="off" disabled={busy}/><button disabled={busy || confirmation !== "EXCLUIR"}>{busy ? "Excluindo…" : "Excluir definitivamente"}</button><button type="button" disabled={busy} onClick={() => { setDeleting(false); setConfirmation(""); }}>Cancelar</button></form>}</div>
    </> : !error && <p>Carregando…</p>}
    {error && <p role="alert" className="portal-account-error">{error}</p>}
  </section></main>;
}
