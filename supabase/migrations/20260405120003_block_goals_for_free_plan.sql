-- Block free-plan users from creating goals (premium-only feature)

drop policy "Users can create their own goals" on public.goals;

create policy "Users can create their own goals"
  on public.goals for insert
  with check (
    auth.uid() = user_id
    and (select plan from public.profiles where id = auth.uid()) = 'premium'
  );
