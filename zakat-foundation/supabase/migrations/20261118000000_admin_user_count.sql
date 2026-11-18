create or replace function public.admin_user_count()
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not coalesce(public.has_admin_permission('dashboard.view'), false) then
    raise exception 'Insufficient permission to view account statistics.'
      using errcode = '42501';
  end if;

  return (select count(*)::bigint from auth.users);
end;
$$;

revoke all on function public.admin_user_count() from public;
grant execute on function public.admin_user_count() to authenticated;
