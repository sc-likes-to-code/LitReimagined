-- Postgres grants EXECUTE on new functions to PUBLIC by default. These two run with
-- elevated rights, so only the server (service role) may call them.
revoke execute on function public.bump_ai_global_usage(text, int) from public, anon, authenticated;
grant execute on function public.bump_ai_global_usage(text, int) to service_role;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
