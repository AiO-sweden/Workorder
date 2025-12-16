import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, getDocs, updateDoc, doc, addDoc, writeBatch } from 'firebase/firestore';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function MigrationPage() {
  const navigate = useNavigate();
  const { currentUser, userDetails } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
      const orgRef = await addDoc(collection(db, 'organizations'), {
        name: userDetails?.companyName || 'Min Organisation',
        createdAt: new Date(),
        createdBy: currentUser.uid,
        settings: {
          currency: 'SEK',
          timezone: 'Europe/Stockholm',
          language: 'sv'
        }
      });
      const organizationId = orgRef.id;
      console.log('Organisation skapad:', organizationId);

      // Step 2: Update user with organizationId and role
      setProgress('Uppdaterar användarkonto...');
      await updateDoc(doc(db, 'users', currentUser.uid), {
        organizationId: organizationId,
        role: 'admin'
      });
      console.log('Användare uppdaterad');

      // Step 3: Migrate all collections
      const collections = [
        'orders',
        'customers',
        'tidsrapporteringar',
        'schedulableUsers',
        'scheduledOrderJobs',
        'timeCodes'
      ];

      for (const collectionName of collections) {
        setProgress(`Migrerar ${collectionName}...`);
        try {
          const snapshot = await getDocs(collection(db, collectionName));

          if (snapshot.empty) {
            console.log(`Inga dokument i ${collectionName}`);
            continue;
          }

          // Use batch for better performance
          const batch = writeBatch(db);
          let count = 0;

          snapshot.docs.forEach((docSnapshot) => {
            const docRef = doc(db, collectionName, docSnapshot.id);
            batch.update(docRef, { organizationId: organizationId });
            count++;
          });

          await batch.commit();
          console.log(`${count} dokument uppdaterade i ${collectionName}`);
        } catch (err) {
          console.error(`Fel vid migration av ${collectionName}:`, err);
          // Continue with next collection even if this one fails
        }
      }

      setProgress('Migration klar!');
      setSuccess(true);

      // Force a full reload to get new userDetails from Firestore
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
  if (userDetails?.organizationId) {
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
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
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
