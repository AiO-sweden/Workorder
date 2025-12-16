import React, { useState, useEffect, useCallback } from 'react';
import { db, app } from '../firebase/config'; // Importera app
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions'; // Importera för Cloud Functions

// Define styles at the module level
const pageContainerStyle = {
  // padding: '1.5rem', // This component is usually embedded, so parent handles padding
};

const headerContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
};

const pageTitleStyle = {
  color: '#333',
  fontSize: '1.3rem', // Adjusted for sub-page title
  fontWeight: '600',
  margin: 0,
};

const createButtonStyle = {
  backgroundColor: '#1A73E8',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  padding: '0.6rem 1.2rem',
  fontSize: '0.9rem',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const formContainerStyle = {
  marginBottom: '2rem',
  padding: '1.5rem',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  backgroundColor: '#fdfdfd', // Slightly off-white for form
  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '4px',
  border: '1px solid #ced4da',
  boxSizing: 'border-box',
  fontSize: '0.9rem',
  marginBottom: '0.5rem', 
};

const selectStyle = { ...inputStyle };

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  fontWeight: '500',
  fontSize: '0.875rem',
  color: '#495057',
};

const smallTextStyle = {
  fontSize: '0.8rem',
  color: '#6c757d',
  display: 'block',
  marginTop: '-0.25rem', 
  marginBottom: '1rem',
};

const formActionsStyle = {
  marginTop: '1.5rem',
  display: 'flex',
  gap: '0.75rem',
};

const tableContainerStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  overflowX: 'auto',
  padding: '1px',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle = {
  backgroundColor: '#F8F9FA',
  color: '#495057',
  padding: '0.8rem 1rem',
  textAlign: 'left',
  borderBottom: '1px solid #dee2e6',
  fontSize: '0.875rem',
  fontWeight: '600',
  textTransform: 'uppercase',
};

const tdStyle = {
  padding: '0.8rem 1rem',
  borderBottom: '1px solid #e9ecef',
  fontSize: '0.875rem',
  color: '#333',
};

const actionButtonStyle = {
  background: 'none',
  border: '1px solid #ced4da',
  color: '#495057',
  padding: '0.3rem 0.6rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  marginRight: '0.5rem',
  transition: 'background-color 0.2s ease, color 0.2s ease',
};

const deleteButtonStyle = {
  ...actionButtonStyle,
  borderColor: '#dc3545',
  color: '#dc3545',
};

