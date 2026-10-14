import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./services";
import { BackIcon } from "../../components/ui/Icons";
import { AccountSettings } from "./AccountSettings";
import "./member.css";
import "./account.css";

export default function PortalAccount() {
  const navigate = useNavigate();
  const accountDeleted = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
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
  return <main className="portal-account"><section className="portal-account-card">
    <span className="portal-account-eyebrow">Comunidade GalindoGamerBR</span>
    <h1>Minha conta</h1>
    {user ? <>
      <button disabled={busy} onClick={() => void logout()}>Sair da conta</button>
      <Link to="/membro"><BackIcon /> Voltar à área do membro</Link>
      <AccountSettings onDeleting={() => { accountDeleted.current = true; }} />
    </> : !error && <p>Carregando…</p>}
    {error && <p role="alert" className="portal-account-error">{error}</p>}
  </section></main>;
}
