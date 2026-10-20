import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { command, supabase, PortalSessionRequired } from "./services";
import { tiktokLinking } from "./flags";
import { MemberProfileEditor } from "./MemberProfileEditor";
import { MemberAccounts } from "./MemberAccounts";
import { AccountSettings } from "./AccountSettings";
import { MergeAccounts } from "./MergeAccounts";
import { AccountAccess } from "./AccountAccess";
import { CameraIcon } from "../../components/ui/Icons";
import "./member.css";
import "./account.css";

type Member = { tiktokName?: string | null; name: string; avatarUrl: string | null; isAdmin?: boolean; customized?: { name: boolean; avatar: boolean }; memberSince: string; connectedAccounts: number; profileUpdatedAt: string | null; tiktokConnected: boolean };
const date = (value: string) => new Date(value).toLocaleDateString("pt-BR");
export default function PortalMember() {
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null), [reload, setReload] = useState(0), [editing, setEditing] = useState(false), [managing, setManaging] = useState(false), [merging, setMerging] = useState(false), [actionsOpen, setActionsOpen] = useState(false), [photoMenuOpen, setPhotoMenuOpen] = useState(false), [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false), [avatarFailed, setAvatarFailed] = useState(false);
  // Abre a seção ao voltar do OAuth de vínculo (?linked / ?oauth_error), para mostrar o resultado.
  const [accessOpen, setAccessOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(() => { const query = new URLSearchParams(window.location.search); return query.has("linked") || query.has("oauth_error"); });
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
  }, [navigate, reload]);
  async function reconnect() {
    setBusy(true); setError("");
    try { const { url } = await command<{ url: string }>("/oauth/tiktok/start"); window.location.assign(url); }
    catch (err) { setError((err as Error).message); setBusy(false); }
  }
  const actionsRef = useRef<HTMLDivElement>(null);
  const photoMenuRef = useRef<HTMLDivElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!photoMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => { if (!photoMenuRef.current?.contains(event.target as Node)) setPhotoMenuOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setPhotoMenuOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [photoMenuOpen]);
  useEffect(() => {
    if (!actionsOpen) return;
    const onPointerDown = (event: PointerEvent) => { if (!actionsRef.current?.contains(event.target as Node)) setActionsOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setActionsOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [actionsOpen]);
  function pickPhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Escolha um arquivo de imagem."); return; }
    setError(""); setPhotoFile(file);
  }
  async function removePhoto() {
    setBusy(true); setError("");
    try { await command("/api/member/avatar", { method: "DELETE" }); setAvatarFailed(false); setReload(n => n + 1); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  const onProfileChange = () => { setAvatarFailed(false); setReload(n => n + 1); window.dispatchEvent(new Event("portal:profile-updated")); };
  const modal = (label: string, close: () => void, children: ReactNode, extraClass = "") => <div className="member-modal" role="dialog" aria-modal="true" aria-label={label} onClick={close} onKeyDown={event => { if (event.key === "Escape") close(); }}>
    <div className={`member-modal-card ${extraClass}`.trim()} onClick={event => event.stopPropagation()}>
      {children}
      <button className="member-modal-close" onClick={close} autoFocus>Fechar</button>
    </div>
  </div>;
  return <section className="member-page">
    {error && <p className="member-error" role="alert">{error}</p>}
    {!member ? !error && <p role="status">Carregando seu espaço…</p> : <>
      <header className="member-hero">
        <div className="member-identity">
          <div ref={photoMenuRef} className="member-photo"><button type="button" className="member-avatar-edit" disabled={busy} aria-haspopup="menu" aria-expanded={photoMenuOpen} onClick={() => setPhotoMenuOpen(open => !open)} aria-label="Opções da foto" title="Opções da foto">
            <span className="member-avatar">{member.avatarUrl && !avatarFailed ? <img src={member.avatarUrl} alt={`Foto de ${member.name}`} referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} /> : <span aria-label="Foto indisponível">{member.name.slice(0, 1).toUpperCase()}</span>}</span>
            <span className="member-avatar-overlay" aria-hidden="true"><CameraIcon className="member-camera" /></span>
          </button>
          {photoMenuOpen && <div role="menu" className="member-menu-list member-photo-menu">
            <button role="menuitem" type="button" onClick={() => { setPhotoMenuOpen(false); photoInput.current?.click(); }}>Enviar foto</button>
            {member.customized?.avatar && <button role="menuitem" type="button" className="member-menu-danger" onClick={() => { setPhotoMenuOpen(false); void removePhoto(); }}>Remover foto</button>}
          </div>}
          </div>
          <input ref={photoInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={event => { pickPhoto(event.target.files?.[0]); event.target.value = ""; }} />
          <div><span className="member-eyebrow">Seu lugar na comunidade</span><h1>Olá, {member.name}.</h1><p>Bem-vindo à sua área de membro.</p><span className="member-badge">{member.tiktokConnected ? "TikTok vinculado" : "Perfil da comunidade"}</span>{member.isAdmin && <span className="member-badge member-badge-admin">Admin</span>}</div>
        </div>
        <div className="member-actions">
          {tiktokLinking && <button disabled={busy} onClick={() => void reconnect()}>Atualizar foto e nome</button>}
          <div ref={actionsRef} className="member-menu">
            <button type="button" disabled={busy} aria-haspopup="menu" aria-expanded={actionsOpen} onClick={() => setActionsOpen(open => !open)}>Ações <span aria-hidden="true" className="member-menu-caret">▾</span></button>
            {actionsOpen && <div role="menu" className="member-menu-list">
              <button role="menuitem" type="button" onClick={() => { setActionsOpen(false); setEditing(true); }}>Mudar nome de exibição</button>
              <button role="menuitem" type="button" onClick={() => { setActionsOpen(false); setMerging(true); }}>Mesclar outra conta</button>
              <button role="menuitem" type="button" className="member-menu-danger" onClick={() => { setActionsOpen(false); setManaging(true); }}>Excluir conta</button>
            </div>}
          </div>
        </div>
      </header>
      <p className="member-since">Na comunidade desde {date(member.memberSince)}.</p>
      <details className="member-dropdown" open={accountsOpen} onToggle={event => setAccountsOpen(event.currentTarget.open)}>
        <summary><span><strong>Contas conectadas</strong><small>Contas usadas para enviar mensagens ao chat</small></span></summary>
        <MemberAccounts tiktokLogin={member.tiktokName} isAdmin={member.isAdmin} />
      </details>
      <details className="member-dropdown" open={accessOpen} onToggle={event => setAccessOpen(event.currentTarget.open)}>
        <summary><span><strong>Logins e e-mails</strong><small>Como você entra na sua conta</small></span></summary>
        {accessOpen && <AccountAccess />}
      </details>
      {editing && modal("Mudar nome de exibição", () => setEditing(false), <MemberProfileEditor key={member.name} mode="name" name={member.name} customized={member.customized ?? { name: false, avatar: false }} onChange={onProfileChange} />)}
      {photoFile && modal("Trocar foto", () => setPhotoFile(null), <MemberProfileEditor mode="avatar" name={member.name} initialFile={photoFile} customized={member.customized ?? { name: false, avatar: false }} onChange={onProfileChange} onDone={() => setPhotoFile(null)} />)}
      {merging && modal("Mesclar contas", () => setMerging(false), <MergeAccounts onDone={() => { setMerging(false); setReload(n => n + 1); window.dispatchEvent(new Event("portal:profile-updated")); }} />, "portal-account-card")}
      {managing && modal("Excluir conta", () => setManaging(false), <AccountSettings />, "portal-account-card")}
      <div className="member-section-title"><div><span className="member-eyebrow">O que vem por aí</span><h2>Uma comunidade feita com você.</h2></div><span className="member-preview">Recursos futuros</span></div>
      <div className="member-content-grid">
        <article><span className="member-card-number">01 / PARTICIPE</span><h3>Seu voto faz parte.</h3><p>Futuramente, você poderá votar nos próximos conteúdos do canal.</p><span className="member-coming">Votações · Em breve</span></article>
        <article><span className="member-card-number">02 / DESCUBRA</span><h3>Conteúdos para membros.</h3><p>Este será o espaço para encontrar os conteúdos da comunidade.</p><span className="member-coming">Conteúdos · Em breve</span></article>
        <article><span className="member-card-number">03 / ACOMPANHE</span><h3>As novidades, por aqui.</h3><p>Futuramente, avisos e novidades do canal estarão reunidos aqui.</p><span className="member-coming">Feed · Em breve</span></article>
      </div>
    </>}
  </section>;
}
