revoke all on function public.admin_user_count() from public, anon;
grant execute on function public.admin_user_count() to authenticated;
