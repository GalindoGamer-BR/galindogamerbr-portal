import { useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { configured, publicCommand, supabase } from "./services";

// Login por código de e-mail, compartilhado pela página /login e pelo modal da navbar. O código passa pelo auth-service: ele
// serve tanto o e-mail principal (código do Supabase) quanto os e-mails secundários da conta (mesclagem), e responde igual
// para qualquer endereço, exista conta ou não. Só contas já existentes recebem código.
export default function EmailLogin({ onSignedIn, onBusy }: { onSignedIn: (user: User) => void; onBusy?: (busy: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function working(value: boolean) { setBusy(value); onBusy?.(value); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !supabase) return;
    working(true); setError("");
    try {
      if (!sent) {
        await publicCommand("/api/account/login/start", { email: email.trim() });
        setSent(true);
      } else {
        const result = await publicCommand<{ session: { access_token: string; refresh_token: string } }>("/api/account/login/verify", { email: email.trim(), code: code.trim() });
        const { data, error: failure } = await supabase.auth.setSession(result.session);
        if (failure || !data.user) throw new Error("Código inválido ou expirado.");
        onSignedIn(data.user);
      }
    } catch (err) { setError((err as Error).message); }
    finally { working(false); }
  }
  return <>
    <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      <label htmlFor="login-email">E-mail</label>
      <input id="login-email" type="email" autoComplete="email" required maxLength={254} placeholder="seu@email.com" value={email} disabled={busy || sent || !configured} onChange={event => setEmail(event.target.value)} />
      {sent && <><p role="status">Se este e-mail tiver uma conta, enviamos um código de acesso.</p><label htmlFor="login-email-code">Código recebido por e-mail</label><input id="login-email-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10} required value={code} disabled={busy} onChange={event => setCode(event.target.value.replace(/[^0-9]/g, ""))} /></>}
      <button className="portal-account-primary" disabled={busy || !configured}>{busy ? "Aguarde…" : sent ? "Confirmar e entrar" : "Entrar com e-mail"}</button>
      {sent && <button type="button" disabled={busy} onClick={() => { setSent(false); setCode(""); setError(""); }}>Alterar e-mail ou reenviar código</button>}
    </form>
    {error && <p role="alert" className="portal-account-error">{error}</p>}
  </>;
}
