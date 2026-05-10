-- Add a cron to run scrape-trac every 4 hours.
-- Previously omitted because Cloudflare was blocking all detail enrichment.
-- After fixing the scraper to preserve existing data through Cloudflare challenges,
-- running periodically still enriches jobs that slip through and keeps the job list current.

select cron.schedule(
  'scrape-trac-jobs',
  '0 */4 * * *',
  $$
    SELECT net.http_post(
      url := 'https://awwytzqwvicjynicbbyf.supabase.co/functions/v1/scrape-trac',
      headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3d3l0enF3dmljanluaWNiYnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTczNjIsImV4cCI6MjA5MTEzMzM2Mn0.q3ByinNk3TEDDlQMmDXwM1HrWPX3JvFAuzx6bCMQGcs", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
