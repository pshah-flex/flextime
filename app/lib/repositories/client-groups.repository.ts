/**
 * Client Groups Repository
 * 
 * Data access layer for client_groups table
 */

import { getSupabaseAdmin } from '../supabase';
import type { ClientGroup, DatabaseInsert, DatabaseUpdate } from '../../types';

export class ClientGroupsRepository {
  private supabase = getSupabaseAdmin();

  /**
   * Find client group by ID
   */
  async findById(id: string): Promise<ClientGroup | null> {
    const { data, error } = await this.supabase
      .from('client_groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find client group: ${error.message}`);
    }

    return data;
  }

  /**
   * Find client group by Jibble group ID
   */
  async findByJibbleGroupId(jibbleGroupId: string): Promise<ClientGroup | null> {
    const { data, error } = await this.supabase
      .from('client_groups')
      .select('*')
      .eq('jibble_group_id', jibbleGroupId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find client group by Jibble ID: ${error.message}`);
    }

    return data;
  }

  /**
   * Find all client groups
   */
  async findAll(limit?: number, offset?: number): Promise<ClientGroup[]> {
    let query = this.supabase
      .from('client_groups')
      .select('*')
      .order('group_name', { ascending: true });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 100) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find client groups: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new client group
   */
  async create(groupData: DatabaseInsert<ClientGroup>): Promise<ClientGroup> {
    const { data, error } = await this.supabase
      .from('client_groups')
      .insert(groupData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Client group with jibble_group_id "${groupData.jibble_group_id}" already exists`);
      }
      throw new Error(`Failed to create client group: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a client group
   */
  async update(id: string, updates: DatabaseUpdate<ClientGroup>): Promise<ClientGroup> {
    const { data, error } = await this.supabase
      .from('client_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`Client group with id "${id}" not found`);
      }
      throw new Error(`Failed to update client group: ${error.message}`);
    }

    return data;
  }

  /**
   * Upsert a client group (create or update)
   */
  async upsert(groupData: DatabaseInsert<ClientGroup>): Promise<ClientGroup> {
    // Try to find existing group by jibble_group_id
    const existing = await this.findByJibbleGroupId(groupData.jibble_group_id);

    if (existing) {
      // Update existing group
      return this.update(existing.id, groupData);
    } else {
      // Create new group
      return this.create(groupData);
    }
  }

  /**
   * Delete a client group
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('client_groups')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete client group: ${error.message}`);
    }
  }

  /**
   * Count total client groups
   */
  async count(): Promise<number> {
    const { count, error } = await this.supabase
      .from('client_groups')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Failed to count client groups: ${error.message}`);
    }

    return count || 0;
  }
}

// Export singleton instance
export const clientGroupsRepository = new ClientGroupsRepository();

