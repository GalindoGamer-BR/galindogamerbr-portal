import { useState, type FormEvent } from "react";
import { command } from "./services";
import { PlatformIcon } from "./PlatformIcon";
import { GoogleIcon } from "./GoogleIcon";
import { googleLogin, tiktokLinking } from "./flags";
import { rememberReturnTo, startGoogleLogin, startTikTokLogin, startTwitchLogin } from "./loginFlows";
import { rememberMergeClaim } from "./mergeFlow";
import { labels, type Platform } from "./types";

type Step = "intro" | "self" | "other" | "otherCode" | "confirm" | "done";
type Summary = { email: string | null; logins: string[]; platforms: { provider: string; username: string }[] };

const loginNames: Record<string, string> = { email: "e-mail", twitch: "Twitch", google: "Google", tiktok: "TikTok" };
const loginName = (provider: string) => loginNames[provider] ?? provider;
const platformName = (provider: string) => labels[provider as Platform] ?? provider;

// Une outra conta do portal a esta, mesmo com e-mail e provedores diferentes. Duas provas: um código no e-mail desta conta e
// a prova da outra (código no e-mail dela ou entrando nela). A outra conta é a que deixa de existir.
export function MergeAccounts({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>("intro");
  const [mergeId, setMergeId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otherEmail, setOtherEmail] = useState("");
  const [code, setCode] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError("");
    try { await action(); } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  const post = <T,>(path: string, body: object) => command<T>(`/api/account/merge/${path}`, { method: "POST", body: JSON.stringify(body) });
  const digits = (value: string) => value.replace(/[^0-9]/g, "");

  const start = () => run(async () => {
    const result = await post<{ mergeId: string; email: string }>("start", {});
    setMergeId(result.mergeId); setMaskedEmail(result.email); setCode(""); setStep("self");
  });
  const verifySelf = (event: FormEvent) => { event.preventDefault(); void run(async () => { await post("verify-self", { mergeId, code }); setCode(""); setStep("other"); }); };
  const sendOtherCode = (event: FormEvent) => { event.preventDefault(); void run(async () => { await post("other/email", { mergeId, email: otherEmail }); setCode(""); setStep("otherCode"); }); };
  const confirmOther = (event: FormEvent) => { event.preventDefault(); void run(async () => { setSummary(await post<Summary>("other/confirm", { mergeId, code })); setCode(""); setStep("confirm"); }); };
  const execute = (event: FormEvent) => { event.preventDefault(); void run(async () => { await post("execute", { mergeId, confirmation }); setStep("done"); }); };
  // Entrar na outra conta sai da página (OAuth); o /login conclui a mesclagem com o token guardado.
  const viaLogin = (login: () => Promise<void>) => run(async () => {
    const { claimToken } = await post<{ claimToken: string }>("other/link", { mergeId });
    rememberMergeClaim(claimToken);
    rememberReturnTo("/membro");
    await login();
  });

  return <div className="portal-account-card" style={{ display: "grid", gap: 14 }}>
    <span className="portal-account-eyebrow">Sua conta</span>
    <h1>Mesclar contas</h1>
    {step === "intro" && <>
      <p>Une outra conta sua a esta, mesmo com e-mail ou login diferentes (por exemplo, uma conta criada com Google e outra com Twitch). Os vínculos de chat e os logins da outra conta passam para esta, e o e-mail dela vira um e-mail secundário.</p>
      <p role="note"><strong>A outra conta será excluída e isso não pode ser desfeito.</strong> Antes, vamos confirmar que você controla as duas.</p>
      <button className="portal-account-primary" disabled={busy} onClick={() => void start()}>{busy ? "Aguarde…" : "Começar"}</button>
    </>}
    {step === "self" && <form onSubmit={verifySelf}>
      <p role="status">Enviamos um código para {maskedEmail}, o e-mail desta conta. Ele expira em alguns minutos.</p>
      <label htmlFor="merge-self-code">Código</label>
      <input id="merge-self-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10} required value={code} disabled={busy} onChange={event => setCode(digits(event.target.value))} />
      <button className="portal-account-primary" disabled={busy}>{busy ? "Aguarde…" : "Confirmar"}</button>
    </form>}
    {step === "other" && <>
      <p>Agora prove que a outra conta também é sua. Escolha como:</p>
      <button className="portal-twitch-login" disabled={busy} onClick={() => void viaLogin(startTwitchLogin)}><PlatformIcon platform="twitch" />Entrar na conta Twitch</button>
      {googleLogin && <button className="portal-google-login" disabled={busy} onClick={() => void viaLogin(startGoogleLogin)}><GoogleIcon />Entrar na conta Google</button>}
      {tiktokLinking && <button className="portal-tiktok-login" disabled={busy} onClick={() => void viaLogin(startTikTokLogin)}><PlatformIcon platform="tiktok" />Entrar na conta TikTok</button>}
      <p>ou receba um código no e-mail da outra conta</p>
      <form onSubmit={sendOtherCode}>
        <label htmlFor="merge-other-email">E-mail da outra conta</label>
        <input id="merge-other-email" type="email" autoComplete="off" required maxLength={254} value={otherEmail} disabled={busy} onChange={event => setOtherEmail(event.target.value)} />
        <button className="portal-account-primary" disabled={busy}>{busy ? "Aguarde…" : "Enviar código"}</button>
      </form>
    </>}
    {step === "otherCode" && <form onSubmit={confirmOther}>
      <p role="status">Se existir uma conta com {otherEmail}, enviamos um código para esse e-mail.</p>
      <label htmlFor="merge-other-code">Código</label>
      <input id="merge-other-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10} required value={code} disabled={busy} onChange={event => setCode(digits(event.target.value))} />
      <button className="portal-account-primary" disabled={busy}>{busy ? "Aguarde…" : "Confirmar"}</button>
      <button type="button" disabled={busy} onClick={() => { setStep("other"); setCode(""); setError(""); }}>Voltar</button>
    </form>}
    {step === "confirm" && summary && <form onSubmit={execute}>
      <p>Esta conta será unida a você e depois excluída:</p>
      <ul>
        {summary.email && <li>E-mail: {summary.email}</li>}
        {summary.logins.length > 0 && <li>Logins que passam para esta conta: {summary.logins.filter(login => login !== "email").map(loginName).join(", ") || "nenhum além do e-mail"}</li>}
        {summary.platforms.map(item => <li key={item.provider}>{platformName(item.provider)}: {item.username}</li>)}
      </ul>
      <p role="note"><strong>Não há como desfazer.</strong> Digite MESCLAR para confirmar.</p>
      <label htmlFor="merge-confirmation">Confirmação</label>
      <input id="merge-confirmation" autoComplete="off" value={confirmation} disabled={busy} onChange={event => setConfirmation(event.target.value)} />
      <button className="portal-account-primary" disabled={busy || confirmation !== "MESCLAR"}>{busy ? "Aguarde…" : "Mesclar contas"}</button>
    </form>}
    {step === "done" && <>
      <p role="status">Contas mescladas. Os vínculos e logins da outra conta agora fazem parte desta, e o e-mail dela passou para a lista de e-mails secundários (em Logins e e-mails): você pode entrar por ele.</p>
      <button className="portal-account-primary" onClick={onDone}>Concluir</button>
    </>}
    {error && <p className="portal-account-error" role="alert">{error}</p>}
  </div>;
}
