import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { command, supabase, PortalSessionRequired } from "./services";
import { tiktokLinking } from "./flags";
import "./member.css";

type Member = { name: string; avatarUrl: string | null; memberSince: string; connectedAccounts: number; profileUpdatedAt: string | null; tiktokConnected: boolean };
const date = (value: string) => new Date(value).toLocaleDateString("pt-BR");
export default function PortalMember() {
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false), [avatarFailed, setAvatarFailed] = useState(false);
  useEffect(() => {
    if (!supabase) { setError("O acesso à comunidade ainda não está configurado."); return; }
    let active = true;
    void (async () => {
      const profile = await command<Member>("/api/member");
      if (active) setMember(profile);
    })().catch(err => {
      if (!active) return;
      if (err instanceof PortalSessionRequired) navigate("/login", { replace: true });
      else setError(err instanceof Error ? err.message : "Não foi possível carregar seu perfil.");
    });
    const { data } = supabase.auth.onAuthStateChange(event => { if (active && event === "SIGNED_OUT") navigate("/login", { replace: true }); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [navigate]);
  async function reconnect() {
    setBusy(true); setError("");
    try { const { url } = await command<{ url: string }>("/oauth/tiktok/start"); window.location.assign(url); }
    catch (err) { setError((err as Error).message); setBusy(false); }
  }
  async function logout() {
    setBusy(true);
    const result = await supabase!.auth.signOut();
    if (result.error) { setError("Não foi possível sair. Tente novamente."); setBusy(false); }
    else navigate("/login", { replace: true });
  }
  return <section className="member-page">
    <div className="member-topline"><Link to="/">← Início</Link><span>Comunidade GalindoGamerBR</span></div>
    {error && <p className="member-error" role="alert">{error}</p>}
    {!member ? !error && <p role="status">Carregando seu espaço…</p> : <>
      <header className="member-hero">
        <div className="member-identity">
          <div className="member-avatar">{member.avatarUrl && !avatarFailed ? <img src={member.avatarUrl} alt={`Foto de ${member.name}`} referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} /> : <span aria-label="Foto indisponível">{member.name.slice(0, 1).toUpperCase()}</span>}</div>
          <div><span className="member-eyebrow">Seu lugar na comunidade</span><h1>Olá, {member.name}.</h1><p>Bem-vindo à sua área de membro.</p><span className="member-badge">{member.tiktokConnected ? "TikTok vinculado" : "Perfil da comunidade"}</span></div>
        </div>
        <div className="member-actions">{tiktokLinking && <button disabled={busy} onClick={() => void reconnect()}>Atualizar foto e nome</button>}<Link to="/conta" className="member-button">Gerenciar conta</Link><button disabled={busy} onClick={() => void logout()}>Sair</button></div>
      </header>
      <p className="member-since">Na comunidade desde {date(member.memberSince)}.</p>
      <div className="member-section-title"><div><span className="member-eyebrow">O que vem por aí</span><h2>Uma comunidade feita com você.</h2></div><span className="member-preview">Recursos futuros</span></div>
      <div className="member-content-grid">
        <article><span className="member-card-number">01 / PARTICIPE</span><h3>Seu voto faz parte.</h3><p>Futuramente, você poderá votar nos próximos conteúdos do canal.</p><span className="member-coming">Votações · Em breve</span></article>
        <article><span className="member-card-number">02 / DESCUBRA</span><h3>Conteúdos para membros.</h3><p>Este será o espaço para encontrar os conteúdos da comunidade.</p><span className="member-coming">Conteúdos · Em breve</span></article>
        <article><span className="member-card-number">03 / ACOMPANHE</span><h3>As novidades, por aqui.</h3><p>Futuramente, avisos e novidades do canal estarão reunidos aqui.</p><span className="member-coming">Feed · Em breve</span></article>
      </div>
    </>}
  </section>;
}
