import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const env = Object.fromEntries(readFileSync(new URL("../.env.docker", import.meta.url), "utf8").split(/\r?\n/).filter(l => l.includes("=")).map(l => [l.slice(0,l.indexOf("=")),l.slice(l.indexOf("=")+1)]));
if (env.MOCK_PLATFORMS !== "true") throw new Error("Smoke test requires an explicitly simulated environment; real providers must not receive test messages.");
const guest = createClient("http://localhost:54321", env.ANON_KEY, {auth:{persistSession:false,autoRefreshToken:false}});
const channel = guest.channel("live:galindogamerbr", {config:{private:true}});
const seen = new Set();
let guestPublished = false;
channel.on("broadcast", {event:"__guest_probe"}, () => { guestPublished = true; });
try {
  assert.equal((await guest.auth.getSession()).data.session, null);
  channel.on("broadcast", {event:"chat_batch"}, ({payload}) => {
    for (const message of payload.messages || []) seen.add(message.platform);
  });
  await new Promise((resolve,reject) => {
    const timer = setTimeout(() => reject(new Error("Anonymous subscription timed out")),15000);
    channel.subscribe(status => {
      if (status === "SUBSCRIBED") {clearTimeout(timer);resolve();}
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {clearTimeout(timer);reject(new Error(status));}
    });
  });
  const deadline=Date.now()+15000;
  while(seen.size<4 && Date.now()<deadline) await new Promise(r=>setTimeout(r,250));
  assert.equal(seen.size,4,"Guest must read all four simulated platforms");
  const broadcast = await fetch("http://localhost:54321/realtime/v1/api/broadcast", {
    method:"POST",headers:{apikey:env.ANON_KEY,Authorization:"Bearer "+env.ANON_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({messages:[{topic:"live:galindogamerbr",event:"__guest_probe",payload:{},private:true}]}),
  });
  assert.ok([202,401,403].includes(broadcast.status), "Unexpected broadcast status: "+broadcast.status);
  // Realtime may acknowledge the request with 202 while RLS drops unauthorized messages.
  await new Promise(resolve => setTimeout(resolve, 2000));
  assert.equal(guestPublished, false, "Guest must not publish into the channel");
  assert.equal((await fetch("http://localhost:3001/api/chat/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:"guest",platforms:["twitch"]})})).status,401);
  assert.ok((await guest.from("provider_accounts").select("*")).error);
  console.log("PASS: logged-out read across four platforms; broadcast, send and token access denied.");
} finally {
  await guest.removeChannel(channel);
  guest.realtime.disconnect();
}
