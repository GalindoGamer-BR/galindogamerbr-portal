// Run against the local Compose stack only. Creates a disposable local Auth user.
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const values = Object.fromEntries(
  readFileSync(new URL("../.env.docker", import.meta.url), "utf8")
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);
const client = createClient("http://localhost:54321", values.ANON_KEY, {
  auth: { persistSession: false },
});
const admin = createClient("http://localhost:54321", values.SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
let userId;
let channel;
try {
  assert.equal((await fetch("http://localhost:3001/api/accounts")).status, 401);
  assert.equal(
    (await fetch("http://localhost:3002/internal/wake", { method: "POST" }))
      .status,
    401,
  );
  const { data, error } = await client.auth.signUp({
    email: "smoke-" + randomUUID() + "@example.com",
    password: randomUUID() + "!Aa1",
  });
  if (error) throw error;
  assert.ok(data.session);
  userId = data.user.id;
  const headers = {
    Authorization: "Bearer " + data.session.access_token,
    "Content-Type": "application/json",
  };
  const accounts = await fetch("http://localhost:3001/api/accounts", {
    headers,
  });
  assert.equal(accounts.status, 200);
  for (const platform of ["twitch", "youtube", "kick"]) {
    const linked = await fetch(
      "http://localhost:3001/oauth/" + platform + "/start",
      { headers },
    );
    assert.equal(linked.status, 200);
  }
  const denied = await client.from("provider_accounts").select("*");
  assert.ok(denied.error, "Browser must not access encrypted tokens");
  const marker = "smoke-" + randomUUID();
  const seen = new Set();
  const allPlatforms = new Set();
  channel = client.channel("live:galindogamerbr", {
    config: { private: true },
  });
  await client.realtime.setAuth(data.session.access_token);
  channel.on("broadcast", { event: "chat_batch" }, ({ payload }) => {
    for (const m of payload.messages || []) {
      allPlatforms.add(m.platform);
      if (m.message === marker) seen.add(m.platform);
    }
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Realtime subscription timeout")),
      20_000,
    );
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timeout);
        resolve();
      } else if (status === "CHANNEL_ERROR") {
        clearTimeout(timeout);
        reject(new Error("Realtime authorization failed"));
      }
    });
  });
  const sent = await fetch("http://localhost:3001/api/chat/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: marker,
      platforms: ["twitch", "youtube", "kick"],
    }),
  });
  assert.equal(sent.status, 200);
  assert.ok((await sent.json()).results.every((r) => r.success));
  const deadline = Date.now() + 20_000;
  while ((seen.size < 3 || allPlatforms.size < 4) && Date.now() < deadline)
    await new Promise((resolve) => setTimeout(resolve, 250));
  assert.equal(
    seen.size,
    3,
    "Every successful send must return through Reader",
  );
  assert.equal(
    allPlatforms.size,
    4,
    "All four simulated platforms should broadcast",
  );
  console.log(
    "PASS: Supabase Auth, protected endpoints, token isolation, four readers and three writers through Realtime.",
  );
} finally {
  if (channel) await client.removeChannel(channel);
  client.realtime.disconnect();
  await client.auth.stopAutoRefresh();
  await admin.auth.stopAutoRefresh();
  await client.auth.signOut();
  if (userId) await admin.auth.admin.deleteUser(userId);
}
