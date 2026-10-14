import { useState } from "react";
import { command } from "./services";
import { PlatformIcon } from "./PlatformIcon";
export type TikTokConnectionState={connected:boolean;canSend:boolean;username?:string};
export function TikTokConnection({signedIn,state,onChange}:{signedIn:boolean;state:TikTokConnectionState;onChange:(s:TikTokConnectionState)=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function action(){
  if(busy)return;setBusy(true);setError("");
  try{
   if(state.connected){
    await command("/api/tiktok/connection",{method:"DELETE"});
    onChange({connected:false,canSend:false});
   }else{
    const {url}=await command<{url:string}>("/oauth/tiktok/start");
    window.location.assign(url);
   }
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <section aria-label="Conexão TikTok">
  <div className="mc-account-row"><PlatformIcon platform="tiktok"/><div><strong>TikTok</strong><small>{state.connected?state.username||"Conectada":"Não conectada"}</small></div>
   {state.connected ? <span>Vinculada</span> : <button disabled={!signedIn||busy} onClick={()=>void action()}>{busy?"Aguarde…":"Conectar"}</button>}
  </div>
  {error&&<p role="alert">{error}</p>}
 </section>;
}
