create extension if not exists "pgcrypto";

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  incident_type text not null default 'Search only',
  status text not null default 'Active',
  tc911_run_number text,
  command_notes text,
  closeout_notes text,
  closed_at timestamptz,
  closed_by uuid,
  public_share_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint incidents_status_check check (status in ('Active', 'Standby', 'Closed')),
  constraint incidents_type_check check (
    incident_type in (
      'Missing swimmer',
      'Missing boater',
      'Capsized vessel',
      'Medical emergency',
      'Recovery operation',
      'Search only'
    )
  )
);

alter table public.incidents
  add column if not exists incident_type text not null default 'Search only',
  add column if not exists command_notes text,
  add column if not exists closeout_notes text,
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid,
  add column if not exists public_share_token uuid not null default gen_random_uuid();

alter table public.incidents
  alter column status type text using status::text,
  alter column status set default 'Active',
  alter column incident_type set default 'Search only';

update public.incidents
set status = case
  when status in ('Closed', 'Canceled', 'Resolved') then 'Closed'
  when status in ('Open', 'Active', 'En Route', 'On Scene') then 'Active'
  when status = 'Standby' then 'Standby'
  else 'Active'
end;

update public.incidents
set incident_type = 'Search only'
where incident_type is null
  or incident_type not in (
    'Missing swimmer',
    'Missing boater',
    'Capsized vessel',
    'Medical emergency',
    'Recovery operation',
    'Search only'
  );

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'incidents_status_check'
  ) then
    alter table public.incidents
      add constraint incidents_status_check check (status in ('Active', 'Standby', 'Closed'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'incidents_type_check'
  ) then
    alter table public.incidents
      add constraint incidents_type_check check (
        incident_type in (
          'Missing swimmer',
          'Missing boater',
          'Capsized vessel',
          'Medical emergency',
          'Recovery operation',
          'Search only'
        )
      );
  end if;
end $$;

create index if not exists incidents_status_idx on public.incidents (status);
create index if not exists incidents_type_idx on public.incidents (incident_type);
create index if not exists incidents_tc911_run_number_idx on public.incidents (tc911_run_number);
create index if not exists incidents_public_share_token_idx on public.incidents (public_share_token);
create index if not exists incidents_closed_at_idx on public.incidents (closed_at);

alter table public.map_points
  add column if not exists zone text,
  add column if not exists public_visible boolean not null default false,
  add column if not exists visible_from_water boolean not null default false;

create index if not exists map_points_public_visible_idx on public.map_points (public_visible);
create index if not exists map_points_category_idx on public.map_points (category);
create index if not exists map_points_zone_idx on public.map_points (zone);

alter table public.incident_markers
  add column if not exists incident_id uuid references public.incidents (id) on delete cascade,
  add column if not exists photo_url text,
  add column if not exists attachment_pending boolean not null default false;

create index if not exists incident_markers_incident_id_idx
  on public.incident_markers (incident_id);

create table if not exists public.responder_locations (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents (id) on delete cascade,
  responder_id uuid,
  display_name text,
  latitude double precision not null,
  longitude double precision not null,
  heading double precision,
  speed double precision,
  recorded_at timestamptz not null default now()
);

create index if not exists responder_locations_incident_id_idx
  on public.responder_locations (incident_id);

create index if not exists responder_locations_recorded_at_idx
  on public.responder_locations (recorded_at);

create table if not exists public.search_areas (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents (id) on delete cascade,
  name text not null,
  geojson jsonb not null,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists search_areas_incident_id_idx
  on public.search_areas (incident_id);

create table if not exists public.offline_sync_queue (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  table_name text not null,
  payload jsonb not null,
  operation text not null default 'insert',
  created_at timestamptz not null default now(),
  synced_at timestamptz
);
