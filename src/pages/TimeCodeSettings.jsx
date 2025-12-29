import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/config';

// Re-using styles from other settings pages
const pageContainerStyle = {
  // padding: '1.5rem', // Embedded component
};

const headerContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
};

const pageTitleStyle = {
  color: '#333',
  fontSize: '1.3rem',
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
  backgroundColor: '#fdfdfd',
  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '4px',
  border: '1px solid #ced4da',
  boxSizing: 'border-box',
  fontSize: '0.9rem',
  marginBottom: '1rem', 
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  fontWeight: '500',
  fontSize: '0.875rem',
  color: '#495057',
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
};

const deleteButtonStyle = {
  ...actionButtonStyle,
  borderColor: '#dc3545',
  color: '#dc3545',
};

export default function TimeCodeSettings() {
  const [timeCodes, setTimeCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', type: 'Arbetstid', rate: '' });

  useEffect(() => {
    const fetchTimeCodes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('time_codes')
          .select('*')
          .order('code', { ascending: true });

        if (error) throw error;

        console.log('🔍 TimeCodeSettings: Fetched raw data from database:', data);
        console.log('🔍 TimeCodeSettings: Number of time codes fetched:', data?.length);

        // Convert snake_case to camelCase
        const convertedData = data.map(item => ({
          id: item.id,
          code: item.code,
          name: item.name,
          type: item.type,
          rate: item.rate
        }));

        console.log('🔍 TimeCodeSettings: Converted data:', convertedData);
        setTimeCodes(convertedData);
      } catch (err) {
        console.error("Error fetching time codes:", err);
        setError("Kunde inte hämta tidkoder.");
      }
      setIsLoading(false);
    };
    fetchTimeCodes();
  }, []);

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || '' : value }));
  };

  const resetForm = () => {
    setFormData({ code: '', name: '', type: 'Arbetstid', rate: '' });
    setIsAdding(false);
    setEditingItem(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.type) {
      alert("Kod, Namn och Typ måste fyllas i.");
      return;
    }
    try {
      // Convert camelCase to snake_case for database
      const dbData = {
        code: formData.code,
        name: formData.name,
        type: formData.type,
        rate: formData.rate || null
      };

      if (editingItem) {
        const { error } = await supabase
          .from('time_codes')
          .update(dbData)
          .eq('id', editingItem.id);

        if (error) throw error;

        setTimeCodes(timeCodes.map(tc => tc.id === editingItem.id ? { ...formData, id: editingItem.id } : tc));
        alert("Tidkod uppdaterad!");
      } else {
        const { data, error } = await supabase
          .from('time_codes')
          .insert([dbData])
          .select()
          .single();

        if (error) throw error;

        // Convert response back to camelCase
        const newTimeCode = {
          id: data.id,
          code: data.code,
          name: data.name,
          type: data.type,
          rate: data.rate
        };

        setTimeCodes([...timeCodes, newTimeCode]);
        alert("Tidkod tillagd!");
      }
      resetForm();
    } catch (err) {
      console.error("Error saving time code:", err);
      alert("Kunde inte spara tidkod.");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ code: item.code, name: item.name, type: item.type, rate: item.rate || '' });
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Är du säker på att du vill ta bort denna tidkod?")) {
      try {
        const { error } = await supabase
          .from('time_codes')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setTimeCodes(timeCodes.filter(tc => tc.id !== id));
        alert("Tidkod borttagen.");
      } catch (err) {
        console.error("Error deleting time code:", err);
        alert("Kunde inte ta bort tidkod.");
      }
    }
  };

  if (isLoading) return <div style={pageContainerStyle}><p>Laddar tidkoder...</p></div>;
  if (error) return <div style={pageContainerStyle}><p style={{ color: 'red' }}>{error}</p></div>;

  return (
    <div style={pageContainerStyle}>
      <div style={headerContainerStyle}>
        <h2 style={pageTitleStyle}>Tidkoder</h2>
        <button onClick={() => { setIsAdding(!isAdding); setEditingItem(null); if(isAdding) resetForm(); }} style={createButtonStyle}>
          <span role="img" aria-label="add" style={{fontSize: '1.1rem'}}>➕</span>
          {isAdding ? 'AVBRYT' : 'SKAPA NY TIDKOD'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleFormSubmit} style={formContainerStyle}>
          <h3 style={{marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600'}}>{editingItem ? 'Redigera Tidkod' : 'Lägg till Ny Tidkod'}</h3>
          <div>
            <label htmlFor="code" style={labelStyle}>Kod (t.ex. H1, L2):</label>
            <input type="text" name="code" id="code" value={formData.code} onChange={handleFormChange} required style={inputStyle} />
          </div>
          <div>
            <label htmlFor="name" style={labelStyle}>Namn (t.ex. Arbetstid, Övertid):</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleFormChange} required style={inputStyle} />
          </div>
          <div>
            <label htmlFor="type" style={labelStyle}>Typ:</label>
            <select name="type" id="type" value={formData.type} onChange={handleFormChange} style={{...inputStyle, marginBottom: '1rem'}}>
              <option value="Arbetstid">Arbetstid</option>
              <option value="Frånvaro">Frånvaro</option>
              <option value="Interntid">Interntid</option>
              {/* Add more types as needed */}
            </select>
          </div>
          <div>
            <label htmlFor="rate" style={labelStyle}>Timpris (valfritt, t.ex. 233.00):</label>
            <input type="number" name="rate" id="rate" value={formData.rate} onChange={handleFormChange} style={inputStyle} step="0.01" placeholder="0.00"/>
          </div>
          <div style={formActionsStyle}>
            <button type="submit" style={{...createButtonStyle, backgroundColor: '#28a745', flexGrow: 0.3}}>
              {editingItem ? 'SPARA ÄNDRINGAR' : 'SPARA TIDKOD'}
            </button>
            <button type="button" onClick={resetForm} style={{...actionButtonStyle, flexGrow: 0.3, backgroundColor: '#6c757d', color: 'white', borderColor: '#6c757d'}}>
                Avbryt
            </button>
          </div>
        </form>
      )}

      {timeCodes.length === 0 && !isAdding ? (
        <div style={{...tableContainerStyle, padding: '2rem', textAlign: 'center'}}>
          <p>Inga tidkoder finns registrerade.</p>
        </div>
      ) : timeCodes.length > 0 ? (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Kod</th>
                <th style={thStyle}>Namn</th>
                <th style={thStyle}>Typ</th>
                <th style={{...thStyle, textAlign: 'right'}}>Timpris</th>
                <th style={{...thStyle, textAlign: 'center'}}>Åtgärder</th>
              </tr>
            </thead>
            <tbody>
              {timeCodes.map(tc => (
                <tr key={tc.id}>
                  <td style={tdStyle}>{tc.code}</td>
                  <td style={tdStyle}>{tc.name}</td>
                  <td style={tdStyle}>{tc.type}</td>
                  <td style={{...tdStyle, textAlign: 'right'}}>{tc.rate ? `${parseFloat(tc.rate).toFixed(2)} kr` : '-'}</td>
                  <td style={{...tdStyle, textAlign: 'center'}}>
                    <button onClick={() => handleEdit(tc)} style={{...actionButtonStyle, borderColor: '#ffc107', color: '#ffc107'}}>Redigera</button>
                    <button onClick={() => handleDelete(tc.id)} style={deleteButtonStyle}>Ta bort</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}