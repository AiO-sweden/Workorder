import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your actual Supabase credentials
// Get these from: https://supabase.com → Your Project → Settings → API
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_PROJECT_URL';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get current user's organization
export const getCurrentUserOrganization = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('schedulable_users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user organization:', error);
    return null;
  }

  return data?.organization_id;
};

// Helper function to get current user details
export const getCurrentUserDetails = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('schedulable_users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user details:', error);
    return null;
  }

  return data;
};
