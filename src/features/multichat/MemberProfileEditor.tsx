import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react";
import { command } from "./services";

type Props = { name: string; avatarUrl: string | null; customized: { name: boolean; avatar: boolean }; onChange: () => void };

const PREVIEW = 256;

// Pré-visualização circular com zoom e arraste: o recorte mostrado é exatamente o que é enviado (256x256, WebP).
function AvatarCropper({ file, busy, onCancel, onConfirm }: { file: File; busy: boolean; onCancel: () => void; onConfirm: (blob: Blob) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    createImageBitmap(file).then(
      image => { if (active) { setBitmap(image); setCenter({ x: image.width / 2, y: image.height / 2 }); } else image.close(); },
      () => { if (active) setFailed(true); },
    );
    return () => { active = false; };
  }, [file]);
  useEffect(() => () => bitmap?.close(), [bitmap]);

  const side = bitmap ? Math.min(bitmap.width, bitmap.height) / zoom : 0;
  const clamp = (point: { x: number; y: number }) => bitmap
    ? { x: Math.min(Math.max(point.x, side / 2), bitmap.width - side / 2), y: Math.min(Math.max(point.y, side / 2), bitmap.height - side / 2) }
    : point;
  const at = clamp(center);

  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context || !bitmap) return;
    context.clearRect(0, 0, PREVIEW, PREVIEW);
    context.drawImage(bitmap, at.x - side / 2, at.y - side / 2, side, side, 0, 0, PREVIEW, PREVIEW);
  }, [bitmap, at.x, at.y, side]);

  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current || !bitmap) return;
    const scale = side / PREVIEW;
    const dx = (event.clientX - drag.current.x) * scale, dy = (event.clientY - drag.current.y) * scale;
    drag.current = { x: event.clientX, y: event.clientY };
    setCenter(current => clamp({ x: clamp(current).x - dx, y: clamp(current).y - dy }));
  };
  const confirm = () => canvas.current?.toBlob(blob => { if (blob) onConfirm(blob); }, "image/webp", 0.88);

  if (failed) return <div className="member-crop"><p role="alert" className="member-error">Não foi possível abrir essa imagem.</p><button onClick={onCancel}>Voltar</button></div>;
  return <div className="member-crop">
    <canvas ref={canvas} width={PREVIEW} height={PREVIEW} className="member-crop-canvas" aria-label="Pré-visualização da foto. Arraste para ajustar."
      onPointerDown={event => { drag.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} />
    <label className="member-crop-zoom">Zoom
      <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={event => setZoom(Number(event.target.value))} disabled={!bitmap} aria-label="Zoom" />
    </label>
    <p className="member-hint">Arraste a imagem para enquadrar.</p>
    <div className="member-edit-row">
      <button disabled={busy || !bitmap} onClick={confirm}>{busy ? "Enviando…" : "Usar esta foto"}</button>
      <button disabled={busy} onClick={onCancel}>Cancelar</button>
    </div>
  </div>;
}

export function MemberProfileEditor({ name, avatarUrl, customized, onChange }: Props) {
  const [value, setValue] = useState(name), [busy, setBusy] = useState(false), [error, setError] = useState(""), [ok, setOk] = useState("");
  const [cropping, setCropping] = useState<File | null>(null);
  const input = useRef<HTMLInputElement>(null);
  async function run(task: () => Promise<void>, done: string) {
    setBusy(true); setError(""); setOk("");
    try { await task(); setOk(done); onChange(); return true; }
    catch (err) { setError((err as Error).message); return false; }
    finally { setBusy(false); }
  }
  const saveName = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => { await command("/api/member", { method: "PUT", body: JSON.stringify({ name: value }) }); }, "Nome atualizado.");
  };
  const pick = (file?: File) => {
    if (!file) return;
    setError(""); setOk("");
    if (!file.type.startsWith("image/")) { setError("Escolha um arquivo de imagem."); return; }
    setCropping(file);
  };
  const upload = async (blob: Blob) => {
    const sent = await run(async () => { await command("/api/member/avatar", { method: "POST", headers: { "Content-Type": "image/webp" }, body: blob }); }, "Foto atualizada.");
    if (sent) setCropping(null);
  };
  return <section className="member-card member-edit" aria-label="Editar perfil">
    <h2>Editar perfil</h2>
    {cropping ? <AvatarCropper file={cropping} busy={busy} onCancel={() => setCropping(null)} onConfirm={blob => void upload(blob)} /> : <>
      <form onSubmit={saveName} className="member-edit-row">
        <label htmlFor="member-name">Nome de exibição</label>
        <input id="member-name" value={value} onChange={e => setValue(e.target.value)} minLength={2} maxLength={24} required disabled={busy} autoComplete="off" />
        <button disabled={busy || value.trim() === name}>Salvar nome</button>
        {customized.name && <button type="button" disabled={busy} onClick={() => void run(async () => { await command("/api/member", { method: "PUT", body: JSON.stringify({ name: null }) }); }, "Voltou ao nome da sua conta.")}>Usar nome da conta</button>}
      </form>
      <div className="member-edit-row">
        {avatarUrl ? <img className="member-edit-avatar" src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : <span>Foto</span>}
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        <button disabled={busy} onClick={() => input.current?.click()}>Escolher foto</button>
        {customized.avatar && <button disabled={busy} onClick={() => void run(async () => { await command("/api/member/avatar", { method: "DELETE" }); }, "Foto removida.")}>Remover foto</button>}
      </div>
    </>}
    {error && <p role="alert" className="member-error">{error}</p>}
    {ok && <p role="status" className="member-ok">{ok}</p>}
  </section>;
}
