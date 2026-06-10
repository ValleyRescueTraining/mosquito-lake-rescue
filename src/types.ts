export type Coordinates = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export type MapPointCategory =
  | 'hazard'
  | 'launch'
  | 'island'
  | 'landmark'
  | 'dock'
  | 'responder_asset'
  | 'access'
  | 'zone'
  | 'other';

export type MapPoint = {
  id: string;
  name: string;
  category: MapPointCategory;
  zone_id?: string | null;
  zone?: string | null;
  description?: string | null;
  latitude: number;
  longitude: number;
  public_visible: boolean;
  visible_from_water?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type RescueZone = {
  id: string;
  name: string;
  description?: string | null;
  display_order?: number | null;
  color?: string | null;
  geojson?: Record<string, unknown> | null;
  active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type IncidentStatus =
  | 'Active'
  | 'Standby'
  | 'Closed';

export type WaterRescueIncidentType =
  | 'Missing swimmer'
  | 'Missing boater'
  | 'Capsized vessel'
  | 'Medical emergency'
  | 'Recovery operation'
  | 'Search only';

export type Incident = {
  id: string;
  name: string;
  status: IncidentStatus;
  incident_type: WaterRescueIncidentType;
  tc911_run_number?: string | null;
  command_notes?: string | null;
  closeout_notes?: string | null;
  closed_at?: string | null;
  closed_by?: string | null;
  public_share_token?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type Agency = {
  id: string;
  name: string;
  agency_type?: string | null;
  contact_notes?: string | null;
  active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ResourceType =
  | 'Boat'
  | 'Command'
  | 'Diver'
  | 'Sonar'
  | 'EMS'
  | 'Search'
  | 'Law Enforcement'
  | 'ODNR'
  | 'Drone'
  | 'Command Vehicle'
  | 'Support';

export type ResourceStatus =
  | 'Available'
  | 'Assigned'
  | 'En Route'
  | 'On Scene'
  | 'Searching'
  | 'Returning'
  | 'Out of Service';

export type Resource = {
  id: string;
  name: string;
  agency: string;
  resource_type: ResourceType;
  status: ResourceStatus;
  active: boolean;
  current_incident_id?: string | null;
  assigned_zone_id?: string | null;
  assigned_task_id?: string | null;
  notes?: string | null;
  last_latitude?: number | null;
  last_longitude?: number | null;
  updated_at?: string | null;
};

export type AssignmentType =
  | 'Boat Search'
  | 'Shore Search'
  | 'Sonar Search'
  | 'Dive Assignment'
  | 'Medical Standby'
  | 'Staging'
  | 'Transport'
  | 'Other';

export type AssignmentStatus = 'Assigned' | 'In Progress' | 'Completed' | 'Suspended';

export type SearchAssignment = {
  id: string;
  incident_id: string;
  assignment_type: AssignmentType;
  assigned_resource_id?: string | null;
  zone_id?: string | null;
  search_area_id?: string | null;
  priority?: number | null;
  status: AssignmentStatus;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
  completion_notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type EvidenceItem = {
  id: string;
  incident_id: string;
  marker_id?: string | null;
  item_type: string;
  description?: string | null;
  found_by?: string | null;
  found_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  photo_url?: string | null;
  custody_notes?: string | null;
  created_at?: string | null;
};

export type CoreRoleName =
  | 'Incident Commander'
  | 'Operations'
  | 'Boat Operations'
  | 'Dive Operations'
  | 'Sonar Operations';

export type OptionalRoleName =
  | 'Safety'
  | 'Staging'
  | 'Medical'
  | 'Communications'
  | 'Liaison'
  | 'PIO';

export type IncidentRoleName = CoreRoleName | OptionalRoleName;

export type IncidentRoleAssignment = {
  id: string;
  incident_id: string;
  role_name: IncidentRoleName;
  assigned_resource_id?: string | null;
  assigned_person_name?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ActivityActionType =
  | 'Incident created'
  | 'Incident status changed'
  | 'Resource assigned'
  | 'Resource status changed'
  | 'Marker added'
  | 'Search task created'
  | 'Search task completed'
  | 'Evidence/clue added'
  | 'Incident closed'
  | 'Notes added';

export type IncidentActivityLogEntry = {
  id: string;
  incident_id?: string | null;
  action_type: ActivityActionType;
  summary: string;
  details?: Record<string, unknown> | null;
  actor_name?: string | null;
  created_at?: string | null;
};

export type IncidentMarkerType =
  | 'Last Known Position'
  | 'Point Last Seen'
  | 'Sonar Contact'
  | 'Hazard'
  | 'Victim Located'
  | 'Evidence / Item Found'
  | 'Diver Entry'
  | 'Boat Staging'
  | 'Command Post'
  | 'Search Assignment';

export type IncidentMarker = {
  id: string;
  incident_id: string;
  marker_type: IncidentMarkerType;
  latitude: number;
  longitude: number;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  photo_url?: string | null;
};

export type MarkerDraft = {
  incident_id: string;
  marker_type: IncidentMarkerType;
  latitude: number;
  longitude: number;
  notes?: string;
  photo_url?: string;
};

export type ResponderLocation = {
  id: string;
  incident_id?: string | null;
  responder_id?: string | null;
  display_name?: string | null;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  recorded_at?: string | null;
};

export type SearchArea = {
  id: string;
  incident_id: string;
  name: string;
  geojson: Record<string, unknown>;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string | null;
};

export type InterfaceMode = 'public' | 'responder' | 'admin';
