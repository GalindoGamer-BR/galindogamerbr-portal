import { useState, type FormEvent } from "react";
import { command, supabase } from "./services";

export default function MemberEmail({ onComplete }: { onComplete: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      if (!sent) {
        await command("/api/account/email", { method: "POST", body: JSON.stringify({ email }) });
        setSent(true);
      } else {
        const result = await command<{ session: { access_token: string; refresh_token: string } }>("/api/account/email/confirm", {
          method: "POST", body: JSON.stringify({ email, code })
        });
        const saved = await supabase!.auth.setSession(result.session);
        if (saved.error) throw saved.error;
        onComplete();
      }
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  return <>
    <h1>Confirme seu e-mail</h1>
    <p>O TikTok não informa seu e-mail. Confirme o endereço para identificar seu cadastro. Se já existir uma conta com esse e-mail, seus vínculos serão unidos após a confirmação.</p>
    <form onSubmit={submit}>
      <label htmlFor="member-email">E-mail</label>
      <input id="member-email" type="email" autoComplete="email" required maxLength={254} value={email} disabled={busy || sent} onChange={event => setEmail(event.target.value)} />
      {sent && <><p role="status">Enviamos um código para {email}. Ele expira em 5 minutos.</p><label htmlFor="member-email-code">Código de confirmação</label><input id="member-email-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10} required value={code} disabled={busy} onChange={event => setCode(event.target.value.replace(/[^0-9]/g, ""))} /></>}
      <button className="portal-account-primary" disabled={busy}>{busy ? "Aguarde…" : sent ? "Confirmar e continuar" : "Enviar código"}</button>
      {sent && <button type="button" disabled={busy} onClick={() => { setSent(false); setCode(""); setError(""); }}>Alterar e-mail ou reenviar código</button>}
    </form>
    {error && <p className="portal-account-error" role="alert">{error}</p>}
  </>;
}
