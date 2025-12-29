import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { AlertCircle, CheckCircle, Loader, LogOut } from 'lucide-react';

export default function MigrationPage() {
  const navigate = useNavigate();
  const { currentUser, userDetails, logout } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleMigration = async () => {
    if (!currentUser) {
      setError('Du måste vara inloggad för att köra migration.');
      return;
    }

    setMigrating(true);
    setError(null);
    setProgress('Startar migration...');

    try {
      // Step 1: Create organization
      setProgress('Skapar organisation...');
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: userDetails?.company_name || 'Min Organisation',
          created_at: new Date().toISOString(),
          created_by: currentUser.id,
          settings: {
            currency: 'SEK',
            timezone: 'Europe/Stockholm',
            language: 'sv'
          }
        })
        .select()
        .single();

      if (orgError) throw orgError;

      const organizationId = orgData.id;
      console.log('Organisation skapad:', organizationId);

      // Step 2: Update user with organizationId and role
      setProgress('Uppdaterar användarkonto...');
      const { error: userError } = await supabase
        .from('users')
        .update({
          organization_id: organizationId,
          role: 'admin'
        })
        .eq('id', currentUser.id);

      if (userError) throw userError;
      console.log('Användare uppdaterad');

      // Step 3: Migrate all collections
      const collections = [
        'orders',
        'customers',
        'tidsrapporteringar',
        'schedulable_users',
        'scheduled_order_jobs',
        'time_codes'
      ];

      for (const tableName of collections) {
        setProgress(`Migrerar ${tableName}...`);
        try {
          // First check if there are any records
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (!count || count === 0) {
            console.log(`Inga dokument i ${tableName}`);
            continue;
          }

          // Update all records in the table with organizationId
          const { error: updateError } = await supabase
            .from(tableName)
            .update({ organization_id: organizationId })
            .is('organization_id', null);

          if (updateError) throw updateError;

          console.log(`Dokument uppdaterade i ${tableName}`);
        } catch (err) {
          console.error(`Fel vid migration av ${tableName}:`, err);
          // Continue with next collection even if this one fails
        }
      }

      setProgress('Migration klar!');
      setSuccess(true);

      // Force a full reload to get new userDetails from Supabase
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error('Migration error:', err);
      setError('Ett fel uppstod vid migration: ' + err.message);
      setMigrating(false);
    }
  };

  // If user already has organizationId, redirect to dashboard
  if (userDetails?.organization_id) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '2rem',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: 'relative'
    }}>
      {/* Logout Button - Top Right */}
      <button
        onClick={handleLogout}
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          backgroundColor: 'white',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '0.75rem 1.25rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '0.9rem',
          fontWeight: '600',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
          e.currentTarget.style.borderColor = '#ef4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        }}
      >
        <LogOut size={18} />
        <span>Logga ut</span>
      </button>

      <div style={{
        maxWidth: '600px',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#3b82f615',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <AlertCircle size={32} color="#3b82f6" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
            Migration Krävs
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Ditt konto behöver uppdateras för att fungera med den nya säkerhetsarkitekturen.
          </p>
        </div>

        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <p style={{ color: '#92400e', fontSize: '0.875rem', margin: 0 }}>
            <strong>Detta kommer att:</strong>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
              <li>Skapa en organisation för ditt konto</li>
              <li>Uppdatera din användarprofil</li>
              <li>Migrera alla dina orders, kunder och tidrapporter</li>
            </ul>
          </p>
        </div>

        {progress && (
          <div style={{
            backgroundColor: '#3b82f615',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {!success && <Loader size={20} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />}
            {success && <CheckCircle size={20} color="#10b981" />}
            <span style={{ color: success ? '#10b981' : '#3b82f6', fontWeight: '600', fontSize: '0.9rem' }}>
              {progress}
            </span>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>
              <strong>Fel:</strong> {error}
            </p>
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#10b98115',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ color: '#10b981', fontSize: '0.95rem', fontWeight: '600', margin: 0 }}>
              Migration slutförd! Omdirigerar till dashboard...
            </p>
          </div>
        )}

        <button
          onClick={handleMigration}
          disabled={migrating || success}
          style={{
            width: '100%',
            padding: '0.875rem',
            backgroundColor: migrating || success ? '#94a3b8' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: migrating || success ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {migrating ? 'Migrerar...' : success ? 'Klar!' : 'Starta Migration'}
        </button>

        <p style={{
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.75rem',
          marginTop: '1rem',
          marginBottom: 0
        }}>
          Detta är en engångsprocess och tar bara några sekunder.
        </p>
      </div>
    </div>
  );
}
