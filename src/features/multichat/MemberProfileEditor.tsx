import { useRef, useState, type FormEvent } from "react";
import { command } from "./services";

type Props = { name: string; avatarUrl: string | null; customized: { name: boolean; avatar: boolean }; onChange: () => void };

// Reduz a foto para 256x256 (recorte central) antes do envio: o servidor só valida o tipo e o tamanho.
async function resize(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const size = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  canvas.getContext("2d")!.drawImage(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2, size, size, 0, 0, 256, 256);
  bitmap.close();
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", 0.88));
  if (!blob) throw new Error("Não foi possível processar a imagem.");
  return blob;
}

export function MemberProfileEditor({ name, avatarUrl, customized, onChange }: Props) {
  const [value, setValue] = useState(name), [busy, setBusy] = useState(false), [error, setError] = useState(""), [ok, setOk] = useState("");
  const input = useRef<HTMLInputElement>(null);
  async function run(task: () => Promise<void>, done: string) {
    setBusy(true); setError(""); setOk("");
    try { await task(); setOk(done); onChange(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  const saveName = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => { await command("/api/member", { method: "PUT", body: JSON.stringify({ name: value }) }); }, "Nome atualizado.");
  };
  const pick = (file?: File) => {
    if (!file) return;
    void run(async () => {
      if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
      await command("/api/member/avatar", { method: "POST", headers: { "Content-Type": "image/webp" }, body: await resize(file) });
    }, "Foto atualizada.");
  };
  return <section className="member-card member-edit" aria-label="Editar perfil">
    <h2>Editar perfil</h2>
    <form onSubmit={saveName} className="member-edit-row">
      <label htmlFor="member-name">Nome de exibição</label>
      <input id="member-name" value={value} onChange={e => setValue(e.target.value)} minLength={2} maxLength={24} required disabled={busy} autoComplete="off" />
      <button disabled={busy || value.trim() === name}>Salvar nome</button>
      {customized.name && <button type="button" disabled={busy} onClick={() => void run(async () => { await command("/api/member", { method: "PUT", body: JSON.stringify({ name: null }) }); }, "Voltou ao nome da sua conta.")}>Usar nome da conta</button>}
    </form>
    <div className="member-edit-row">
      {avatarUrl ? <img className="member-edit-avatar" src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : <span>Foto</span>}
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      <button disabled={busy} onClick={() => input.current?.click()}>Enviar foto</button>
      {customized.avatar && <button disabled={busy} onClick={() => void run(async () => { await command("/api/member/avatar", { method: "DELETE" }); }, "Foto removida.")}>Remover foto</button>}
    </div>
    {error && <p role="alert" className="member-error">{error}</p>}
    {ok && <p role="status" className="member-ok">{ok}</p>}
  </section>;
}
