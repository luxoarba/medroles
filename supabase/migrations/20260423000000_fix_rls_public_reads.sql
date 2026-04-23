-- Allow anyone to read trust reviews and interview insights
create policy "public can read trust_reviews"
  on public.trust_reviews
  for select
  to anon, authenticated
  using (true);

create policy "public can read interview_insights"
  on public.interview_insights
  for select
  to anon, authenticated
  using (true);
