-- Apply after Realtime has bootstrapped its schema.
alter table realtime.messages enable row level security;
drop policy if exists multichat_receive on realtime.messages;
create policy multichat_receive on realtime.messages for select to anon, authenticated
using (realtime.topic() = 'live:galindogamerbr');
-- Browsers never publish messages. The only INSERT allowed is Presence tracking (online members list) for logged-in users
-- on this topic: restricted to extension 'presence' so it cannot be used to broadcast fake chat messages.
drop policy if exists multichat_presence on realtime.messages;
create policy multichat_presence on realtime.messages for insert to authenticated
with check (realtime.topic() = 'live:galindogamerbr' and realtime.messages.extension in ('presence'));
grant insert on realtime.messages to authenticated;
grant select on realtime.messages to anon, authenticated;
grant all on realtime.messages to service_role;
