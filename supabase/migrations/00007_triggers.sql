create or replace function public.actualizar_timestamp()
returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_perfiles_actualizado
  before update on public.perfiles
  for each row execute function public.actualizar_timestamp();

create trigger trg_organizaciones_actualizado
  before update on public.organizaciones
  for each row execute function public.actualizar_timestamp();

create trigger trg_publicaciones_actualizado
  before update on public.publicaciones
  for each row execute function public.actualizar_timestamp();

-- Crea el perfil automáticamente cuando alguien se registra en Auth
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger as $$
begin
  insert into public.perfiles (id, alias) values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_nuevo_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();