/**
 * Client Group Mappings Repository
 * 
 * Data access layer for client_group_mappings table (many-to-many relationship)
 */

import { getSupabaseAdmin } from '../supabase';
import type { ClientGroupMapping, DatabaseInsert } from '../../types';

export class ClientGroupMappingsRepository {
  private supabase = getSupabaseAdmin();

  /**
   * Find mapping by ID
   */
  async findById(id: string): Promise<ClientGroupMapping | null> {
    const { data, error } = await this.supabase
      .from('client_group_mappings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find mapping: ${error.message}`);
    }

    return data;
  }

  /**
   * Find all groups for a client
   */
  async findByClientId(clientId: string): Promise<ClientGroupMapping[]> {
    const { data, error } = await this.supabase
      .from('client_group_mappings')
      .select('*')
      .eq('client_id', clientId);

    if (error) {
      throw new Error(`Failed to find mappings by client: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find all clients for a group
   */
  async findByClientGroupId(clientGroupId: string): Promise<ClientGroupMapping[]> {
    const { data, error } = await this.supabase
      .from('client_group_mappings')
      .select('*')
      .eq('client_group_id', clientGroupId);

    if (error) {
      throw new Error(`Failed to find mappings by group: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find specific mapping
   */
  async findByClientAndGroup(clientId: string, clientGroupId: string): Promise<ClientGroupMapping | null> {
    const { data, error } = await this.supabase
      .from('client_group_mappings')
      .select('*')
      .eq('client_id', clientId)
      .eq('client_group_id', clientGroupId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find mapping: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new mapping
   */
  async create(mappingData: DatabaseInsert<ClientGroupMapping>): Promise<ClientGroupMapping> {
    const { data, error } = await this.supabase
      .from('client_group_mappings')
      .insert(mappingData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Mapping already exists for client "${mappingData.client_id}" and group "${mappingData.client_group_id}"`);
      }
      throw new Error(`Failed to create mapping: ${error.message}`);
    }

    return data;
  }

  /**
   * Create multiple mappings (bulk insert)
   */
  async createMany(mappingsData: DatabaseInsert<ClientGroupMapping>[]): Promise<ClientGroupMapping[]> {
    if (mappingsData.length === 0) return [];

    const { data, error } = await this.supabase
      .from('client_group_mappings')
      .insert(mappingsData)
      .select();

    if (error) {
      throw new Error(`Failed to create mappings: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Upsert a mapping (create if doesn't exist)
   */
  async upsert(mappingData: DatabaseInsert<ClientGroupMapping>): Promise<ClientGroupMapping> {
    const existing = await this.findByClientAndGroup(
      mappingData.client_id,
      mappingData.client_group_id
    );

    if (existing) {
      return existing;
    } else {
      return this.create(mappingData);
    }
  }

  /**
   * Delete a mapping
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('client_group_mappings')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete mapping: ${error.message}`);
    }
  }

  /**
   * Delete mapping by client and group
   */
  async deleteByClientAndGroup(clientId: string, clientGroupId: string): Promise<void> {
    const { error } = await this.supabase
      .from('client_group_mappings')
      .delete()
      .eq('client_id', clientId)
      .eq('client_group_id', clientGroupId);

    if (error) {
      throw new Error(`Failed to delete mapping: ${error.message}`);
    }
  }

  /**
   * Delete all mappings for a client
   */
  async deleteByClientId(clientId: string): Promise<void> {
    const { error } = await this.supabase
      .from('client_group_mappings')
      .delete()
      .eq('client_id', clientId);

    if (error) {
      throw new Error(`Failed to delete mappings for client: ${error.message}`);
    }
  }

  /**
   * Sync mappings for a client (replace all with new set)
   */
  async syncForClient(clientId: string, groupIds: string[]): Promise<ClientGroupMapping[]> {
    // Delete existing mappings
    await this.deleteByClientId(clientId);

    // Create new mappings
    const mappingsData: DatabaseInsert<ClientGroupMapping>[] = groupIds.map(groupId => ({
      client_id: clientId,
      client_group_id: groupId,
    }));

    return this.createMany(mappingsData);
  }
}

// Export singleton instance
export const clientGroupMappingsRepository = new ClientGroupMappingsRepository();

