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

create table if not exists public.rescue_zones (
  id text primary key,
  name text not null,
  description text,
  display_order integer,
  color text,
  geojson jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.rescue_zones (id, name, display_order, color)
values
  ('A', 'Dam / Beach', 1, '#2563eb'),
  ('B', 'Marina / Main Park', 2, '#0891b2'),
  ('C', 'Campground / South Island', 3, '#16a34a'),
  ('D', 'Club / Cemetery / Mid-Lake', 4, '#ca8a04'),
  ('E', 'Causeway / Mecca Access', 5, '#ea580c'),
  ('F', 'North Lake / Refuge', 6, '#7c3aed')
on conflict (id) do update
set
  name = excluded.name,
  display_order = excluded.display_order,
  color = excluded.color,
  active = true,
  updated_at = now();

create index if not exists rescue_zones_active_idx on public.rescue_zones (active);
create index if not exists rescue_zones_display_order_idx
  on public.rescue_zones (display_order);

alter table public.map_points
  add column if not exists zone text,
  add column if not exists zone_id text references public.rescue_zones (id),
  add column if not exists public_visible boolean not null default false,
  add column if not exists visible_from_water boolean not null default false;

update public.map_points
set zone_id = upper(left(trim(zone), 1))
where zone_id is null
  and zone is not null
  and upper(left(trim(zone), 1)) in ('A', 'B', 'C', 'D', 'E', 'F');

create index if not exists map_points_public_visible_idx on public.map_points (public_visible);
create index if not exists map_points_category_idx on public.map_points (category);
create index if not exists map_points_zone_idx on public.map_points (zone);
create index if not exists map_points_zone_id_idx on public.map_points (zone_id);

alter table public.incident_markers
  add column if not exists incident_id uuid references public.incidents (id) on delete cascade,
  add column if not exists photo_url text,
  add column if not exists attachment_pending boolean not null default false;

create index if not exists incident_markers_incident_id_idx
  on public.incident_markers (incident_id);

create table if not exists public.agencies (
  id text primary key,
  name text not null,
  agency_type text,
  contact_notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.agencies (id, name, agency_type)
values
  ('bazetta-fire', 'Bazetta Fire', 'Fire'),
  ('tcwrt-ema', 'Trumbull County Water Rescue Team / EMA', 'Water Rescue'),
  ('mecca-fire', 'Mecca Fire', 'Fire'),
  ('incident-command', 'Incident Command', 'Command'),
  ('tcwrt', 'TCWRT', 'Water Rescue'),
  ('mutual-aid-ems', 'Mutual Aid EMS', 'EMS'),
  ('mutual-aid', 'Mutual Aid', 'Mutual Aid')
on conflict (id) do update
set
  name = excluded.name,
  agency_type = excluded.agency_type,
  active = true,
  updated_at = now();

create index if not exists agencies_active_idx on public.agencies (active);

create table if not exists public.resources (
  id text primary key,
  name text not null,
  agency text not null,
  resource_type text not null,
  status text not null default 'Available',
  current_incident_id uuid references public.incidents (id) on delete set null,
  assigned_zone_id text references public.rescue_zones (id),
  assigned_task_id uuid,
  notes text,
  last_latitude double precision,
  last_longitude double precision,
  updated_at timestamptz not null default now(),
  constraint resources_status_check check (
    status in (
      'Available',
      'Assigned',
      'En Route',
      'On Scene',
      'Searching',
      'Returning',
      'Out of Service'
    )
  ),
  constraint resources_type_check check (
    resource_type in ('Boat', 'Command', 'Diver', 'Sonar', 'EMS', 'Search')
  )
);

insert into public.resources (id, name, agency, resource_type, status)
values
  ('boat-11', 'Boat 11', 'Bazetta Fire', 'Boat', 'Available'),
  ('boat-78', 'Boat 78', 'TCWRT-EMA', 'Boat', 'Available'),
  ('boat-38', 'Boat 38', 'Mecca Fire', 'Boat', 'Available'),
  ('command-post', 'Command Post', 'Incident Command', 'Command', 'Available'),
  ('dive-team-1', 'Dive Team 1', 'TCWRT', 'Diver', 'Available'),
  ('sonar-team-1', 'Sonar Team 1', 'TCWRT', 'Sonar', 'Available'),
  ('medical-group', 'Medical Group', 'Mutual Aid EMS', 'EMS', 'Available'),
  ('shore-team-1', 'Shore Team 1', 'Mutual Aid', 'Search', 'Available')
on conflict (id) do update
set
  name = excluded.name,
  agency = excluded.agency,
  resource_type = excluded.resource_type,
  updated_at = now();

delete from public.resources
where resource_type = 'Boat'
  and id not in ('boat-11', 'boat-78', 'boat-38');

create index if not exists resources_status_idx on public.resources (status);
create index if not exists resources_current_incident_id_idx
  on public.resources (current_incident_id);
create index if not exists resources_assigned_zone_id_idx
  on public.resources (assigned_zone_id);

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

create table if not exists public.search_assignments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  assignment_type text not null,
  assigned_resource_id text references public.resources (id) on delete set null,
  zone_id text references public.rescue_zones (id),
  search_area_id uuid references public.search_areas (id) on delete set null,
  priority integer,
  status text not null default 'Assigned',
  start_time timestamptz,
  end_time timestamptz,
  notes text,
  completion_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint search_assignments_type_check check (
    assignment_type in (
      'Boat Search',
      'Shore Search',
      'Sonar Search',
      'Dive Assignment',
      'Medical Standby',
      'Staging',
      'Transport',
      'Other'
    )
  ),
  constraint search_assignments_status_check check (
    status in ('Assigned', 'In Progress', 'Completed', 'Suspended')
  )
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'resources_assigned_task_id_fkey'
  ) then
    alter table public.resources
      add constraint resources_assigned_task_id_fkey
      foreign key (assigned_task_id)
      references public.search_assignments (id)
      on delete set null;
  end if;
end $$;

create index if not exists search_assignments_incident_id_idx
  on public.search_assignments (incident_id);
create index if not exists search_assignments_status_idx
  on public.search_assignments (status);
create index if not exists search_assignments_resource_idx
  on public.search_assignments (assigned_resource_id);

create table if not exists public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  marker_id uuid references public.incident_markers (id) on delete set null,
  item_type text not null,
  description text,
  found_by text,
  found_at timestamptz,
  latitude double precision,
  longitude double precision,
  photo_url text,
  custody_notes text,
  created_at timestamptz not null default now()
);

create index if not exists evidence_items_incident_id_idx
  on public.evidence_items (incident_id);
create index if not exists evidence_items_marker_id_idx
  on public.evidence_items (marker_id);

create table if not exists public.incident_role_assignments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  role_name text not null,
  assigned_resource_id text references public.resources (id) on delete set null,
  assigned_person_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint incident_role_assignments_role_check check (
    role_name in (
      'Incident Commander',
      'Operations',
      'Boat Operations',
      'Dive Operations',
      'Sonar Operations',
      'Safety',
      'Staging',
      'Medical',
      'Communications',
      'Liaison',
      'PIO'
    )
  )
);

create index if not exists incident_role_assignments_incident_id_idx
  on public.incident_role_assignments (incident_id);

create table if not exists public.incident_activity_log (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents (id) on delete cascade,
  action_type text not null,
  summary text not null,
  details jsonb,
  actor_name text,
  created_at timestamptz not null default now()
);

create index if not exists incident_activity_log_incident_id_idx
  on public.incident_activity_log (incident_id);
create index if not exists incident_activity_log_created_at_idx
  on public.incident_activity_log (created_at);

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
