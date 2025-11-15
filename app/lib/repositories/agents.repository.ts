/**
 * Agents Repository
 * 
 * Data access layer for agents table
 */

import { getSupabaseAdmin } from '../supabase';
import type { Agent, DatabaseInsert, DatabaseUpdate } from '../../types';

export class AgentsRepository {
  private supabase = getSupabaseAdmin();

  /**
   * Find agent by ID
   */
  async findById(id: string): Promise<Agent | null> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find agent: ${error.message}`);
    }

    return data;
  }

  /**
   * Find agent by Jibble member ID
   */
  async findByJibbleMemberId(jibbleMemberId: string): Promise<Agent | null> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('jibble_member_id', jibbleMemberId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find agent by Jibble ID: ${error.message}`);
    }

    return data;
  }

  /**
   * Find all agents
   */
  async findAll(limit?: number, offset?: number): Promise<Agent[]> {
    let query = this.supabase
      .from('agents')
      .select('*')
      .order('name', { ascending: true });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 100) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find agents: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find agents by group ID
   */
  async findByGroupId(groupId: string): Promise<Agent[]> {
    // This requires a join through activities or a direct group relationship
    // For now, we'll query through activities
    const { data, error } = await this.supabase
      .from('activities')
      .select('agent_id, agents(*)')
      .eq('client_group_id', groupId)
      .order('agents.name', { ascending: true });

    if (error) {
      throw new Error(`Failed to find agents by group: ${error.message}`);
    }

    // Extract unique agents
    const agentMap = new Map<string, Agent>();
    data?.forEach((item: any) => {
      if (item.agents && !agentMap.has(item.agents.id)) {
        agentMap.set(item.agents.id, item.agents);
      }
    });

    return Array.from(agentMap.values());
  }

  /**
   * Create a new agent
   */
  async create(agentData: DatabaseInsert<Agent>): Promise<Agent> {
    const { data, error } = await this.supabase
      .from('agents')
      .insert(agentData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Agent with jibble_member_id "${agentData.jibble_member_id}" already exists`);
      }
      throw new Error(`Failed to create agent: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an agent
   */
  async update(id: string, updates: DatabaseUpdate<Agent>): Promise<Agent> {
    const { data, error } = await this.supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`Agent with id "${id}" not found`);
      }
      throw new Error(`Failed to update agent: ${error.message}`);
    }

    return data;
  }

  /**
   * Upsert an agent (create or update)
   */
  async upsert(agentData: DatabaseInsert<Agent>): Promise<Agent> {
    // Try to find existing agent by jibble_member_id
    const existing = await this.findByJibbleMemberId(agentData.jibble_member_id);

    if (existing) {
      // Update existing agent
      return this.update(existing.id, agentData);
    } else {
      // Create new agent
      return this.create(agentData);
    }
  }

  /**
   * Delete an agent
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('agents')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete agent: ${error.message}`);
    }
  }

  /**
   * Count total agents
   */
  async count(): Promise<number> {
    const { count, error } = await this.supabase
      .from('agents')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Failed to count agents: ${error.message}`);
    }

    return count || 0;
  }
}

// Export singleton instance
export const agentsRepository = new AgentsRepository();

