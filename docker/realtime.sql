-- Apply after Realtime has bootstrapped its schema.
alter table realtime.messages enable row level security;
drop policy if exists multichat_receive on realtime.messages;
create policy multichat_receive on realtime.messages for select to authenticated
using (realtime.topic() = 'live:galindogamerbr');
-- There is intentionally no INSERT policy for browser users.
grant select on realtime.messages to authenticated;
grant all on realtime.messages to service_role;
