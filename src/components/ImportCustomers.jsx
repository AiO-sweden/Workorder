import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { db } from '../firebase/config';
import { collection, writeBatch, doc, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import {
  Upload,
  X,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Info,
  Loader,
  Users,
  Building2,
  Home,
  Mail,
  Phone,
  Edit3,
  Trash2
} from 'lucide-react';

// HELT NY MODERN IMPORTKOMPONENT - Matchande design med CustomerList
export default function ImportCustomers({ isOpen, onClose, onSuccess }) {
  const { userDetails } = useAuth();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validatedData, setValidatedData] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [step, setStep] = useState(1); // 1: Upload, 2: Review, 3: Processing, 4: Complete

  // Validera email format
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validera svenskt telefonnummer
  const isValidPhone = (phone) => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return /^(\+46|0)[1-9]\d{7,9}$/.test(cleaned);
  };

  // Validera org.nr format (10 siffror, optional bindestreck)
  const isValidOrgNr = (orgNr) => {
    const cleaned = orgNr.replace(/[\s\-]/g, '');
    return /^\d{10}$/.test(cleaned);
  };

  // Formatera telefonnummer
  const formatPhone = (phone) => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('0')) {
      return cleaned;
    } else if (cleaned.startsWith('+46')) {
      return '0' + cleaned.substring(3);
    }
    return cleaned;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrors(['Filen är för stor. Max storlek är 10 MB.']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setWarnings([]);
    setParsedData([]);
    setValidatedData([]);
    setDuplicates([]);

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
      parseCSV(selectedFile);
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      parseExcel(selectedFile);
    } else {
      setErrors(['Filformatet stöds inte. Använd CSV eller Excel (.xlsx, .xls)']);
    }
  };

  const parseCSV = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        processData(results.data);
      },
      error: (error) => {
        setErrors([`Fel vid läsning av CSV: ${error.message}`]);
      }
    });
  };

  const parseExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        processData(jsonData);
      } catch (error) {
        setErrors([`Fel vid läsning av Excel: ${error.message}`]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processData = async (data) => {
    const newErrors = [];
    const newWarnings = [];
    const processed = [];

    // Intelligent column mapping - supports multiple languages and formats
    const columnMapping = {
      // Name variations
      'namn': 'name',
      'name': 'name',
      'kundnamn': 'name',
      'company name': 'name',
      'företagsnamn': 'name',
      'customer name': 'name',

      // Email variations
      'email': 'email',
      'e-post': 'email',
      'epost': 'email',
      'mail': 'email',
      'e-mail': 'email',

      // Phone variations
      'telefon': 'phone',
      'phone': 'phone',
      'tel': 'phone',
      'mobilnummer': 'phone',
      'mobile': 'phone',
      'telefonnummer': 'phone',

      // Address variations
      'adress': 'address',
      'address': 'address',
      'gatuadress': 'address',
      'street': 'address',
      'street address': 'address',

      // Zip code variations
      'postnummer': 'zipCode',
      'zipcode': 'zipCode',
      'zip': 'zipCode',
      'postal code': 'zipCode',
      'zip code': 'zipCode',

      // City variations
      'stad': 'city',
      'city': 'city',
      'ort': 'city',

      // Org number variations
      'organisationsnummer': 'orgNr',
      'orgnr': 'orgNr',
      'orgnummer': 'orgNr',
      'org.nr': 'orgNr',
      'org nr': 'orgNr',
      'organization number': 'orgNr',
      'company registration number': 'orgNr',

      // Personal number variations
      'personnummer': 'personnummer',
      'pnr': 'personnummer',
      'personal number': 'personnummer',

      // ROT variations
      'rot': 'rotCustomer',
      'rotkund': 'rotCustomer',
      'rot-kund': 'rotCustomer',
      'rot kund': 'rotCustomer',
      'rot customer': 'rotCustomer',

      // RUT variations
      'rut': 'rutCustomer',
      'rutkund': 'rutCustomer',
      'rut-kund': 'rutCustomer',
      'rut kund': 'rutCustomer',
      'rut customer': 'rutCustomer'
    };

    data.forEach((row, index) => {
      const customer = {
        rowNumber: index + 2,
        warnings: [],
        errors: []
      };

      // Map columns
      Object.keys(row).forEach(key => {
        const normalizedKey = key.toLowerCase().trim();
        const mappedKey = columnMapping[normalizedKey];

        if (mappedKey && row[key]) {
          const value = row[key].toString().trim();

          if (mappedKey === 'name' && value) {
            customer.name = value;
          } else if (mappedKey === 'email' && value) {
            if (isValidEmail(value)) {
              customer.email = value.toLowerCase();
            } else {
              customer.warnings.push(`Ogiltig e-postadress: ${value}`);
            }
          } else if (mappedKey === 'phone' && value) {
            if (isValidPhone(value)) {
              customer.phone = formatPhone(value);
            } else {
              customer.warnings.push(`Ogiltigt telefonnummer: ${value}`);
            }
          } else if (mappedKey === 'address' && value) {
            customer.address = value;
          } else if (mappedKey === 'zipCode' && value) {
            customer.zipCode = value.replace(/\s/g, '');
          } else if (mappedKey === 'city' && value) {
            customer.city = value;
          } else if (mappedKey === 'orgNr' && value) {
            if (isValidOrgNr(value)) {
              customer.orgNr = value.replace(/[\s\-]/g, '');
            } else {
              customer.warnings.push(`Ogiltigt organisationsnummer: ${value}`);
            }
          } else if (mappedKey === 'personnummer' && value) {
            customer.personnummer = value.replace(/[\s\-]/g, '');
          } else if (mappedKey === 'rotCustomer') {
            customer.rotCustomer = ['ja', 'yes', '1', 'true', 'x'].includes(value.toLowerCase()) ? 'Ja' : 'Nej';
          } else if (mappedKey === 'rutCustomer') {
            customer.rutCustomer = ['ja', 'yes', '1', 'true', 'x'].includes(value.toLowerCase()) ? 'Ja' : 'Nej';
          }
        }
      });

      // Set defaults
      if (!customer.rotCustomer) customer.rotCustomer = 'Nej';
      if (!customer.rutCustomer) customer.rutCustomer = 'Nej';

      // Validate required fields
      if (!customer.name || customer.name.trim() === '') {
        customer.errors.push('Namn saknas (obligatoriskt)');
      }

      // Add to processed or errors
      if (customer.errors.length === 0) {
        processed.push(customer);
        if (customer.warnings.length > 0) {
          newWarnings.push(`Rad ${customer.rowNumber}: ${customer.warnings.join(', ')}`);
        }
      } else {
        newErrors.push(`Rad ${customer.rowNumber}: ${customer.errors.join(', ')}`);
      }
    });

    // Check for duplicates
    if (userDetails?.organizationId) {
      try {
        const existingCustomersQuery = query(
          collection(db, 'customers'),
          where('organizationId', '==', userDetails.organizationId)
        );
        const existingSnapshot = await getDocs(existingCustomersQuery);
        const existingCustomers = existingSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const foundDuplicates = [];
        processed.forEach(customer => {
          const duplicate = existingCustomers.find(existing =>
            existing.name.toLowerCase() === customer.name.toLowerCase() ||
            (customer.email && existing.email && existing.email.toLowerCase() === customer.email.toLowerCase()) ||
            (customer.orgNr && existing.orgNr && existing.orgNr === customer.orgNr)
          );

          if (duplicate) {
            foundDuplicates.push({
              ...customer,
              duplicateOf: duplicate.name
            });
          }
        });

        setDuplicates(foundDuplicates);
      } catch (error) {
        console.error('Error checking duplicates:', error);
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    setParsedData(processed);
    setValidatedData(processed);

    if (processed.length > 0) {
      setStep(2);
    }
  };

  const handleImport = async () => {
    if (!userDetails?.organizationId) {
      setErrors(['Du måste vara inloggad och ha en organisation för att importera kunder']);
      return;
    }

    setImporting(true);
    setStep(3);
    setImportProgress(0);

    try {
      // Get current customer count to generate sequential numbers
      const customersQuery = query(
        collection(db, 'customers'),
        where('organizationId', '==', userDetails.organizationId)
      );
      const existingSnapshot = await getDocs(customersQuery);
      let customerNumber = existingSnapshot.size + 1;

      const customersRef = collection(db, 'customers');
      const batchSize = 50; // Firestore batch limit is 500, but we'll be conservative
      const batches = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;

      // Prepare batches
      validatedData.forEach((customer, index) => {
        const docRef = doc(customersRef);
        // Format with 4-digit padding: 0001, 0002, 0003, etc.
        const paddedNumber = customerNumber.toString().padStart(4, '0');

        currentBatch.set(docRef, {
          name: customer.name,
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          zipCode: customer.zipCode || '',
          city: customer.city || '',
          orgNr: customer.orgNr || '',
          personnummer: customer.personnummer || '',
          rotCustomer: customer.rotCustomer,
          rutCustomer: customer.rutCustomer,
          organizationId: userDetails.organizationId,
          customerNumber: paddedNumber,
          createdAt: new Date(),
          importedAt: new Date(),
          importedFrom: file.name
        });

        customerNumber++;
        operationCount++;

        // Commit batch when reaching batch size
        if (operationCount === batchSize) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }

        // Update progress
        const progress = Math.round(((index + 1) / validatedData.length) * 90);
        setImportProgress(progress);
      });

      // Add any remaining operations
      if (operationCount > 0) {
        batches.push(currentBatch);
      }

      // Commit all batches
      for (let i = 0; i < batches.length; i++) {
        await batches[i].commit();
        const progress = 90 + Math.round((i + 1) / batches.length * 10);
        setImportProgress(progress);
      }

      setImportProgress(100);
      setStep(4);

      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Import error:', error);
      setErrors([`Fel vid import: ${error.message}`]);
      setStep(2);
    } finally {
      setImporting(false);
    }
  };

  const removeCustomer = (index) => {
    setValidatedData(validatedData.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setValidatedData([]);
    setDuplicates([]);
    setErrors([]);
    setWarnings([]);
    setImportProgress(0);
    setStep(1);
    onClose();
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Namn': 'Exempel AB',
        'Email': 'info@exempel.se',
        'Telefon': '0701234567',
        'Adress': 'Exempelgatan 1',
        'Postnummer': '12345',
        'Stad': 'Stockholm',
        'Organisationsnummer': '5561234567',
        'Personnummer': '',
        'ROT': 'Ja',
        'RUT': 'Nej'
      },
      {
        'Namn': 'Kalle Karlsson',
        'Email': 'kalle@example.com',
        'Telefon': '0709876543',
        'Adress': 'Storgatan 10',
        'Postnummer': '11122',
        'Stad': 'Stockholm',
        'Organisationsnummer': '',
        'Personnummer': '198001011234',
        'ROT': 'Nej',
        'RUT': 'Ja'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kunder');

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Namn
      { wch: 25 }, // Email
      { wch: 15 }, // Telefon
      { wch: 25 }, // Adress
      { wch: 12 }, // Postnummer
      { wch: 15 }, // Stad
      { wch: 15 }, // Organisationsnummer
      { wch: 15 }, // Personnummer
      { wch: 8 },  // ROT
      { wch: 8 }   // RUT
    ];

    XLSX.writeFile(wb, 'kundmall.xlsx');
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: step === 2 ? '1000px' : '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#3b82f615',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)'
            }}>
              <Upload size={24} color="#3b82f6" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>
                Importera Kunder
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                {step === 1 && 'Ladda upp CSV eller Excel-fil'}
                {step === 2 && `Granska ${validatedData.length} kunder innan import`}
                {step === 3 && 'Importerar kunder...'}
                {step === 4 && 'Import slutförd!'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={importing}
            style={{
              background: 'none',
              border: 'none',
              cursor: importing ? 'not-allowed' : 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              transition: 'color 0.2s',
              borderRadius: '8px'
            }}
            onMouseEnter={(e) => !importing && (e.currentTarget.style.color = '#0f172a')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* STEP 1: Upload */}
          {step === 1 && (
            <>
              {/* Info Banner */}
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #3b82f6',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <Info size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#0f172a', fontSize: '0.875rem' }}>
                    Första gången du importerar?
                  </p>
                  <p style={{ margin: '0 0 0.75rem 0', color: '#64748b', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    Ladda ner vår exempelmall för att se vilka kolumner som stöds och hur datan ska formateras.
                  </p>
                  <button
                    onClick={downloadTemplate}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
                    }}
                  >
                    <Download size={16} />
                    Ladda ner mall
                  </button>
                </div>
              </div>

              {/* Drag & Drop Area */}
              <div
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  backgroundColor: file ? '#f8fafc' : 'white'
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.backgroundColor = file ? '#f8fafc' : 'white';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.backgroundColor = file ? '#f8fafc' : 'white';
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile) {
                    handleFileChange({ target: { files: [droppedFile] } });
                  }
                }}
              >
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f615',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                  }}>
                    <FileText size={40} color="#3b82f6" />
                  </div>
                  <p style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
                    {file ? file.name : 'Dra och släpp din fil här'}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    eller klicka för att välja fil från din dator
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Stödda format: CSV, XLSX, XLS (max 10 MB)
                  </p>
                </label>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div style={{
                  marginTop: '1.5rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #ef4444',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <AlertCircle size={20} color="#ef4444" />
                    <p style={{ margin: 0, fontWeight: '600', color: '#dc2626', fontSize: '0.875rem' }}>
                      Problem upptäcktes ({errors.length})
                    </p>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#dc2626', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {errors.slice(0, 10).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {errors.length > 10 && (
                      <li style={{ fontStyle: 'italic', color: '#94a3b8' }}>
                        ...och {errors.length - 10} fler problem
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* STEP 2: Review */}
          {step === 2 && (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #10b981',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <CheckCircle size={24} color="#10b981" />
                  <div>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>
                      {validatedData.length}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                      Kunder redo
                    </p>
                  </div>
                </div>

                {duplicates.length > 0 && (
                  <div style={{
                    backgroundColor: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <AlertCircle size={24} color="#f59e0b" />
                    <div>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>
                        {duplicates.length}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                        Möjliga dubletter
                      </p>
                    </div>
                  </div>
                )}

                {warnings.length > 0 && (
                  <div style={{
                    backgroundColor: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <Info size={24} color="#f59e0b" />
                    <div>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>
                        {warnings.length}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                        Varningar
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Duplicates Warning */}
              {duplicates.length > 0 && (
                <div style={{
                  backgroundColor: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <AlertCircle size={18} color="#f59e0b" />
                    <p style={{ margin: 0, fontWeight: '600', color: '#92400e', fontSize: '0.875rem' }}>
                      Möjliga dubletter hittades
                    </p>
                  </div>
                  <p style={{ margin: 0, color: '#92400e', fontSize: '0.75rem', lineHeight: 1.5 }}>
                    {duplicates.length} kunder verkar redan finnas i systemet. Granska listan nedan och ta bort dubletterna innan import.
                  </p>
                </div>
              )}

              {/* Preview Table */}
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                overflow: 'hidden',
                maxHeight: '500px',
                overflowY: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <tr>
                      <th style={tableHeaderStyle}>Namn</th>
                      <th style={tableHeaderStyle}>Kontakt</th>
                      <th style={tableHeaderStyle}>Adress</th>
                      <th style={tableHeaderStyle}>Typ</th>
                      <th style={tableHeaderStyle}>ROT/RUT</th>
                      <th style={tableHeaderStyle}>Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validatedData.map((customer, index) => {
                      const isDuplicate = duplicates.some(d => d.rowNumber === customer.rowNumber);
                      return (
                        <tr key={index} style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: isDuplicate ? '#fef3c715' : 'white',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDuplicate ? '#fef3c730' : '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDuplicate ? '#fef3c715' : 'white'}
                        >
                          <td style={tableCellStyle}>
                            <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '0.125rem' }}>
                              {customer.name}
                            </div>
                            {isDuplicate && (
                              <div style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <AlertCircle size={12} />
                                Liknar: {duplicates.find(d => d.rowNumber === customer.rowNumber)?.duplicateOf}
                              </div>
                            )}
                          </td>
                          <td style={tableCellStyle}>
                            {customer.email && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                <Mail size={12} color="#64748b" />
                                <span>{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                                <Phone size={12} color="#64748b" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                          </td>
                          <td style={tableCellStyle}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {customer.address && <div>{customer.address}</div>}
                              {(customer.zipCode || customer.city) && (
                                <div>{customer.zipCode} {customer.city}</div>
                              )}
                              {!customer.address && !customer.zipCode && !customer.city && '—'}
                            </div>
                          </td>
                          <td style={tableCellStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                              {customer.orgNr ? (
                                <>
                                  <Building2 size={14} color="#f59e0b" />
                                  <span style={{ color: '#64748b' }}>Företag</span>
                                </>
                              ) : (
                                <>
                                  <Users size={14} color="#3b82f6" />
                                  <span style={{ color: '#64748b' }}>Privat</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td style={tableCellStyle}>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              {customer.rotCustomer === 'Ja' && (
                                <span style={{
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '6px',
                                  backgroundColor: '#10b98115',
                                  color: '#10b981',
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}>
                                  ROT
                                </span>
                              )}
                              {customer.rutCustomer === 'Ja' && (
                                <span style={{
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '6px',
                                  backgroundColor: '#8b5cf615',
                                  color: '#8b5cf6',
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}>
                                  RUT
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={tableCellStyle}>
                            <button
                              onClick={() => removeCustomer(index)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0.375rem',
                                backgroundColor: 'transparent',
                                color: '#ef4444',
                                border: '1px solid #fee2e2',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.75rem'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#fef2f2';
                                e.currentTarget.style.borderColor = '#ef4444';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.borderColor = '#fee2e2';
                              }}
                              title="Ta bort"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {validatedData.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#64748b'
                }}>
                  <AlertCircle size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                  <p style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#0f172a' }}>
                    Inga kunder att importera
                  </p>
                  <p style={{ fontSize: '0.875rem' }}>
                    Alla rader har tagits bort eller innehöll fel
                  </p>
                </div>
              )}
            </>
          )}

          {/* STEP 3: Processing */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: '#3b82f615',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 2rem',
                position: 'relative'
              }}>
                <Loader size={60} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{
                  position: 'absolute',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#3b82f6'
                }}>
                  {importProgress}%
                </div>
              </div>

              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                Importerar kunder...
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: '2rem' }}>
                Detta kan ta några sekunder beroende på antal kunder
              </p>

              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#f1f5f9',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: `${importProgress}%`,
                  height: '100%',
                  backgroundColor: '#3b82f6',
                  transition: 'width 0.3s ease',
                  borderRadius: '4px'
                }} />
              </div>

              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                {Math.round((importProgress / 100) * validatedData.length)} av {validatedData.length} kunder importerade
              </p>
            </div>
          )}

          {/* STEP 4: Complete */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: '#10b98115',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 2rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}>
                <CheckCircle size={50} color="#10b981" />
              </div>

              <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.75rem 0' }}>
                Import slutförd!
              </h3>
              <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '0.5rem' }}>
                <strong style={{ color: '#10b981' }}>{validatedData.length} kunder</strong> har importerats till ditt kundregister
              </p>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                Du omdirigeras automatiskt...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 3 && step !== 4 && (
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8fafc'
          }}>
            <button
              onClick={handleClose}
              style={{
                padding: '0.625rem 1.25rem',
                backgroundColor: 'white',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              Avbryt
            </button>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {step === 2 && (
                <button
                  onClick={() => {
                    setStep(1);
                    setFile(null);
                    setParsedData([]);
                    setValidatedData([]);
                    setDuplicates([]);
                    setErrors([]);
                    setWarnings([]);
                  }}
                  style={{
                    padding: '0.625rem 1.25rem',
                    backgroundColor: 'white',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  Tillbaka
                </button>
              )}

              {step === 1 && (
                <button
                  onClick={() => document.getElementById('file-upload').click()}
                  style={{
                    padding: '0.625rem 1.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
                  }}
                >
                  <Upload size={16} />
                  Välj fil
                </button>
              )}

              {step === 2 && (
                <button
                  onClick={handleImport}
                  disabled={validatedData.length === 0}
                  style={{
                    padding: '0.625rem 1.5rem',
                    backgroundColor: validatedData.length === 0 ? '#94a3b8' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: validatedData.length === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: validatedData.length === 0 ? 'none' : '0 2px 4px rgba(16, 185, 129, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    if (validatedData.length > 0) {
                      e.currentTarget.style.backgroundColor = '#059669';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (validatedData.length > 0) {
                      e.currentTarget.style.backgroundColor = '#10b981';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
                    }
                  }}
                >
                  <CheckCircle size={16} />
                  Importera {validatedData.length} kunder
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Table Styles
const tableHeaderStyle = {
  padding: '1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: '700',
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '2px solid #e2e8f0'
};

const tableCellStyle = {
  padding: '1rem',
  fontSize: '0.875rem',
  color: '#0f172a',
  verticalAlign: 'top'
};
