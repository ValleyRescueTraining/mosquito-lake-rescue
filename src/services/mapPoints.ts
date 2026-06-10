import { supabase } from '../lib/supabase';
import type { MapPoint, RescueZone } from '../types';

export const loadMapPoints = async (publicOnly = false): Promise<MapPoint[]> => {
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from('map_points')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (publicOnly) {
    query = query.eq('public_visible', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MapPoint[];
};

export const saveMapPoint = async (point: Partial<MapPoint>) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.from('map_points').upsert(point).select().single();

  if (error) {
    throw new Error(error.message);
  }

  return data as MapPoint;
};

export const loadRescueZones = async (): Promise<RescueZone[]> => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('rescue_zones')
    .select('*')
    .eq('active', true)
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RescueZone[];
};
