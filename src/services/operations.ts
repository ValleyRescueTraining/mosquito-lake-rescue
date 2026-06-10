import { supabase } from '../lib/supabase';
import type {
  ActivityActionType,
  Agency,
  AssignmentStatus,
  EvidenceItem,
  IncidentActivityLogEntry,
  IncidentRoleAssignment,
  Resource,
  ResourceStatus,
  SearchAssignment,
} from '../types';

export const loadAgencies = async (): Promise<Agency[]> => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Agency[];
};

export const saveAgency = async (agency: Partial<Agency>) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('agencies')
    .upsert({ ...agency, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Agency;
};

export const loadResources = async (): Promise<Resource[]> => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('resource_type', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Resource[];
};

export const saveResource = async (resource: Partial<Resource>) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('resources')
    .upsert({ ...resource, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Resource;
};

export const assignResourceToIncident = async (
  resourceId: string,
  incidentId: string,
  status: ResourceStatus = 'Assigned',
  zoneId?: string | null,
) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('resources')
    .update({
      current_incident_id: incidentId,
      assigned_zone_id: zoneId ?? null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', resourceId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Resource;
};

export const updateResourceStatus = async (
  resourceId: string,
  status: ResourceStatus,
) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('resources')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', resourceId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Resource;
};

export const loadAssignments = async (incidentId?: string): Promise<SearchAssignment[]> => {
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from('search_assignments')
    .select('*')
    .order('created_at', { ascending: false });

  if (incidentId) {
    query = query.eq('incident_id', incidentId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SearchAssignment[];
};

export const saveAssignment = async (assignment: Partial<SearchAssignment>) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const payload = {
    ...assignment,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('search_assignments')
    .upsert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SearchAssignment;
};

export const updateAssignmentStatus = async (
  assignmentId: string,
  status: AssignmentStatus,
  completionNotes?: string,
) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('search_assignments')
    .update({
      status,
      end_time: status === 'Completed' ? new Date().toISOString() : null,
      completion_notes: completionNotes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assignmentId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SearchAssignment;
};

export const loadEvidenceItems = async (incidentId?: string): Promise<EvidenceItem[]> => {
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from('evidence_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (incidentId) {
    query = query.eq('incident_id', incidentId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as EvidenceItem[];
};

export const saveEvidenceItem = async (evidence: Partial<EvidenceItem>) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('evidence_items')
    .insert(evidence)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as EvidenceItem;
};

export const loadRoleAssignments = async (
  incidentId?: string,
): Promise<IncidentRoleAssignment[]> => {
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from('incident_role_assignments')
    .select('*')
    .order('created_at', { ascending: true });

  if (incidentId) {
    query = query.eq('incident_id', incidentId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as IncidentRoleAssignment[];
};

export const saveRoleAssignment = async (
  roleAssignment: Partial<IncidentRoleAssignment>,
) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('incident_role_assignments')
    .upsert({ ...roleAssignment, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as IncidentRoleAssignment;
};

export const loadActivityLog = async (
  incidentId?: string,
): Promise<IncidentActivityLogEntry[]> => {
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from('incident_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (incidentId) {
    query = query.eq('incident_id', incidentId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as IncidentActivityLogEntry[];
};

export const addActivityLogEntry = async (entry: {
  incident_id?: string | null;
  action_type: ActivityActionType;
  summary: string;
  details?: Record<string, unknown>;
  actor_name?: string;
}) => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('incident_activity_log')
    .insert(entry)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as IncidentActivityLogEntry;
};
