/**
 * Airtable Integration
 * 
 * Fetches client emails and maps them to Jibble groups
 */

interface ClientRecord {
  id: string;
  fields: {
    Email: string;
    'Jibble Group ID'?: string | string[]; // Can be single value, array (multi-select), or comma-separated string
    // Add other fields as needed
    [key: string]: any;
  };
}

interface AirtableResponse {
  records: ClientRecord[];
}

interface ClientEmailMapping {
  email: string;
  jibbleGroupIds: string[]; // Array to support multiple groups
  recordId: string;
}

/**
 * Fetch client emails from Airtable
 * 
 * @returns Array of client records with email and group information
 */
export async function fetchClientEmails(): Promise<ClientEmailMapping[]> {
  const baseId = process.env.AIRTABLE_BASE_ID || 'appvhgZiUha2A1OQg';
  const tableName = 'Clients';
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;

  if (!token) {
    throw new Error('AIRTABLE_PERSONAL_ACCESS_TOKEN is not set in environment variables');
  }

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data: AirtableResponse = await response.json();
  
  // Map records to our format
  return data.records
    .filter(record => record.fields.Email) // Only include records with emails
    .map(record => {
      const groupIdField = record.fields['Jibble Group ID'];
      let groupIds: string[] = [];
      
      // Handle different formats:
      // 1. Array (multi-select field in Airtable)
      if (Array.isArray(groupIdField)) {
        groupIds = groupIdField.filter(id => id && typeof id === 'string');
      }
      // 2. String (could be single value or comma-separated)
      else if (typeof groupIdField === 'string') {
        // Check if it's comma-separated
        if (groupIdField.includes(',')) {
          groupIds = groupIdField.split(',').map(id => id.trim()).filter(id => id.length > 0);
        } else {
          // Single value
          groupIds = [groupIdField];
        }
      }
      
      return {
        email: record.fields.Email,
        jibbleGroupIds: groupIds,
        recordId: record.id,
      };
    });
}

/**
 * Map client emails to Jibble groups (one-to-many)
 * 
 * @returns Map of email -> array of group IDs
 */
export async function getEmailToGroupsMap(): Promise<Map<string, string[]>> {
  const clients = await fetchClientEmails();
  const emailToGroups = new Map<string, string[]>();

  for (const client of clients) {
    emailToGroups.set(client.email, client.jibbleGroupIds);
  }

  return emailToGroups;
}

/**
 * Map client emails to Jibble groups (legacy - returns first group only)
 * @deprecated Use getEmailToGroupsMap() instead
 */
export async function getEmailToGroupMap(): Promise<Map<string, string | undefined>> {
  const clients = await fetchClientEmails();
  const emailToGroup = new Map<string, string | undefined>();

  for (const client of clients) {
    emailToGroup.set(client.email, client.jibbleGroupIds[0] || undefined);
  }

  return emailToGroup;
}

/**
 * Get all client emails as an array
 * 
 * @returns Array of email addresses
 */
export async function getAllClientEmails(): Promise<string[]> {
  const clients = await fetchClientEmails();
  return clients.map(client => client.email);
}

/**
 * Get clients grouped by Jibble Group ID
 * 
 * @returns Map of groupId -> array of emails
 */
export async function getClientsByGroup(): Promise<Map<string, string[]>> {
  const clients = await fetchClientEmails();
  const groupToEmails = new Map<string, string[]>();

  for (const client of clients) {
    // Each client can belong to multiple groups
    for (const groupId of client.jibbleGroupIds) {
      if (!groupToEmails.has(groupId)) {
        groupToEmails.set(groupId, []);
      }
      groupToEmails.get(groupId)!.push(client.email);
    }
  }

  return groupToEmails;
}

/**
 * Get all group IDs for a specific client email
 * 
 * @param email Client email address
 * @returns Array of Jibble group IDs for this client
 */
export async function getGroupsForClient(email: string): Promise<string[]> {
  const clients = await fetchClientEmails();
  const client = clients.find(c => c.email.toLowerCase() === email.toLowerCase());
  return client?.jibbleGroupIds || [];
}

