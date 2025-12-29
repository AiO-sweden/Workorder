import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  UserPlus,
  User,
  Building2,
  CreditCard,
  Home,
  AlertCircle,
  Save,
  ArrowLeft,
  Loader2,
  Check
} from "lucide-react";

// Modern design system imports
import ActionButton from "../components/shared/ActionButton";
import Toast from "../components/shared/Toast";
import FormField from "../components/shared/FormField";
import { cardStyle, inputStyle, sectionHeaderStyle } from "../components/shared/styles";
import { colors, spacing, shadows, borderRadius, typography } from "../components/shared/theme";

export default function NewCustomer() {
  const navigate = useNavigate();
  const { userDetails } = useAuth();
  const [customerType, setCustomerType] = useState("Privatperson"); // Privatperson, Företag, Förening
  const [form, setForm] = useState({
    customerType: "Privatperson",
    // Privatperson fields
    firstName: "",
    lastName: "",
    personnummer: "",
    // Company/Organization fields
    name: "",
    orgNr: "",
    vatNr: "",
    alias: "",
    // Common fields
    customerNumber: "",
    address: "",
    zipCity: "",
    country: "Sverige",
    phone: "",
    email: "",
    paymentTerms: "30 dagar",
    invoiceBy: "E-post",
    invoiceAddress: "",
    invoiceEmail: "",
    rotCustomer: "Nej",
    rotPersonnummer: "",
    propertyId: "",
    rutCustomer: "Nej",
    rutPersonnummer: ""
  });
  const [toast, setToast] = useState(null);
  const [fetchingCompanyData, setFetchingCompanyData] = useState(false);
  const [companyDataFetched, setCompanyDataFetched] = useState(false);

  useEffect(() => {
    const generateCustomerNumber = async () => {
      if (!userDetails) {
        console.log('⏳ NewCustomer: Waiting for userDetails to load...');
        return;
      }

      if (!userDetails.organizationId) {
        console.log('⚠️ NewCustomer: No organizationId, using default customer number');
        setForm(prev => ({ ...prev, customerNumber: '0001' }));
        return;
      }

      console.log('🔍 NewCustomer: Generating customer number...');

      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id')
          .eq('organization_id', userDetails.organizationId);

        if (error) throw error;

        const nextNumber = (data?.length || 0) + 1;
        // Format with 4-digit padding: 0001, 0002, 0003, etc.
        const paddedNumber = nextNumber.toString().padStart(4, '0');
        setForm(prev => ({ ...prev, customerNumber: paddedNumber }));
        console.log('✅ NewCustomer: Generated customer number:', paddedNumber);
      } catch (error) {
        console.error("❌ NewCustomer: Error generating customer number:", error);
        setForm(prev => ({ ...prev, customerNumber: '0001' }));
      }
    };

    generateCustomerNumber();
  }, [userDetails]);

  // Validate Swedish organization number format
  const isValidOrgNr = (orgNr) => {
    const cleaned = orgNr.replace(/[\s-]/g, '');
    return /^\d{10}$/.test(cleaned);
  };

  // Fetch company data from organization number using Cloud Function
  const fetchCompanyData = async () => {
    if (!isValidOrgNr(form.orgNr)) {
      setToast({ type: 'error', message: 'Ange ett giltigt organisationsnummer (10 siffror)' });
      return;
    }

    setFetchingCompanyData(true);
    setCompanyDataFetched(false);

    try {
      // TEMPORARY: Fetch directly from Allabolag using CORS proxy
      const cleanedOrgNr = form.orgNr.replace(/[\s-]/g, '');
      const allabolagUrl = `https://www.allabolag.se/${cleanedOrgNr}`;

      // Use CORS proxy to bypass CORS restrictions (temporary solution)
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const url = corsProxy + encodeURIComponent(allabolagUrl);

      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Företaget kunde inte hittas');
      }

      const html = await response.text();

      // Extract JSON data from __NEXT_DATA__ script tag
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/);

      if (!nextDataMatch) {
        throw new Error('Kunde inte hämta företagsdata');
      }

      const nextData = JSON.parse(nextDataMatch[1]);
      const company = nextData?.props?.pageProps?.company;

      if (!company || !company.name) {
        throw new Error('Kunde inte hitta företagsuppgifter');
      }

      // Extract and format the data using correct Allabolag field names
      const companyData = {
        name: company.name || '',
        address: company.postalAddress?.addressLine || company.visitingAddress?.street || company.address?.street || '',
        zipCode: company.postalAddress?.zipCode || company.visitingAddress?.postalCode || company.address?.postalCode || '',
        city: company.postalAddress?.postPlace || company.visitingAddress?.city || company.address?.city || '',
      };

      console.log('✅ Extracted company data:', companyData);

      // Update form with fetched data
      setForm(prev => ({
        ...prev,
        name: companyData.name || prev.name,
        address: companyData.address || prev.address,
        zipCity: `${companyData.zipCode} ${companyData.city}`.trim() || prev.zipCity,
        country: "Sverige"
      }));

      setCompanyDataFetched(true);
      setToast({ type: 'success', message: 'Företagsuppgifter hämtade!' });
      setTimeout(() => setCompanyDataFetched(false), 3000);

    } catch (error) {
      console.error('Error fetching company data:', error);
      setToast({
        type: 'error',
        message: 'Kunde inte hämta företagsuppgifter. Kontrollera organisationsnumret eller fyll i uppgifterna manuellt.'
      });
    } finally {
      setFetchingCompanyData(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCustomerTypeChange = (type) => {
    setCustomerType(type);
    setForm({ ...form, customerType: type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (form.rotCustomer === "Ja" && (!form.rotPersonnummer.trim() || !form.propertyId.trim())) {
      setToast({ type: 'error', message: 'Fyll i både personnummer och fastighetsbeteckning för ROT-kund.' });
      return;
    }

    if (form.rutCustomer === "Ja" && !form.rutPersonnummer.trim()) {
      setToast({ type: 'error', message: 'Fyll i personnummer för RUT-kund.' });
      return;
    }

    if (form.invoiceBy === "E-post" && !form.invoiceEmail.trim()) {
      setToast({ type: 'error', message: 'Fyll i e-postadress för fakturor.' });
      return;
    }

    if (!userDetails?.organizationId) {
      console.error('❌ No organizationId:', userDetails);
      setToast({ type: 'error', message: 'Du måste vara inloggad för att skapa en kund.' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          customer_number: form.customerNumber,
          name: form.customerType === "Privatperson"
            ? `${form.firstName} ${form.lastName}`.trim()
            : form.name,
          org_nr: form.orgNr,
          address: form.address,
          zip_code: form.zipCity?.split(' ')[0] || '',
          city: form.zipCity?.split(' ').slice(1).join(' ') || '',
          phone: form.phone,
          email: form.email,
          invoice_by: form.invoiceBy,
          payment_terms: form.paymentTerms,
          reference_person: form.customerType === "Privatperson" ? `${form.firstName} ${form.lastName}` : '',
          organization_id: userDetails.organizationId,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      setToast({ type: 'success', message: 'Kund sparad!' });
      setTimeout(() => {
        navigate(`/customers/${data[0].id}`);
      }, 1500);
    } catch (err) {
      setToast({ type: 'error', message: 'Fel vid sparande: ' + err.message });
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: spacing[8] }}>
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: spacing[8] }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: spacing[2]
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing[4] }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: borderRadius.xl,
              background: colors.gradients.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: shadows.md
            }}>
              <UserPlus size={28} color="white" />
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: typography.fontSize['3xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.neutral[900]
              }}>
                Ny kund
              </h1>
              <p style={{
                color: colors.neutral[500],
                fontSize: typography.fontSize.base,
                margin: `${spacing[1]} 0 0 0`
              }}>
                Fyll i kundens information nedan
              </p>
            </div>
          </div>
          <ActionButton
            variant="secondary"
            onClick={() => navigate("/customers")}
            icon={<ArrowLeft size={18} />}
          >
            Tillbaka
          </ActionButton>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Customer Type Selection */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <User size={20} />
            Kunduppgifter
          </div>

          {/* Radio buttons for customer type */}
          <div style={{ marginBottom: spacing[6] }}>
            <label style={{
              display: "block",
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.neutral[700],
              marginBottom: spacing[3]
            }}>
              Kundtyp
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: spacing[4] }}>
              {["Privatperson", "Företag", "Förening"].map((type) => (
                <label
                  key={type}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: spacing[3],
                    padding: spacing[4],
                    borderRadius: borderRadius.lg,
                    border: `2px solid ${customerType === type ? colors.primary[500] : colors.neutral[200]}`,
                    backgroundColor: customerType === type ? colors.primary[50] : "white",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <input
                    type="radio"
                    name="customerType"
                    value={type}
                    checked={customerType === type}
                    onChange={() => handleCustomerTypeChange(type)}
                    style={{
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      accentColor: colors.primary[500]
                    }}
                  />
                  <span style={{
                    fontWeight: typography.fontWeight.medium,
                    color: customerType === type ? colors.primary[700] : colors.neutral[700]
                  }}>
                    {type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Privatperson Fields */}
          {customerType === "Privatperson" && (
            <>
              <div style={{ marginBottom: spacing[4] }}>
                <h3 style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.neutral[800],
                  margin: `0 0 ${spacing[4]} 0`
                }}>
                  Primärkontakt
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
                <FormField label="Förnamn" required>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Förnamn"
                    required
                  />
                </FormField>

                <FormField label="Efternamn" required>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Efternamn"
                    required
                  />
                </FormField>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
                <FormField label="Telefonnummer">
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="070-123 45 67"
                  />
                </FormField>

                <FormField label="E-post">
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="namn@example.com"
                  />
                </FormField>
              </div>

              <FormField label="Personnummer">
                <input
                  name="personnummer"
                  value={form.personnummer}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="ÅÅÅÅMMDD-XXXX"
                />
              </FormField>

              <div style={{ marginTop: spacing[6], marginBottom: spacing[4] }}>
                <h3 style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.neutral[800],
                  margin: `0 0 ${spacing[4]} 0`
                }}>
                  Grunduppgifter
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
                <FormField label="Kundnamn" required>
                  <input
                    name="name"
                    value={form.name || `${form.firstName} ${form.lastName}`.trim()}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Autofylls från för- och efternamn"
                    required
                  />
                </FormField>

                <FormField label="Kundnummer" helper="Genereras automatiskt">
                  <input
                    name="customerNumber"
                    value={form.customerNumber}
                    readOnly
                    style={{
                      ...inputStyle,
                      backgroundColor: colors.neutral[50],
                      color: colors.neutral[500],
                      cursor: 'not-allowed'
                    }}
                  />
                </FormField>
              </div>
            </>
          )}

          {/* Företag Fields */}
          {customerType === "Företag" && (
            <>
              <div style={{ marginBottom: spacing[4] }}>
                <h3 style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.neutral[800],
                  margin: `0 0 ${spacing[4]} 0`
                }}>
                  Företagsuppgifter
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
                <FormField label="Kundnamn" required>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Företagsnamn AB"
                    required
                  />
                </FormField>

                <FormField label="Kundnummer" helper="Genereras automatiskt">
                  <input
                    name="customerNumber"
                    value={form.customerNumber}
                    readOnly
                    style={{
                      ...inputStyle,
                      backgroundColor: colors.neutral[50],
                      color: colors.neutral[500],
                      cursor: 'not-allowed'
                    }}
                  />
                </FormField>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
                <FormField label="Alias">
                  <input
                    name="alias"
                    value={form.alias}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Kortnamn"
                  />
                </FormField>

                <FormField label="Momsregistreringsnummer (VAT)">
                  <input
                    name="vatNr"
                    value={form.vatNr}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="SE123456789001"
                  />
                </FormField>
              </div>

              <FormField label="Organisationsnummer" helper="Klicka på 'Hämta uppgifter' för automatisk ifyllning">
                <div style={{ display: "flex", gap: spacing[3], alignItems: "flex-start" }}>
                  <input
                    name="orgNr"
                    value={form.orgNr}
                    onChange={handleChange}
                    style={{
                      ...inputStyle,
                      flex: 1,
                      borderColor: companyDataFetched ? colors.success[500] : colors.neutral[200],
                      boxShadow: companyDataFetched ? shadows.glowSuccess : 'none'
                    }}
                    placeholder="XXXXXX-XXXX"
                  />
                  <button
                    type="button"
                    onClick={fetchCompanyData}
                    disabled={!isValidOrgNr(form.orgNr) || fetchingCompanyData}
                    style={{
                      padding: `${spacing[3]} ${spacing[5]}`,
                      borderRadius: borderRadius.lg,
                      border: "none",
                      fontWeight: typography.fontWeight.semibold,
                      fontSize: typography.fontSize.base,
                      cursor: !isValidOrgNr(form.orgNr) || fetchingCompanyData ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: spacing[2],
                      justifyContent: "center",
                      background: fetchingCompanyData ? colors.neutral[400] : colors.gradients.blue,
                      color: "white",
                      opacity: !isValidOrgNr(form.orgNr) || fetchingCompanyData ? 0.6 : 1,
                      whiteSpace: "nowrap",
                      boxShadow: shadows.md
                    }}
                  >
                    {fetchingCompanyData ? (
                      <>
                        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                        <span>Hämtar...</span>
                        <style>
                          {`
                            @keyframes spin {
                              from { transform: rotate(0deg); }
                              to { transform: rotate(360deg); }
                            }
                          `}
                        </style>
                      </>
                    ) : companyDataFetched ? (
                      <>
                        <Check size={18} />
                        <span>Hämtat!</span>
                      </>
                    ) : (
                      <>
                        <Building2 size={18} />
                        <span>Hämta uppgifter</span>
                      </>
                    )}
                  </button>
                </div>
              </FormField>
            </>
          )}

          {/* Förening Fields */}
          {customerType === "Förening" && (
            <>
              <div style={{ marginBottom: spacing[4] }}>
                <h3 style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.neutral[800],
                  margin: `0 0 ${spacing[4]} 0`
                }}>
                  Organisationsuppgifter
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
                <FormField label="Kundnamn" required>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Föreningsnamn"
                    required
                  />
                </FormField>

                <FormField label="Kundnummer" helper="Genereras automatiskt">
                  <input
                    name="customerNumber"
                    value={form.customerNumber}
                    readOnly
                    style={{
                      ...inputStyle,
                      backgroundColor: colors.neutral[50],
                      color: colors.neutral[500],
                      cursor: 'not-allowed'
                    }}
                  />
                </FormField>
              </div>

              <FormField label="Organisationsnummer">
                <input
                  name="orgNr"
                  value={form.orgNr}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="XXXXXX-XXXX"
                />
              </FormField>
            </>
          )}
        </div>

        {/* Adress - Common for all types */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <Home size={20} />
            Fakturaadress
          </div>

          <FormField label="Adress">
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Gatuadress"
            />
          </FormField>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
            <FormField label="Postnummer & Ort">
              <input
                name="zipCity"
                value={form.zipCity}
                onChange={handleChange}
                style={inputStyle}
                placeholder="123 45 Stad"
              />
            </FormField>

            <FormField label="Land">
              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                style={inputStyle}
              />
            </FormField>
          </div>
        </div>

        {/* Fakturering */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <CreditCard size={20} />
            Fakturering
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6] }}>
            <FormField label="Betalningsvillkor">
              <select name="paymentTerms" value={form.paymentTerms} onChange={handleChange} style={inputStyle}>
                <option value="10 dagar">10 dagar</option>
                <option value="15 dagar">15 dagar</option>
                <option value="20 dagar">20 dagar</option>
                <option value="25 dagar">25 dagar</option>
                <option value="30 dagar">30 dagar</option>
              </select>
            </FormField>

            <FormField label="Fakturor skickas med">
              <select name="invoiceBy" value={form.invoiceBy} onChange={handleChange} style={inputStyle}>
                <option value="E-post">E-post</option>
                <option value="Brev">Brev</option>
              </select>
            </FormField>
          </div>

          {form.invoiceBy === "Brev" && (
            <div style={{
              padding: spacing[4],
              backgroundColor: colors.warning[100],
              border: `2px solid ${colors.warning[400]}`,
              borderRadius: borderRadius.lg,
              marginBottom: spacing[6]
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: spacing[2], color: colors.warning[800] }}>
                <AlertCircle size={18} />
                <span style={{ fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm }}>
                  Vid fakturering via brev tillkommer en avgift på 50 kr per faktura.
                </span>
              </div>
            </div>
          )}

          {form.invoiceBy === "E-post" && (
            <FormField label="E-post för fakturor" helper="Om annan än huvudepost">
              <input
                type="email"
                name="invoiceEmail"
                value={form.invoiceEmail}
                onChange={handleChange}
                style={inputStyle}
                placeholder="faktura@example.com"
              />
            </FormField>
          )}

          <FormField label="Fakturaadress" helper="Om annan än besöksadress">
            <input
              name="invoiceAddress"
              value={form.invoiceAddress}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Fakturaadress"
            />
          </FormField>
        </div>

        {/* ROT & RUT - Only for Privatperson */}
        {customerType === "Privatperson" && (
          <div style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <Home size={20} />
              ROT & RUT-avdrag
            </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[6], marginBottom: spacing[6] }}>
            <FormField label="ROT-kund" helper="Renovering, Ombyggnad, Tillbyggnad">
              <select name="rotCustomer" value={form.rotCustomer} onChange={handleChange} style={inputStyle}>
                <option value="Nej">Nej</option>
                <option value="Ja">Ja</option>
              </select>
            </FormField>

            <FormField label="RUT-kund" helper="Reparation, Underhåll, Tvätt">
              <select name="rutCustomer" value={form.rutCustomer} onChange={handleChange} style={inputStyle}>
                <option value="Nej">Nej</option>
                <option value="Ja">Ja</option>
              </select>
            </FormField>
          </div>

          {form.rotCustomer === "Ja" && (
            <div style={{
              padding: spacing[6],
              backgroundColor: colors.success[50],
              border: `2px solid ${colors.success[300]}`,
              borderRadius: borderRadius.xl,
              marginBottom: spacing[6]
            }}>
              <h4 style={{
                margin: `0 0 ${spacing[4]} 0`,
                color: colors.success[700],
                fontWeight: typography.fontWeight.semibold,
                fontSize: typography.fontSize.lg
              }}>
                ROT-uppgifter
              </h4>
              <FormField label="Personnummer" helper="ÅÅÅÅMMDD-XXXX">
                <input
                  name="rotPersonnummer"
                  value={form.rotPersonnummer}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="19800101-1234"
                />
              </FormField>
              <FormField label="Fastighetsbeteckning">
                <input
                  name="propertyId"
                  value={form.propertyId}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="KOMMUN OMRÅDE 1:1"
                />
              </FormField>
            </div>
          )}

          {form.rutCustomer === "Ja" && (
            <div style={{
              padding: spacing[6],
              backgroundColor: colors.primary[50],
              border: `2px solid ${colors.primary[300]}`,
              borderRadius: borderRadius.xl,
              marginBottom: spacing[6]
            }}>
              <h4 style={{
                margin: `0 0 ${spacing[4]} 0`,
                color: colors.primary[700],
                fontWeight: typography.fontWeight.semibold,
                fontSize: typography.fontSize.lg
              }}>
                RUT-uppgifter
              </h4>
              <FormField label="Personnummer" helper="ÅÅÅÅMMDD-XXXX">
                <input
                  name="rutPersonnummer"
                  value={form.rutPersonnummer}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="19800101-1234"
                />
              </FormField>
            </div>
          )}
          </div>
        )}

        {/* Submit Button */}
        <div style={{ display: "flex", gap: spacing[4] }}>
          <button
            type="submit"
            style={{
              padding: `${spacing[3]} ${spacing[6]}`,
              borderRadius: borderRadius.lg,
              border: "none",
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.base,
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: spacing[2],
              justifyContent: "center",
              background: colors.gradients.success,
              color: "white",
              boxShadow: shadows.md,
              flex: 1
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = shadows.lg;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = shadows.md;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Save size={20} />
            Spara kund
          </button>
          <ActionButton
            variant="secondary"
            onClick={() => navigate("/customers")}
          >
            Avbryt
          </ActionButton>
        </div>
      </form>
    </div>
  );
}
