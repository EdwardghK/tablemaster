-- Set the profile role
update public.profiles p
set role = 'admin'
from auth.users u
where p.user_id = '____'
  and u.email = '____';

-- (optional) also store role in auth metadata for client-side access
update auth.users
set raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', 'admin')
where email = '____';

--search user id
select id from auth.users where email = '____';


-- Deploy cmd 
wrangler pages deploy dist --project-name tablemaster