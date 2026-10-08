import { useEffect, useState } from "react";
import { command } from "./services";

type Profile = {
  username: string; fanLevel: number | null; clubName: string | null;
  subscriber: true | null; moderator: true | null; observedAt: string;
};
type Result = { status: string; profile: Profile | null };
export default function MemberActivity() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    void command<Result>("/api/member/activity")
      .then(data => { if (active) setResult(data); })
      .catch(() => { if (active) setError("Não foi possível consultar os dados do TikTok."); });
    return () => { active = false; };
  }, []);
  async function authorize() {
    setBusy(true); setError("");
    try {
      const { url } = await command<{url:string}>("/oauth/tiktok/start?profile=1");
      window.location.assign(url);
    } catch { setError("Não foi possível abrir a autorização do TikTok."); setBusy(false); }
  }
  const p = result?.profile;
  const labels: Record<string,string> = {
    authorization_required: "Autorize a leitura do seu nome de usuário no TikTok para consultar sua participação no canal.",
    awaiting_user: "O TikTok ainda não disponibilizou seus dados nesta live.",
    reader_disconnected: "A conexão com a live do TikTok não está ativa.",
    reader_unavailable: "A consulta da live ainda não está configurada.",
    tiktok_unavailable: "O TikTok não disponibilizou os dados nesta consulta."
  };
  return <section className="member-social" aria-labelledby="channel-activity-title">
    <div><span className="member-eyebrow">Você no canal do Galindo</span><h2 id="channel-activity-title">Seu perfil na live</h2>
      <p>{p ? "@" + p.username : "Dados informados pelo TikTok durante a live."}</p></div>
    {error && <p className="member-error" role="alert">{error}</p>}
    {!result && !error && <p role="status">Consultando TikTok…</p>}
    {result && !p && <p className="member-muted">{labels[result.status] || "O TikTok ainda não retornou seu perfil na live."}</p>}
    {result?.status === "authorization_required" && <button disabled={busy} onClick={() => void authorize()}>Autorizar no TikTok</button>}
    {p && <>
      <dl className="member-social-stats">
        <div><dt>Nível no fã-clube</dt><dd>{p.fanLevel ?? "Não informado"}</dd></div>
        <div><dt>Fã-clube</dt><dd>{p.clubName ?? "Não informado"}</dd></div>
        <div><dt>Assinante do canal</dt><dd>{p.subscriber ? "Sim" : "Não informado"}</dd></div>
        <div><dt>Moderador do canal</dt><dd>{p.moderator ? "Sim" : "Não informado"}</dd></div>
      </dl>
      <p className="member-muted">Dados recebidos do TikTok em {new Date(p.observedAt).toLocaleString("pt-BR")}. Campos ausentes não significam que você não possui esse vínculo.</p>
    </>}
  </section>;
}

