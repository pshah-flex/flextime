/**
 * Query Optimization Service
 * 
 * Provides optimized queries and database views for common aggregations
 */

import { getSupabaseAdmin } from '../supabase';

const supabase = getSupabaseAdmin();

/**
 * Create database view for activity sessions with joined data
 * This view pre-joins sessions with agents, groups, and activities for faster queries
 */
export async function createActivitySessionsView(): Promise<void> {
  const sql = `
    CREATE OR REPLACE VIEW activity_sessions_enriched AS
    SELECT 
      s.id,
      s.activity_id,
      s.agent_id,
      s.client_group_id,
      s.start_time_utc,
      s.end_time_utc,
      s.duration_minutes,
      s.is_complete,
      s.created_at,
      a.name as agent_name,
      a.email as agent_email,
      a.timezone as agent_timezone,
      cg.group_name,
      cg.jibble_group_id,
      act.belongs_to_date,
      act.activity_id as jibble_activity_id,
      act.entry_type
    FROM activity_sessions s
    LEFT JOIN agents a ON s.agent_id = a.id
    LEFT JOIN client_groups cg ON s.client_group_id = cg.id
    LEFT JOIN activities act ON s.activity_id = act.id;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    // If exec_sql doesn't exist, try direct SQL execution via MCP
    console.warn('Could not create view via Supabase client. Use MCP or direct SQL.');
    throw new Error(`Failed to create view: ${error.message}`);
  }
}

/**
 * Create materialized view for daily aggregations
 * This can be refreshed periodically for faster queries
 */
export async function createDailyAggregationsView(): Promise<void> {
  const sql = `
    CREATE MATERIALIZED VIEW IF NOT EXISTS daily_aggregations AS
    SELECT 
      DATE(start_time_utc) as date,
      agent_id,
      client_group_id,
      COUNT(*) as session_count,
      SUM(CASE WHEN is_complete THEN duration_minutes ELSE 0 END) as total_minutes,
      SUM(CASE WHEN NOT is_complete THEN 1 ELSE 0 END) as incomplete_sessions
    FROM activity_sessions
    GROUP BY DATE(start_time_utc), agent_id, client_group_id;

    CREATE INDEX IF NOT EXISTS idx_daily_aggregations_date 
      ON daily_aggregations(date);
    CREATE INDEX IF NOT EXISTS idx_daily_aggregations_agent 
      ON daily_aggregations(agent_id);
    CREATE INDEX IF NOT EXISTS idx_daily_aggregations_group 
      ON daily_aggregations(client_group_id);
  `;

  const { error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    console.warn('Could not create materialized view via Supabase client. Use MCP or direct SQL.');
    throw new Error(`Failed to create materialized view: ${error.message}`);
  }
}

/**
 * Refresh materialized views
 */
export async function refreshMaterializedViews(): Promise<void> {
  const sql = `REFRESH MATERIALIZED VIEW daily_aggregations;`;

  const { error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    throw new Error(`Failed to refresh materialized views: ${error.message}`);
  }
}

/**
 * Get paginated results with cursor-based pagination
 */
export async function getPaginatedResults<T>(
  table: string,
  pageSize: number = 100,
  cursor?: string
): Promise<{ data: T[]; nextCursor?: string }> {
  let query = supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(pageSize + 1); // Fetch one extra to check if there's more

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get paginated results: ${error.message}`);
  }

  const hasMore = data && data.length > pageSize;
  const results = hasMore ? data.slice(0, pageSize) : (data || []);
  const nextCursor = hasMore && results.length > 0 
    ? results[results.length - 1].created_at 
    : undefined;

  return {
    data: results as T[],
    nextCursor,
  };
}