export default function UserSettings() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', uid: '', email: '', role: 'user' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState({ type: '', text: '' });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const usersSnapshot = await getDocs(collection(db, 'schedulableUsers'));
      const usersList = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(usersList);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Kunde inte hämta användare.");
    }
    setIsLoading(false);
  }, []); // Beroenden: setIsLoading, setError, setUsers (dessa är stabila från useState)

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // Kör när fetchUsers (och därmed dess beroenden) ändras, eller vid mount

  const handleFormChange = (e) => {
    setUserForm({ ...userForm, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.uid || !userForm.role) {
      alert("Namn, UID och Roll måste fyllas i.");
      return;
    }
    try {
      if (editingUserId) {
        const userDocRef = doc(db, 'schedulableUsers', editingUserId);
        await updateDoc(userDocRef, userForm);
        setUsers(users.map(u => u.id === editingUserId ? { id: editingUserId, ...userForm } : u));
        alert("Användare uppdaterad!");
        setEditingUserId(null);
      } else {
        const docRef = await addDoc(collection(db, 'schedulableUsers'), userForm);
        setUsers([...users, { id: docRef.id, ...userForm }]);
        alert("Ny användare tillagd!");
      }
      setUserForm({ name: '', uid: '', email: '', role: 'user' });
      setIsAddingUser(false);
    } catch (err) {
      console.error("Error saving user:", err);
      alert("Kunde inte spara användare.");
    }
  };

  const startEditUser = (user) => {
    setEditingUserId(user.id);
    setUserForm({ name: user.name, uid: user.uid, email: user.email || '', role: user.role });
    setIsAddingUser(true);
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setUserForm({ name: '', uid: '', email: '', role: 'user' });
    setIsAddingUser(false);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Är du säker på att du vill ta bort denna användare?")) {
      try {
        await deleteDoc(doc(db, 'schedulableUsers', userId));
        setUsers(users.filter(u => u.id !== userId));
        alert("Användare borttagen.");
      } catch (err) {
        console.error("Error deleting user:", err);
        alert("Kunde inte ta bort användare.");
      }
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteEmail) {
      setInviteMessage({ type: 'error', text: 'E-postadress måste anges.' });
      return;
    }
    setIsInviting(true);
    setInviteMessage({ type: '', text: '' });

    try {
      const functions = getFunctions(app, 'europe-west1');
      const inviteUserCallable = httpsCallable(functions, 'inviteUser');
      
      // TODO: Lägg till logik för att skicka med en autentiseringstoken (t.ex. ID-token) i anropet
      // om din Cloud Function kräver det för auktorisering.
      // Exempel: const idToken = await auth.currentUser.getIdToken();
      // const result = await inviteUserCallable({ email: inviteEmail, role: 'user', idToken: idToken });

      const result = await inviteUserCallable({ email: inviteEmail, role: 'user' }); // Standardroll 'user'
      
      const resultData = result.data;

      if (resultData.error) {
        throw new Error(resultData.error);
      }

      setInviteMessage({ type: 'success', text: resultData.message || `Inbjudan skickad till ${inviteEmail}.` });
      setInviteEmail('');
      fetchUsers(); // Ladda om användarlistan för att visa den nya/uppdaterade användaren
    } catch (error) {
      console.error("Error inviting user:", error);
      setInviteMessage({ type: 'error', text: error.message || 'Kunde inte skicka inbjudan.' });
    }
    setIsInviting(false);
  };

  if (isLoading) return <div style={pageContainerStyle}><p>Laddar användare...</p></div>;
  if (error) return <div style={pageContainerStyle}><p style={{ color: 'red' }}>{error}</p></div>;

  return (
    <div style={pageContainerStyle}>
      <div style={headerContainerStyle}>
        <h2 style={pageTitleStyle}>Användare</h2>
        <button
          onClick={() => {
            if (isAddingUser || editingUserId) {
              cancelEdit();
            } else {
              setIsAddingUser(true);
            }
          }}
          style={createButtonStyle}
        >
          <span role="img" aria-label="add" style={{fontSize: '1.1rem'}}>➕</span>
          {(isAddingUser && !editingUserId) ? 'AVBRYT' : editingUserId ? 'AVBRYT REDIGERING' : 'SKAPA NY ANVÄNDARE'}
        </button>
      </div>
    
          {/* Invite User Form */}
          <form onSubmit={handleInviteUser} style={{...formContainerStyle, marginTop: '2rem', borderColor: '#0D294D' }}>
            <h3 style={{marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600', color: '#0D294D'}}>Bjud in ny användare via E-post</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="inviteEmail" style={labelStyle}>Användarens E-postadress:</label>
              <input
                type="email"
                name="inviteEmail"
                id="inviteEmail"
                placeholder="exempel@foretag.se"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div style={formActionsStyle}>
              <button type="submit" style={{...createButtonStyle, backgroundColor: '#0D294D'}} disabled={isInviting}>
                {isInviting ? 'Skickar inbjudan...' : 'SKICKA INBJUDAN'}
              </button>
            </div>
            {inviteMessage.text && (
              <p style={{
                marginTop: '1rem',
                color: inviteMessage.type === 'error' ? '#dc3545' : '#28a745',
                fontSize: '0.9rem'
              }}>
                {inviteMessage.text}
              </p>
            )}
          </form>

      {(isAddingUser || editingUserId) && (
        <form onSubmit={handleFormSubmit} style={formContainerStyle}>
          <h3 style={{marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600'}}>{editingUserId ? 'Redigera användare' : 'Lägg till ny användare'}</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="name" style={labelStyle}>Namn:</label>
            <input type="text" name="name" id="name" value={userForm.name} onChange={handleFormChange} required style={inputStyle}/>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="uid" style={labelStyle}>Firebase UID:</label>
            <input type="text" name="uid" id="uid" value={userForm.uid} onChange={handleFormChange} required style={inputStyle} disabled={Boolean(editingUserId)} />
            <small style={smallTextStyle}>Detta är användarens unika ID från Firebase Authentication. {editingUserId ? 'Kan inte ändras.' : ''}</small>
          </div>
           <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={labelStyle}>E-post (valfritt):</label>
            <input type="email" name="email" id="email" value={userForm.email} onChange={handleFormChange} style={inputStyle}/>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="role" style={labelStyle}>Roll:</label>
            <select name="role" id="role" value={userForm.role} onChange={handleFormChange} style={selectStyle}>
              <option value="user">Användare</option>
              <option value="admin">Administratör</option>
            </select>
          </div>
          <div style={formActionsStyle}>
            <button type="submit" style={{...createButtonStyle, backgroundColor: '#28a745', flexGrow: 0.3}}>
              {editingUserId ? 'SPARA ÄNDRINGAR' : 'SPARA ANVÄNDARE'}
            </button>
            <button type="button" onClick={cancelEdit} style={{...actionButtonStyle, flexGrow: 0.3, backgroundColor: '#6c757d', color: 'white', borderColor: '#6c757d'}}>
                Avbryt
            </button>
          </div>
        </form>
      )}

      {users.length === 0 && !(isAddingUser || editingUserId) ? (
         <div style={{...tableContainerStyle, padding: '2rem', textAlign: 'center'}}>
            <p>Inga användare hittades i 'schedulableUsers'.</p>
         </div>
      ) : users.length > 0 ? (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Namn</th>
                <th style={thStyle}>UID</th>
                <th style={thStyle}>E-post</th>
                <th style={thStyle}>Roll</th>
                <th style={{...thStyle, textAlign: 'center'}}>Åtgärder</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td style={tdStyle}>{user.name}</td>
                  <td style={tdStyle}>{user.uid}</td>
                  <td style={tdStyle}>{user.email || '-'}</td>
                  <td style={tdStyle}>{user.role}</td>
                  <td style={{...tdStyle, textAlign: 'center'}}>
                    <button onClick={() => startEditUser(user)} style={{...actionButtonStyle, borderColor: '#ffc107', color: '#ffc107'}}>Redigera</button>
                    <button onClick={() => handleDeleteUser(user.id)} style={deleteButtonStyle}>Ta bort</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null }
    </div>
  );
}