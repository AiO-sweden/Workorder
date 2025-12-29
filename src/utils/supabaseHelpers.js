/**
 * Supabase Helper Functions
 * Common patterns for migrating from Firestore to Supabase
 */

import { supabase } from '../supabase';

/**
 * Get current user's organization ID
 */
export async function getCurrentOrganizationId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('schedulable_users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching organization:', error);
    return null;
  }

  return data?.organization_id;
}

/**
 * Get all records from a table for the current organization
 * @param {string} tableName - Name of the table
 * @param {string} selectFields - Fields to select (default: '*')
 * @returns {Promise<Array>} Array of records
 */
export async function getOrganizationRecords(tableName, selectFields = '*') {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from(tableName)
    .select(selectFields)
    .eq('organization_id', organizationId);

  if (error) {
    console.error(`Error fetching ${tableName}:`, error);
    return [];
  }

  return data || [];
}

/**
 * Get a single record by ID
 * @param {string} tableName - Name of the table
 * @param {string} id - Record ID
 * @param {string} selectFields - Fields to select (default: '*')
 * @returns {Promise<Object|null>} Record or null
 */
export async function getRecordById(tableName, id, selectFields = '*') {
  const { data, error } = await supabase
    .from(tableName)
    .select(selectFields)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching ${tableName} record:`, error);
    return null;
  }

  return data;
}

/**
 * Create a new record with organization_id
 * @param {string} tableName - Name of the table
 * @param {Object} record - Record data (without organization_id)
 * @returns {Promise<Object|null>} Created record or null
 */
export async function createOrganizationRecord(tableName, record) {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) {
    console.error('No organization ID found');
    return null;
  }

  const { data, error } = await supabase
    .from(tableName)
    .insert([{
      ...record,
      organization_id: organizationId,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    console.error(`Error creating ${tableName} record:`, error);
    throw error;
  }

  return data;
}

/**
 * Update a record
 * @param {string} tableName - Name of the table
 * @param {string} id - Record ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated record or null
 */
export async function updateRecord(tableName, id, updates) {
  const { data, error } = await supabase
    .from(tableName)
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating ${tableName} record:`, error);
    throw error;
  }

  return data;
}

/**
 * Delete a record
 * @param {string} tableName - Name of the table
 * @param {string} id - Record ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteRecord(tableName, id) {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting ${tableName} record:`, error);
    return false;
  }

  return true;
}

/**
 * Subscribe to real-time changes for a table (organization-scoped)
 * @param {string} tableName - Name of the table
 * @param {Function} callback - Callback function to handle changes
 * @returns {Function} Unsubscribe function
 */
export async function subscribeToOrganizationTable(tableName, callback) {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) {
    console.error('No organization ID found');
    return () => {};
  }

  const subscription = supabase
    .channel(`${tableName}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
        filter: `organization_id=eq.${organizationId}`
      },
      callback
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Firestore to Supabase field name converter
 * Converts camelCase to snake_case for consistency
 */
export function toSnakeCase(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

/**
 * Supabase to Firestore field name converter
 * Converts snake_case to camelCase for backwards compatibility
 */
export function toCamelCase(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

/**
 * Batch operations helper
 * Supabase can insert multiple records at once
 */
export async function batchInsert(tableName, records) {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) {
    console.error('No organization ID found');
    return [];
  }

  const recordsWithOrg = records.map(record => ({
    ...record,
    organization_id: organizationId,
    created_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from(tableName)
    .insert(recordsWithOrg)
    .select();

  if (error) {
    console.error(`Error batch inserting to ${tableName}:`, error);
    throw error;
  }

  return data || [];
}

/**
 * Query with filters (replacement for Firestore where clauses)
 * @param {string} tableName - Name of the table
 * @param {Array} filters - Array of filter objects [{field, operator, value}, ...]
 * @param {string} selectFields - Fields to select
 * @returns {Promise<Array>} Array of matching records
 */
export async function queryWithFilters(tableName, filters = [], selectFields = '*') {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) return [];

  let query = supabase
    .from(tableName)
    .select(selectFields)
    .eq('organization_id', organizationId);

  // Apply filters
  filters.forEach(({ field, operator, value }) => {
    switch (operator) {
      case '==':
        query = query.eq(field, value);
        break;
      case '!=':
        query = query.neq(field, value);
        break;
      case '>':
        query = query.gt(field, value);
        break;
      case '>=':
        query = query.gte(field, value);
        break;
      case '<':
        query = query.lt(field, value);
        break;
      case '<=':
        query = query.lte(field, value);
        break;
      case 'in':
        query = query.in(field, value);
        break;
      case 'contains':
        query = query.contains(field, value);
        break;
      default:
        console.warn(`Unknown operator: ${operator}`);
    }
  });

  const { data, error } = await query;

  if (error) {
    console.error(`Error querying ${tableName}:`, error);
    return [];
  }

  return data || [];
}
