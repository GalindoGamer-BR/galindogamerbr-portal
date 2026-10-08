import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env=Object.fromEntries(readFileSync(new URL("../.env.docker",import.meta.url),"utf8").split(/\r?\n/).filter(l=>l.includes("=")).map(l=>[l.slice(0,l.indexOf("=")),l.slice(l.indexOf("=")+1)]));
const client=createClient("http://localhost:54321",env.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const channel=client.channel("live:galindogamerbr",{config:{private:true}});
const counts={};let simulation;
channel.on("broadcast",{event:"chat_batch"},({payload})=>{for(const m of payload.messages||[])counts[m.platform]=(counts[m.platform]||0)+1;});
channel.on("broadcast",{event:"live_status"},({payload})=>{simulation=payload.simulation;});
try {
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error("Subscription timeout")),15000);channel.subscribe(s=>{if(s==="SUBSCRIBED"){clearTimeout(timer);resolve();}else if(s==="CHANNEL_ERROR"){clearTimeout(timer);reject(new Error(s));}});});
 await new Promise(r=>setTimeout(r,40000));
 console.log(JSON.stringify({anonymous:true,simulation,received:counts}));
 if(simulation!==false)process.exitCode=1;
}finally{await client.removeChannel(channel);client.realtime.disconnect();}
