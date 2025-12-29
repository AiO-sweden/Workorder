import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const OrganizationSettings = () => {
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgNumber, setOrgNumber] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [isFAproved, setIsFAproved] = useState(false); // New state for F-skatt
  const [bankGiro, setBankGiro] = useState('');
  const [swift, setSwift] = useState('');
  const [iban, setIban] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchOrgDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('organization')
          .select('*')
          .eq('id', 'details')
          .single();

        if (error) {
          if (error.code !== 'PGRST116') { // Not a "no rows" error
            throw error;
          }
          // No data exists yet, keep defaults
        } else if (data) {
          setCompanyName(data.company_name || '');
          setAddress(data.address || '');
          setZipCode(data.zip_code || '');
          setCity(data.city || '');
          setOrgEmail(data.org_email || '');
          setOrgNumber(data.org_number || '');
          setOrgPhone(data.org_phone || '');
          setVatNumber(data.vat_number || '');
          setIsFAproved(data.is_f_approved || false);
          setBankGiro(data.bank_giro || '');
          setSwift(data.swift || '');
          setIban(data.iban || '');
          setLogoUrl(data.logo_url || '');
        }
      } catch (error) {
        console.error("Error fetching organization details:", error);
        setMessage('Kunde inte hämta företagsinformation.');
      }
      setIsLoading(false);
    };
    fetchOrgDetails();
  }, []);

  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      // Preview logo (optional)
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result); // Show local preview
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    let uploadedLogoUrl = logoUrl;

    if (logoFile) {
      const filePath = `organization_logos/${logoFile.name}_${Date.now()}`;
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('organization-logos')
          .upload(filePath, logoFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('organization-logos')
          .getPublicUrl(filePath);

        uploadedLogoUrl = urlData.publicUrl;
        setLogoUrl(uploadedLogoUrl);
        setLogoFile(null);
      } catch (error) {
        console.error("Error uploading logo:", error);
        setMessage('Fel vid uppladdning av logotyp. Spara igen för att spara textdata.');
        setIsSaving(false);
        // Don't return, allow text data to be saved if user wishes
      }
    }

    const orgData = {
      id: 'details',
      company_name: companyName,
      address,
      zip_code: zipCode,
      city,
      org_email: orgEmail,
      org_number: orgNumber,
      org_phone: orgPhone,
      vat_number: vatNumber,
      is_f_approved: isFAproved,
      bank_giro: bankGiro,
      swift,
      iban,
      logo_url: uploadedLogoUrl,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('organization')
        .upsert(orgData, { onConflict: 'id' });

      if (error) throw error;

      setMessage('Företagsuppgifter sparade!');
    } catch (error) {
      console.error("Error saving organization details:", error);
      setMessage('Kunde inte spara företagsuppgifter.');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <p>Laddar företagsinställningar...</p>;
  }

  // Basic styling, can be moved to a CSS file
  const inputStyle = { display: 'block', width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
  const labelStyle = { fontWeight: 'bold', marginBottom: '5px', display: 'block' };
  const formSectionStyle = { marginBottom: '20px', padding: '20px', border: '1px solid #eee', borderRadius: '5px' };


  return (
    <div>
      <h2>Företagsuppgifter för Fakturering</h2>
      {message && <p style={{ color: message.startsWith('Fel') ? 'red' : 'green' }}>{message}</p>}
      <form onSubmit={handleSave}>
        <div style={formSectionStyle}>
          <label style={labelStyle} htmlFor="companyName">Företagsnamn:</label>
          <input style={inputStyle} type="text" id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />

          <label style={labelStyle} htmlFor="address">Adress:</label>
          <input style={inputStyle} type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} />

          <label style={labelStyle} htmlFor="zipCode">Postnummer:</label>
          <input style={inputStyle} type="text" id="zipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value)} />

          <label style={labelStyle} htmlFor="city">Ort:</label>
          <input style={inputStyle} type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)} />

          <label style={labelStyle} htmlFor="orgPhone">Telefon:</label>
          <input style={inputStyle} type="tel" id="orgPhone" value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} />

          <label style={labelStyle} htmlFor="orgEmail">E-post:</label>
          <input style={inputStyle} type="email" id="orgEmail" value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} />
          
          <label style={labelStyle} htmlFor="orgNumber">Organisationsnummer:</label>
          <input style={inputStyle} type="text" id="orgNumber" value={orgNumber} onChange={(e) => setOrgNumber(e.target.value)} />

          <label style={labelStyle} htmlFor="vatNumber">Momsreg.nr (VAT):</label>
          <input style={inputStyle} type="text" id="vatNumber" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />

          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="isFAproved"
              checked={isFAproved}
              onChange={(e) => setIsFAproved(e.target.checked)}
              style={{ marginRight: '8px', width: 'auto', height: 'auto' }}
            />
            <label htmlFor="isFAproved" style={{ fontWeight: 'normal', marginBottom: '0' }}>Godkänd för F-skatt</label>
          </div>
        </div>

        <div style={formSectionStyle}>
            <h3>Bankuppgifter</h3>
            <label style={labelStyle} htmlFor="bankGiro">BankGiro:</label>
            <input style={inputStyle} type="text" id="bankGiro" value={bankGiro} onChange={(e) => setBankGiro(e.target.value)} />

            <label style={labelStyle} htmlFor="iban">IBAN:</label>
            <input style={inputStyle} type="text" id="iban" value={iban} onChange={(e) => setIban(e.target.value)} />
            
            <label style={labelStyle} htmlFor="swift">SWIFT/BIC:</label>
            <input style={inputStyle} type="text" id="swift" value={swift} onChange={(e) => setSwift(e.target.value)} />
        </div>

        <div style={formSectionStyle}>
          <h3>Företagslogotyp</h3>
          <label style={labelStyle} htmlFor="logoUpload">Ladda upp logotyp:</label>
          <input style={{display: 'block', marginBottom: '10px'}} type="file" id="logoUpload" onChange={handleLogoChange} accept="image/*" />
          {logoUrl && (
            <div>
              <p>Nuvarande/Förhandsgranskad logotyp:</p>
              <img src={logoUrl} alt="Företagslogotyp" style={{ maxWidth: '200px', maxHeight: '100px', border: '1px solid #ddd' }} />
            </div>
          )}
        </div>

        <button type="submit" disabled={isSaving} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {isSaving ? 'Sparar...' : 'Spara Företagsuppgifter'}
        </button>
      </form>
    </div>
  );
};

export default OrganizationSettings;