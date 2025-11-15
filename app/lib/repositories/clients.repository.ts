/**
 * Clients Repository
 * 
 * Data access layer for clients table (from Airtable)
 */

import { getSupabaseAdmin } from '../supabase';
import type { Client, DatabaseInsert, DatabaseUpdate } from '../../types';

export class ClientsRepository {
  private supabase = getSupabaseAdmin();

  /**
   * Find client by ID
   */
  async findById(id: string): Promise<Client | null> {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find client: ${error.message}`);
    }

    return data;
  }

  /**
   * Find client by email
   */
  async findByEmail(email: string): Promise<Client | null> {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find client by email: ${error.message}`);
    }

    return data;
  }

  /**
   * Find client by Airtable record ID
   */
  async findByAirtableRecordId(airtableRecordId: string): Promise<Client | null> {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('airtable_record_id', airtableRecordId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find client by Airtable ID: ${error.message}`);
    }

    return data;
  }

  /**
   * Find all clients
   */
  async findAll(limit?: number, offset?: number): Promise<Client[]> {
    let query = this.supabase
      .from('clients')
      .select('*')
      .order('email', { ascending: true });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 100) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find clients: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new client
   */
  async create(clientData: DatabaseInsert<Client>): Promise<Client> {
    const { data, error } = await this.supabase
      .from('clients')
      .insert({
        ...clientData,
        email: clientData.email.toLowerCase(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Client with email "${clientData.email}" or Airtable ID "${clientData.airtable_record_id}" already exists`);
      }
      throw new Error(`Failed to create client: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a client
   */
  async update(id: string, updates: DatabaseUpdate<Client>): Promise<Client> {
    const updateData: any = { ...updates };
    if (updates.email) {
      updateData.email = updates.email.toLowerCase();
    }

    const { data, error } = await this.supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`Client with id "${id}" not found`);
      }
      throw new Error(`Failed to update client: ${error.message}`);
    }

    return data;
  }

  /**
   * Upsert a client (create or update)
   */
  async upsert(clientData: DatabaseInsert<Client>): Promise<Client> {
    // Try to find existing client by Airtable record ID first, then email
    const existing = await this.findByAirtableRecordId(clientData.airtable_record_id) ||
                     await this.findByEmail(clientData.email);

    if (existing) {
      // Update existing client
      return this.update(existing.id, clientData);
    } else {
      // Create new client
      return this.create(clientData);
    }
  }

  /**
   * Delete a client
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete client: ${error.message}`);
    }
  }
}

// Export singleton instance
export const clientsRepository = new ClientsRepository();

