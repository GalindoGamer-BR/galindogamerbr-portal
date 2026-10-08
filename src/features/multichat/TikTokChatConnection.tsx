import { useState } from "react";
import { command } from "./services";
import { PlatformIcon } from "./PlatformIcon";
import type { TikTokConnectionState } from "./TikTokConnection";
type Login = {state:string;canSend:boolean;attemptId?:string;qrImage?:string;expiresAt?:string;retryAfterSeconds?:number;providerCode?:string};
const messages:Record<string,string>={rejected:"Não foi possível concluir a conexão. A resposta recebida não confirmou o sucesso.",waiting:"Escaneie o QR com o TikTok e confirme no celular.",scanned:"Confirme o login no aplicativo TikTok.",expired:"O QR expirou. Clique em Conectar para tentar novamente.",rate_limited:"O TikTok limitou as tentativas. Aguarde antes de conectar novamente.",verification_required:"O TikTok exige uma verificação adicional e não concluiu a conexão.",unavailable:"O TikTok não disponibilizou a conexão. Tente novamente mais tarde."};
export function TikTokChatConnection({signedIn,state,onChange}:{signedIn:boolean;state:TikTokConnectionState;onChange:(s:TikTokConnectionState)=>void}) {
 const [login,setLogin]=useState<Login|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
 function accept(result:Login){setLogin(result);onChange({connected:result.state==="authenticated",canSend:result.canSend});}
 async function confirm(){
  if(busy||!login?.attemptId)return;
  if(login.expiresAt&&Date.parse(login.expiresAt)<=Date.now()){setLogin({state:"expired",canSend:false});return;}
  setBusy(true);setError("");
  try{accept(await command<Login>("/api/tiktok/live/confirm",{method:"POST",body:JSON.stringify({attemptId:login.attemptId})}));}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function connect(){
  if(busy)return;setBusy(true);setError("");
  try{accept(await command<Login>("/api/tiktok/live",{method:"POST"}));}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function disconnect(){
  setBusy(true);setError("");try{await command("/api/tiktok/live",{method:"DELETE"});setLogin(null);onChange({connected:false,canSend:false});}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 const waiting=!!login&&["waiting","scanned"].includes(login.state);
 return <section aria-label="Chat TikTok">
  <div className="mc-account-row"><PlatformIcon platform="tiktok"/><div><strong>TikTok · chat</strong><small>{state.connected?"Sessão conectada":"Não conectado"}</small></div>
   {state.connected||waiting?<button disabled={busy} onClick={()=>void disconnect()}>{waiting?"Cancelar":"Desconectar"}</button>:<button disabled={!signedIn||busy} onClick={()=>void connect()}>{busy?"Aguarde…":"Conectar"}</button>}
  </div>
  {waiting&&login?.qrImage&&<img src={login.qrImage} width={220} height={220} style={{maxWidth:"100%",height:"auto",background:"white"}} alt="QR code para conectar sua sessão TikTok ao chat"/>}
  {waiting&&<button disabled={!signedIn||busy} onClick={()=>void confirm()}>{busy?"Consultando…":"Já confirmei no TikTok"}</button>}
  {login&&messages[login.state]&&<p role="status">{messages[login.state]}{login.providerCode!==undefined?" Código retornado pelo TikTok: "+login.providerCode+".":""}{login.retryAfterSeconds?" Prazo informado pelo TikTok: "+Math.ceil(login.retryAfterSeconds/60)+" minuto(s).":""}</p>}
  <p>Na primeira conexão, confirme o QR no aplicativo TikTok. A sessão fica protegida no nosso servidor e permite enviar mensagens em seu nome. Entrar no portal com TikTok não conecta o chat. Para interromper o envio, desconecte aqui.</p>
  <p>Integração experimental: o TikTok pode recusar a conexão ou o envio.</p>
  {error&&<p role="alert">{error}</p>}
 </section>;
}
