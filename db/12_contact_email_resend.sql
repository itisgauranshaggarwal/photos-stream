-- ============================================================
-- PhotoStream — 12_contact_email_resend.sql
-- Run in: Supabase Dashboard → SQL Editor → Run
--
-- Emails each new Contact-page message to the site owner via
-- the Resend API (https://resend.com). No Edge Function / CLI
-- needed: a trigger on `contact_messages` fires after each
-- insert and posts the message to Resend using the `pg_net`
-- extension, with the API key kept in the Vault (secrets).
--
-- Before running:
--   1. Enable extensions (Database → Extensions → enable):
--        pg_net, supabase_vault
--      (or keep the `create extension` lines below and run once)
--   2. Create a free Resend API key (Dashboard → API Keys,
--      "re_..."), then store it in the Vault:
--        select vault.create_secret('re_xxx', 'RESEND_API_KEY');
--
-- The `from` address `onboarding@resend.dev` is Resend's
-- no-domain test sender (works while testing). To send from
-- your own address, add/verify a domain in Resend, then change
-- the `from` in the payload below.
-- ============================================================

-- Enable the two extensions (idempotent; safe to re-run).
create extension if not exists pg_net;
create extension if not exists supabase_vault;

-- Owner email that contact messages are delivered to.
-- Change this if you'd rather receive them elsewhere.
-- RECIPIENT_EMAIL = itisgauranshaggarwal@gmail.com

create or replace function public.notify_contact_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resend_key text;
begin
  -- Pull the Resend API key out of the Vault.
  select decrypted_secret into resend_key
  from vault.decrypted_secrets
  where name = 'RESEND_API_KEY'
  limit 1;

  if resend_key is null or resend_key = '' then
    raise notice 'RESEND_API_KEY not set in Vault — contact email skipped';
    return new;
  end if;

  perform net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_key,
      'Content-Type',  'application/json'
    ),
    body    := jsonb_build_object(
      'from',     'PhotoStream <onboarding@resend.dev>',
      'to',       jsonb_build_array('itisgauranshaggarwal@gmail.com'),
      'reply_to', new.email,
      'subject',  'New PhotoStream contact message',
      'text', 'A visitor left a message on the PhotoStream Contact page.' || E'\n\n' ||
              'From: ' || new.email || E'\n' ||
              'Sent: ' || to_char(new.created_at, 'YYYY-MM-DD HH24:MI') || E'\n\n' ||
              '---' || E'\n\n' ||
              new.message || E'\n\n' ||
              '---' || E'\n\n' ||
              'Hit Reply to answer them directly at ' || new.email || '.'
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_contact_email on public.contact_messages;
create trigger trg_contact_email
  after insert on public.contact_messages
  for each row execute function public.notify_contact_email();