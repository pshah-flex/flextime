/**
 * Airtable Integration Example
 * 
 * This is a template file. Once you have your Airtable credentials:
 * 1. Copy this file to lib/airtable.ts
 * 2. Fill in your actual Base ID, Table name, and field names
 * 3. The Personal Access Token will come from environment variables
 */

interface ClientRecord {
  id: string;
  fields: {
    email: string;
    clientName?: string;
    jibbleGroupId?: string;
    jibbleGroupName?: string;
    // Add other fields as needed
  };
}

interface AirtableConfig {
  baseId: string;
  tableName: string;
  emailField: string;
  groupIdField?: string;
  groupNameField?: string;
}

/**
 * Fetch client emails from Airtable
 * 
 * @returns Array of client records with email and group information
 */
export async function fetchClientEmails(
  config: AirtableConfig
): Promise<ClientRecord[]> {
  const { baseId, tableName, emailField } = config;
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;

  if (!token) {
    throw new Error('AIRTABLE_PERSONAL_ACCESS_TOKEN is not set');
  }

  const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.records as ClientRecord[];
}

/**
 * Map client emails to Jibble groups
 * 
 * @param clients Array of client records from Airtable
 * @returns Map of email -> group information
 */
export function mapEmailsToGroups(clients: ClientRecord[]) {
  const emailToGroup = new Map<string, {
    groupId?: string;
    groupName?: string;
    clientName?: string;
  }>();

  for (const client of clients) {
    const email = client.fields.email;
    if (email) {
      emailToGroup.set(email, {
        groupId: client.fields.jibbleGroupId,
        groupName: client.fields.jibbleGroupName,
        clientName: client.fields.clientName,
      });
    }
  }

  return emailToGroup;
}

/**
 * Example usage:
 * 
 * const config = {
 *   baseId: 'your_base_id_here',
 *   tableName: 'Clients',
 *   emailField: 'Email',
 *   groupIdField: 'Jibble Group ID',
 *   groupNameField: 'Jibble Group Name',
 * };
 * 
 * const clients = await fetchClientEmails(config);
 * const emailMap = mapEmailsToGroups(clients);
 */

