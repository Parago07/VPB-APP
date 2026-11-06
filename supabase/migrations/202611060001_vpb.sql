begin;
create schema if not exists vpb_private;
revoke all on schema vpb_private from public,anon,authenticated;
create table if not exists vpb_private.agenda (
  id boolean primary key default true check(id), revision bigint not null default 0,
  topic uuid not null default gen_random_uuid(), data jsonb not null
);
create table if not exists vpb_private.convites (member text primary key,digest text unique not null);
create table if not exists vpb_private.recibos (member text not null,action_id text not null,primary key(member,action_id));
alter table vpb_private.agenda enable row level security;
alter table vpb_private.convites enable row level security;
alter table vpb_private.recibos enable row level security;
insert into vpb_private.agenda(data) values ('{"events":[],"rooms":[],"prefs":{},"inbox":{},"looks":{}}') on conflict do nothing;
create or replace function public.vpb_read(token_hash text, action_id text)
returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('member',c.member,'revision',g.revision,'topic',g.topic,'data',g.data,'applied',exists(select 1 from vpb_private.recibos r where r.member=c.member and r.action_id=$2))
 from vpb_private.convites c cross join vpb_private.agenda g where c.digest=$1;
$$;
create or replace function public.vpb_write(token_hash text, action_id text, expected bigint, new_data jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare person text;
begin
 select member into strict person from vpb_private.convites where digest=$1;
 update vpb_private.agenda set data=$4,revision=revision+1 where id and revision=$3;
 if not found then return false; end if;
 insert into vpb_private.recibos values(person,$2);
 return true;
end;
$$;
revoke all on function public.vpb_read(text,text), public.vpb_write(text,text,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.vpb_read(text,text), public.vpb_write(text,text,bigint,jsonb) to service_role;
commit;
