import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './CreateAccountPage.css'; // We'll create this for styling

// Placeholder icons - replace with actual icons or SVGs
const ThumbUpIcon = () => <span>👍</span>;
const CreditCardIcon = () => <span>💳</span>;
const LockIcon = () => <span>🔒</span>;
const PercentIcon = () => <span>%</span>;
const PhoneIcon = () => <span>📞</span>;


const CreateAccountPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError(null);
    if (!agreedToTerms) {
      setError('Du måste godkänna integritetspolicyn och tjänsteavtalen.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte.');
      return;
    }
    try {
      await signup(email, password, {
        firstName,
        lastName,
        companyName,
        phoneNumber
      });

      navigate('/dashboard');
    } catch (err) {
      // Supabase error handling
      if (err.message?.includes('already registered') || err.message?.includes('already been registered')) {
        setError('E-postadressen används redan.');
      } else if (err.message?.includes('Password should be at least')) {
        setError('Lösenordet är för svagt. Det måste vara minst 6 tecken.');
      } else {
        setError('Kunde inte skapa konto. Försök igen: ' + (err.message || ''));
      }
      console.error("Error creating account:", err);
    }
  };

  const benefits = [
    { icon: <ThumbUpIcon />, text: "Ingen startavgift" },
    { icon: <CreditCardIcon />, text: "Aktivera själv efter testperioden" },
    { icon: <LockIcon />, text: "Ingen bindningstid" },
    { icon: <PercentIcon />, text: "10% rabatt vid årlig betalning" },
    { icon: <PhoneIcon />, text: "Gratis telefon och emailsupport" },
  ];

  return (
    <div className="create-account-page-container">
      <div className="create-account-header">
        <h1>Skapa konto</h1>
        <p className="trial-info">Gratis i 30 dagar</p>
      </div>
      <div className="create-account-content">
        <div className="create-account-form-section">
          <form onSubmit={handleCreateAccount} className="create-account-form">
            <div className="form-group">
              <label htmlFor="firstName">Förnamn*</label>
              <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Efternamn*</label>
              <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="companyName">Företagsnamn*</label>
              <input type="text" id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email*</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="phoneNumber">Telefonnummer</label>
              <input type="tel" id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="password">Lösenord*</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Bekräfta lösenord*</label>
              <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <div className="form-group terms-agreement">
              <input type="checkbox" id="agreedToTerms" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
              <label htmlFor="agreedToTerms" className="terms-label">
                Jag har läst <a href="/integritetspolicy" target="_blank" rel="noopener noreferrer">integritetspolicyn</a> och tagit del av <a href="/tjansteavtal" target="_blank" rel="noopener noreferrer">tjänsteavtal</a>.
              </label>
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="submit-button">Skapa konto</button>
          </form>
          <div className="login-link-container">
            <p>Har du redan ett konto? <Link to="/login">Logga in</Link></p>
          </div>
        </div>
        <div className="benefits-section">
          <ul>
            {benefits.map((benefit, index) => (
              <li key={index}>
                <span className="benefit-icon">{benefit.icon}</span>
                {benefit.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateAccountPage;