-- Add unique constraint to prevent duplicate sessions
-- A session is uniquely identified by agent_id, client_group_id, and start_time_utc

-- First, remove any duplicate sessions (keep the first one)
DELETE FROM activity_sessions
WHERE id NOT IN (
  SELECT MIN(id)
  FROM activity_sessions
  GROUP BY agent_id, client_group_id, start_time_utc
);

-- Add unique constraint
ALTER TABLE activity_sessions
ADD CONSTRAINT activity_sessions_agent_group_start_unique 
UNIQUE (agent_id, client_group_id, start_time_utc);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_activity_sessions_agent_group_start 
ON activity_sessions(agent_id, client_group_id, start_time_utc);

