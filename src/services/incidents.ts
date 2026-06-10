import { supabase } from '../lib/supabase';
import type {
  Incident,
  IncidentMarker,
  IncidentPriority,
  IncidentStatus,
  MarkerDraft,
  WaterRescueIncidentType,
} from '../types';

export const loadIncidents = async (includeClosed = false): Promise<Incident[]> => {
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false });

  if (!includeClosed) {
    query = query.neq('status', 'Closed');
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Incident[];
};

export const createIncident = async (incident: {
  name: string;
  incident_type: WaterRescueIncidentType;
  priority?: IncidentPriority;
  tc911_run_number?: string | null;
  command_notes?: string | null;
}) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('incidents')
    .insert({
      ...incident,
      priority: incident.priority ?? 'Routine',
      status: 'Active',
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Incident;
};

export const closeIncident = async (
  incidentId: string,
  closeoutNotes: string,
  closedBy?: string,
) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('incidents')
    .update({
      status: 'Closed',
      closeout_notes: closeoutNotes,
      closed_at: new Date().toISOString(),
      closed_by: closedBy ?? null,
    })
    .eq('id', incidentId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Incident;
};

export const updateIncidentStatus = async (
  incidentId: string,
  status: IncidentStatus,
) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('incidents')
    .update({ status })
    .eq('id', incidentId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Incident;
};

export const updateIncidentCommandNotes = async (
  incidentId: string,
  commandNotes: string,
) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('incidents')
    .update({ command_notes: commandNotes })
    .eq('id', incidentId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Incident;
};

export const loadIncidentMarkers = async (incidentId?: string): Promise<IncidentMarker[]> => {
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from('incident_markers')
    .select('*')
    .order('created_at', { ascending: false });

  if (incidentId) {
    query = query.eq('incident_id', incidentId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as IncidentMarker[];
};

export const saveIncidentMarker = async (marker: MarkerDraft) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('incident_markers')
    .insert(marker)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as IncidentMarker;
};
