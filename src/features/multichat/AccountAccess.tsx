import { useCallback, useEffect, useState, type FormEvent } from "react";
import { command } from "./services";
import { PlatformIcon } from "./PlatformIcon";
import { GoogleIcon } from "./GoogleIcon";

type Login = { provider: "twitch" | "google" | "tiktok"; detail?: string };
type Logins = { logins: Login[]; removable: boolean };
type Emails = { primary: string | null; secondary: { email: string; createdAt: string }[] };

const names = { twitch: "Twitch", google: "Google", tiktok: "TikTok" } as const;
const date = (value: string) => new Date(value).toLocaleDateString("pt-BR");
const LoginIcon = ({ provider }: { provider: Login["provider"] }) => provider === "google" ? <GoogleIcon /> : <PlatformIcon platform={provider} />;

// Como a pessoa entra na conta: logins principais (Twitch, Google, TikTok) e e-mails. Com mais de um login principal dá para
// remover um, e a autorização dele é revogada na plataforma; com um só, a conta só sai por Excluir conta. Os e-mails secundários
// entram aqui pela mesclagem de contas ou por código enviado ao endereço.
export function AccountAccess() {
  const [logins, setLogins] = useState<Logins | null>(null);
  const [emails, setEmails] = useState<Emails | null>(null);
  const [removing, setRemoving] = useState<Login["provider"] | null>(null);
  const [newEmail, setNewEmail] = useState(""), [code, setCode] = useState(""), [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const [loginData, emailData] = await Promise.all([command<Logins>("/api/account/logins"), command<Emails>("/api/account/emails")]);
    setLogins(loginData); setEmails(emailData);
  }, []);
  useEffect(() => { void load().catch(() => setError("Não foi possível carregar seus logins e e-mails.")); }, [load]);

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try { await action(); } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  const post = (path: string, body: object) => command(`/api/account/emails/${path}`, { method: "POST", body: JSON.stringify(body) });

  const removeLogin = (provider: Login["provider"]) => run(async () => {
    const result = await command<{ removed: boolean; revoked: boolean }>(`/api/account/logins/${provider}`, { method: "DELETE" });
    setRemoving(null);
    setNotice(result.revoked
      ? `Login com ${names[provider]} removido e autorização revogada na plataforma.`
      : provider === "google"
        ? "Login com Google removido. Para revogar a autorização, abra myaccount.google.com/permissions e remova o GalindoGamerBR."
        : `Login com ${names[provider]} removido.`);
    await load();
  });
  const sendCode = (event: FormEvent) => { event.preventDefault(); void run(async () => { await post("add", { email: newEmail.trim() }); setSent(true); setCode(""); }); };
  const confirmCode = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => { await post("confirm", { email: newEmail.trim(), code }); setSent(false); setNewEmail(""); setCode(""); setNotice("E-mail adicionado. Agora você também entra por ele."); await load(); });
  };
  const removeEmail = (email: string) => run(async () => { await post("remove", { email }); setNotice("E-mail removido."); await load(); });

  return <section className="member-accounts-body member-access" aria-label="Logins e e-mails">
    <h3>Logins principais</h3>
    <ul className="member-accounts">
      {logins?.logins.map(item => <li key={item.provider}>
        <span className={`member-account-icon member-account-${item.provider}`}><LoginIcon provider={item.provider} /></span>
        <div className="member-account-info"><strong>{names[item.provider]}</strong>{item.detail && <small><span>{item.detail}</span></small>}</div>
        <div className="member-account-status">
          {logins.removable
            ? removing === item.provider
              ? <><button disabled={busy} onClick={() => void removeLogin(item.provider)}>{busy ? "Aguarde…" : "Confirmar remoção"}</button><button disabled={busy} onClick={() => setRemoving(null)}>Cancelar</button></>
              : <button disabled={busy} onClick={() => { setRemoving(item.provider); setError(""); setNotice(""); }}>Remover</button>
            : <em className="member-tag member-tag-fixed">Único login</em>}
        </div>
        {removing === item.provider && <p role="note">Remove este login e revoga a autorização na plataforma. Você continua entrando pelos outros logins.</p>}
      </li>)}
      {!logins && !error && <li><div className="member-account-info"><small>Carregando…</small></div></li>}
    </ul>
    {logins && !logins.removable && <p role="note">Com um login principal só, a conta não pode ficar sem ele. Para sair do portal, use Excluir conta.</p>}

    <h3>E-mails</h3>
    <ul className="member-accounts member-emails">
      <li><div className="member-account-info"><strong>Principal</strong><small><span>{emails ? emails.primary ?? "ainda não confirmado" : "Carregando…"}</span></small></div></li>
      {emails?.secondary.map(item => <li key={item.email}>
        <div className="member-account-info"><strong>Secundário</strong><small><span>{`${item.email} · desde ${date(item.createdAt)}`}</span></small></div>
        <div className="member-account-status"><button disabled={busy} onClick={() => void removeEmail(item.email)}>Remover</button></div>
      </li>)}
    </ul>
    {emails && emails.primary && (!sent
      ? <form onSubmit={sendCode}>
          <label htmlFor="account-new-email">Adicionar e-mail secundário</label>
          <input id="account-new-email" type="email" autoComplete="off" required maxLength={254} value={newEmail} disabled={busy} onChange={event => setNewEmail(event.target.value)} />
          <button disabled={busy}>{busy ? "Aguarde…" : "Enviar código"}</button>
        </form>
      : <form onSubmit={confirmCode}>
          <p role="status">Se o endereço puder ser adicionado, enviamos um código para {newEmail}. Ele vale 5 minutos.</p>
          <label htmlFor="account-email-code">Código</label>
          <input id="account-email-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10} required value={code} disabled={busy} onChange={event => setCode(event.target.value.replace(/[^0-9]/g, ""))} />
          <button disabled={busy}>{busy ? "Aguarde…" : "Confirmar"}</button>
          <button type="button" disabled={busy} onClick={() => { setSent(false); setCode(""); setError(""); }}>Voltar</button>
        </form>)}
    <p role="note">Você pode entrar por qualquer um dos seus e-mails. Contas mescladas passam o e-mail antigo para esta lista.</p>
    {notice && <p role="status" className="member-ok">{notice}</p>}
    {error && <p role="alert" className="member-error">{error}</p>}
  </section>;
}
