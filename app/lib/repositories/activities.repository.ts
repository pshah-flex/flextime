/**
 * Activities Repository
 * 
 * Data access layer for activities table (Jibble time entries)
 */

import { getSupabaseAdmin } from '../supabase';
import type { Activity, DatabaseInsert, DatabaseUpdate, ActivityQueryParams } from '../../types';

export class ActivitiesRepository {
  private supabase = getSupabaseAdmin();

  /**
   * Find activity by ID
   */
  async findById(id: string): Promise<Activity | null> {
    const { data, error } = await this.supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find activity: ${error.message}`);
    }

    return data;
  }

  /**
   * Find activity by Jibble time entry ID
   */
  async findByJibbleTimeEntryId(jibbleTimeEntryId: string): Promise<Activity | null> {
    const { data, error } = await this.supabase
      .from('activities')
      .select('*')
      .eq('jibble_time_entry_id', jibbleTimeEntryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find activity by Jibble ID: ${error.message}`);
    }

    return data;
  }

  /**
   * Find activities with filters
   */
  async findMany(params: ActivityQueryParams): Promise<Activity[]> {
    let query = this.supabase
      .from('activities')
      .select('*')
      .gte('time_utc', params.startDate)
      .lte('time_utc', params.endDate)
      .order('time_utc', { ascending: true });

    if (params.agentId) {
      query = query.eq('agent_id', params.agentId);
    }

    if (params.clientGroupId) {
      query = query.eq('client_group_id', params.clientGroupId);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find activities: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find activities by agent ID
   */
  async findByAgentId(agentId: string, startDate?: string, endDate?: string): Promise<Activity[]> {
    let query = this.supabase
      .from('activities')
      .select('*')
      .eq('agent_id', agentId)
      .order('time_utc', { ascending: true });

    if (startDate) {
      query = query.gte('time_utc', startDate);
    }

    if (endDate) {
      query = query.lte('time_utc', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find activities by agent: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find activities by client group ID
   */
  async findByClientGroupId(groupId: string, startDate?: string, endDate?: string): Promise<Activity[]> {
    let query = this.supabase
      .from('activities')
      .select('*')
      .eq('client_group_id', groupId)
      .order('time_utc', { ascending: true });

    if (startDate) {
      query = query.gte('time_utc', startDate);
    }

    if (endDate) {
      query = query.lte('time_utc', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find activities by group: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new activity
   */
  async create(activityData: DatabaseInsert<Activity>): Promise<Activity> {
    const { data, error } = await this.supabase
      .from('activities')
      .insert(activityData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Activity with jibble_time_entry_id "${activityData.jibble_time_entry_id}" already exists`);
      }
      throw new Error(`Failed to create activity: ${error.message}`);
    }

    return data;
  }

  /**
   * Create multiple activities (bulk insert)
   */
  async createMany(activitiesData: DatabaseInsert<Activity>[]): Promise<Activity[]> {
    if (activitiesData.length === 0) return [];

    const { data, error } = await this.supabase
      .from('activities')
      .insert(activitiesData)
      .select();

    if (error) {
      throw new Error(`Failed to create activities: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update an activity
   */
  async update(id: string, updates: DatabaseUpdate<Activity>): Promise<Activity> {
    const { data, error } = await this.supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`Activity with id "${id}" not found`);
      }
      throw new Error(`Failed to update activity: ${error.message}`);
    }

    return data;
  }

  /**
   * Upsert an activity (create or update)
   */
  async upsert(activityData: DatabaseInsert<Activity>): Promise<Activity> {
    // Try to find existing activity by jibble_time_entry_id
    const existing = await this.findByJibbleTimeEntryId(activityData.jibble_time_entry_id);

    if (existing) {
      // Update existing activity
      return this.update(existing.id, activityData);
    } else {
      // Create new activity
      return this.create(activityData);
    }
  }

  /**
   * Delete an activity
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete activity: ${error.message}`);
    }
  }

  /**
   * Count activities
   */
  async count(filters?: { agentId?: string; clientGroupId?: string; startDate?: string; endDate?: string }): Promise<number> {
    let query = this.supabase
      .from('activities')
      .select('*', { count: 'exact', head: true });

    if (filters?.agentId) {
      query = query.eq('agent_id', filters.agentId);
    }

    if (filters?.clientGroupId) {
      query = query.eq('client_group_id', filters.clientGroupId);
    }

    if (filters?.startDate) {
      query = query.gte('time_utc', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('time_utc', filters.endDate);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count activities: ${error.message}`);
    }

    return count || 0;
  }
}

// Export singleton instance
export const activitiesRepository = new ActivitiesRepository();

