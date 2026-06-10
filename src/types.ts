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
  zone?: string | null;
  description?: string | null;
  latitude: number;
  longitude: number;
  public_visible: boolean;
  visible_from_water?: boolean | null;
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
