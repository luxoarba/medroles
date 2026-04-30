-- Change scrape-nhs-jobs from every 6 hours to every 30 minutes.
-- Trac scraper stays at 6h — Cloudflare blocks detail enrichment regardless.
-- Uses the public anon key to invoke the edge function (safe to commit).

select cron.unschedule('scrape-nhs-jobs');

select cron.schedule(
  'scrape-nhs-jobs',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://awwytzqwvicjynicbbyf.supabase.co/functions/v1/scrape-jobs',
      headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3d3l0enF3dmljanluaWNiYnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTczNjIsImV4cCI6MjA5MTEzMzM2Mn0.q3ByinNk3TEDDlQMmDXwM1HrWPX3JvFAuzx6bCMQGcs", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
