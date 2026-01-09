import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  async function signup(email, password, additionalData) {
    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: additionalData.firstName,
          last_name: additionalData.lastName,
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned from signup');

    const user = authData.user;

    // Check if user was pre-invited (exists without auth id)
    const { data: existingUser } = await supabase
      .from('schedulable_users')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    if (existingUser) {
      // User was invited - just update their details
      const { error: updateError } = await supabase
        .from('schedulable_users')
        .update({
          name: `${additionalData.firstName} ${additionalData.lastName}`
        })
        .eq('email', user.email);

      if (updateError) throw updateError;

      console.log('✅ Updated pre-invited user:', user.email);
      return; // Don't create organization or default settings
    }

    // Create a new organization for this user
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        company_name: additionalData.companyName || `${additionalData.firstName}'s Organization`,
        phone: additionalData.phoneNumber,
        wants_to_pay: additionalData.wantsToPay || false,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (orgError) throw orgError;

    // Save user information in schedulable_users table
    const { error: userError } = await supabase
      .from('schedulable_users')
      .insert([{
        id: user.id,
        email: user.email,
        name: `${additionalData.firstName} ${additionalData.lastName}`,
        organization_id: orgData.id,
        role: 'admin', // First user is always admin
        created_at: new Date().toISOString(),
      }]);

    if (userError) throw userError;

    // Create default settings for the organization
    const { error: settingsError } = await supabase
      .from('settings')
      .insert([{
        organization_id: orgData.id,
        time_codes: [],
        work_types: [],
        created_at: new Date().toISOString(),
      }]);

    if (settingsError) {
      console.error('Error creating default settings:', settingsError);
      // Don't throw - settings can be created later
    }

    return authData;
  }

  // Login with email and password
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  // Logout
  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Reset password
  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  }

  // Listen to auth state changes
  useEffect(() => {
    let mounted = true;

    // Safety timeout - always stop loading after 10 seconds
    const loadingTimeout = setTimeout(() => {
      console.log('⏱️ Loading timeout - forcing loading to false');
      if (mounted) {
        setLoading(false);
      }
    }, 10000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) {
        console.log('⚠️ Component unmounted before session fetch completed');
        return;
      }

      console.log('🔑 Initial session:', session?.user ? 'User found' : 'No user');
      setCurrentUser(session?.user ?? null);

      if (session?.user) {
        console.log('🔍 Initial session has user, calling fetchUserDetails with ID:', session.user.id);
        // Fetch user details from schedulable_users table
        fetchUserDetails(session.user.id).catch(err => {
          console.error('❌ Failed to fetch user details:', err);
          setLoading(false);
        });
      } else {
        console.log('⚠️ No user in initial session, setting userDetails to null');
        setUserDetails(null);
        setLoading(false);
      }
    }).catch(err => {
      console.error('❌ Error getting session:', err);
      if (mounted) {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) {
        console.log('⚠️ Component unmounted before auth state change processed');
        return;
      }

      console.log('🔄 Auth state changed:', event, session?.user ? 'User present' : 'No user');

      // Only update if this is a meaningful change (not just a token refresh)
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setCurrentUser(null);
        setUserDetails(null);
        setLoading(false);
        return;
      }

      setCurrentUser(session?.user ?? null);

      // Only fetch user details if we don't already have them or if user changed
      if (session?.user) {
        if (!userDetails || userDetails.id !== session.user.id) {
          console.log('🔍 Auth state change has user, calling fetchUserDetails with ID:', session.user.id);
          await fetchUserDetails(session.user.id).catch(err => {
            console.error('❌ Failed to fetch user details:', err);
          });
        } else {
          console.log('✅ User details already loaded, skipping fetch');
        }
      } else {
        console.log('⚠️ No user in auth state change, setting userDetails to null');
        setUserDetails(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Helper function to fetch user details - sets immediately, updates if data arrives
  async function fetchUserDetails(userId) {
    console.log('🔍 fetchUserDetails: Starting for userId:', userId);

    // Set minimal userDetails IMMEDIATELY so app can continue
    setUserDetails({
      id: userId,
      organizationId: null,
      role: 'user'
    });
    setLoading(false);

    // Try to fetch real data in background (non-blocking)
    console.log('🔍 fetchUserDetails: Attempting background fetch...');
    supabase
      .from('schedulable_users')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (data) {
          console.log('✅ fetchUserDetails: Background fetch succeeded, updating userDetails');
          setUserDetails({
            ...data,
            organizationId: data.organization_id || null,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          });
        } else {
          console.log('⚠️ fetchUserDetails: Background fetch returned no data');
        }
      })
      .catch((error) => {
        console.warn('⚠️ fetchUserDetails: Background fetch failed', error.message);
      });
  }

  const value = {
    currentUser,
    userDetails,
    loading,
    signup,
    login,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
