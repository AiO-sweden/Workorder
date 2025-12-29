import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase.js';
import { Mail, Lock, User, Building2 } from 'lucide-react';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInvitation();
  }, []);

  const loadInvitation = async () => {
    try {
      const token = searchParams.get('token');
      if (!token) {
        setError('Ogiltig inbjudningslänk');
        setLoading(false);
        return;
      }

      // Get invitation details from invitations table
      const { data: invitationData, error: invError } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (invError || !invitationData) {
        setError('Inbjudan hittades inte eller har redan använts');
        setLoading(false);
        return;
      }

      // Get organization details separately
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('company_name')
        .eq('id', invitationData.organization_id)
        .single();

      // Check if invitation has expired (7 days)
      const expiresAt = new Date(invitationData.expires_at);
      if (expiresAt < new Date()) {
        setError('Denna inbjudan har gått ut');
        setLoading(false);
        return;
      }

      // Combine invitation data with organization info
      setInvitation({
        ...invitationData,
        organization_name: orgData?.company_name || 'organisationen'
      });
      setLoading(false);
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Kunde inte ladda inbjudan');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Lösenorden matchar inte');
      return;
    }

    if (formData.password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let userId;
      let isNewUser = false;

      // Try to sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        }
      });

      // Check if user already exists
      if (signUpError && signUpError.message.includes('User already registered')) {
        // User exists, try to sign them in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: invitation.email,
          password: formData.password
        });

        if (signInError) {
          setError('Ett konto med denna email finns redan. Om det är ditt konto, använd rätt lösenord.');
          setSubmitting(false);
          return;
        }

        userId = signInData.user.id;
      } else if (signUpError) {
        throw signUpError;
      } else {
        userId = authData.user.id;
        isNewUser = true;
      }

      // Check if user is already in schedulable_users
      const { data: existingUser } = await supabase
        .from('schedulable_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!existingUser) {
        // Add user to schedulable_users with the organization
        const { error: userError } = await supabase
          .from('schedulable_users')
          .insert({
            id: userId,
            email: invitation.email,
            name: `${formData.firstName} ${formData.lastName}`,
            organization_id: invitation.organization_id,
            role: invitation.role || 'user'
          });

        if (userError) throw userError;
      } else {
        // Update existing user's organization
        const { error: updateUserError } = await supabase
          .from('schedulable_users')
          .update({
            organization_id: invitation.organization_id,
            role: invitation.role || 'user',
            name: `${formData.firstName} ${formData.lastName}`
          })
          .eq('id', userId);

        if (updateUserError) throw updateUserError;
      }

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Kunde inte acceptera inbjudan');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <p>Laddar inbjudan...</p>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          maxWidth: '400px',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>Fel</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        padding: '2.5rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#1A73E8',
            marginBottom: '0.5rem'
          }}>
            Välkommen till AIO Arbetsorder!
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '1rem',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            marginTop: '1rem'
          }}>
            <Building2 size={20} color="#1A73E8" />
            <p style={{
              margin: 0,
              fontSize: '1rem',
              color: '#333'
            }}>
              Du är inbjuden till <strong>{invitation?.organization_name}</strong>
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fee',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: '#c33',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#333',
              fontSize: '0.9rem'
            }}>
              <Mail size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              E-post
            </label>
            <input
              type="email"
              value={invitation?.email || ''}
              disabled
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '1rem',
                backgroundColor: '#f8f9fa',
                color: '#6c757d',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#333',
                fontSize: '0.9rem'
              }}>
                <User size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Förnamn
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#333',
                fontSize: '0.9rem'
              }}>
                Efternamn
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#333',
              fontSize: '0.9rem'
            }}>
              <Lock size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Välj lösenord
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              placeholder="Minst 6 tecken"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#333',
              fontSize: '0.9rem'
            }}>
              Bekräfta lösenord
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              placeholder="Ange lösenordet igen"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: submitting ? '#6c757d' : '#1A73E8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {submitting ? 'Skapar konto...' : 'Acceptera inbjudan och kom igång'}
          </button>
        </form>

        <p style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#6c757d'
        }}>
          Roll: <strong>{invitation?.role === 'admin' ? 'Administratör' : 'Användare'}</strong>
        </p>
      </div>
    </div>
  );
}
