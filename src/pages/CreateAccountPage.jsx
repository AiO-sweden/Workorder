import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserPlus,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Building2,
  Phone,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ShieldCheck,
  Percent,
  Headphones
} from 'lucide-react';

const CreateAccountPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [wantsToPay, setWantsToPay] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
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

    setLoading(true);
    try {
      await signup(email, password, {
        firstName,
        lastName,
        companyName,
        phoneNumber,
        wantsToPay
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
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: <CheckCircle2 size={22} />, title: "Gratis i 30 dagar", text: "Ingen startavgift - testa fullt ut" },
    { icon: <CreditCard size={22} />, title: "Ingen bindningstid", text: "Aktivera eller avsluta när du vill" },
    { icon: <ShieldCheck size={22} />, title: "Säkert & GDPR", text: "100% säker datahantering" },
    { icon: <Percent size={22} />, title: "10% rabatt", text: "Vid årlig betalning" },
    { icon: <Headphones size={22} />, title: "Gratis support", text: "Telefon och email" },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      position: 'relative'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      {/* Back to home link */}
      <Link
        to="/"
        style={{
          position: 'absolute',
          top: '2rem',
          left: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#cbd5e1',
          textDecoration: 'none',
          fontSize: '0.95rem',
          transition: 'all 0.2s',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          zIndex: 10
        }}
        onMouseEnter={(e) => {
          e.target.style.color = '#fff';
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.color = '#cbd5e1';
          e.target.style.backgroundColor = 'transparent';
        }}
      >
        <ArrowLeft size={18} />
        Tillbaka till startsidan
      </Link>

      {/* Main Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '2rem',
        maxWidth: '1200px',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Form Card */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '3rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Logo & Title */}
          <div style={{
            marginBottom: '2.5rem'
          }}>
            <Link to="/">
              <img
                src="/logo.png"
                alt="AIO Arbetsorder"
                style={{
                  height: '45px',
                  marginBottom: '1.5rem',
                  filter: 'brightness(0) invert(1)'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </Link>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#fff',
              margin: 0,
              marginBottom: '0.5rem'
            }}>
              Skapa ditt konto
            </h1>
            <p style={{
              color: '#94a3b8',
              fontSize: '1rem',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={18} color="#3b82f6" />
              Gratis i 30 dagar - inget kreditkort krävs
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateAccount} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            {/* Name Fields Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              {/* First Name */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <label htmlFor="firstName" style={{
                  color: '#e2e8f0',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}>
                  Förnamn *
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="Kalle"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.75rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.borderColor = '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  />
                </div>
              </div>

              {/* Last Name */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <label htmlFor="lastName" style={{
                  color: '#e2e8f0',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}>
                  Efternamn *
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Karlsson"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.75rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.borderColor = '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Company Name */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <label htmlFor="companyName" style={{
                color: '#e2e8f0',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                Företagsnamn *
              </label>
              <div style={{ position: 'relative' }}>
                <Building2 size={18} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none'
                }} />
                <input
                  type="text"
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="Mitt Företag AB"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.borderColor = '#3b82f6';
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <label htmlFor="email" style={{
                color: '#e2e8f0',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                E-postadress *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none'
                }} />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="kalle@mittforetag.se"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.borderColor = '#3b82f6';
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                />
              </div>
            </div>

            {/* Phone */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <label htmlFor="phoneNumber" style={{
                color: '#e2e8f0',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                Telefonnummer
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none'
                }} />
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="070-123 45 67"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.borderColor = '#3b82f6';
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                />
              </div>
            </div>

            {/* Password Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              {/* Password */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <label htmlFor="password" style={{
                  color: '#e2e8f0',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}>
                  Lösenord *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Minst 6 tecken"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.75rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.borderColor = '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <label htmlFor="confirmPassword" style={{
                  color: '#e2e8f0',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}>
                  Bekräfta lösenord *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Samma lösenord"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.75rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.borderColor = '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Payment Checkbox */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.5rem 0',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <input
                type="checkbox"
                id="wantsToPay"
                checked={wantsToPay}
                onChange={(e) => setWantsToPay(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  marginTop: '2px',
                  accentColor: '#3b82f6'
                }}
              />
              <label htmlFor="wantsToPay" style={{
                color: '#e2e8f0',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                cursor: 'pointer'
              }}>
                <strong style={{ color: '#60a5fa' }}>Jag vill börja betala direkt</strong>
                <br />
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Markera denna om du är redo att börja använda en betald plan. Vi kontaktar dig med betalningsinformation.
                </span>
              </label>
            </div>

            {/* Terms Checkbox */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.5rem 0'
            }}>
              <input
                type="checkbox"
                id="agreedToTerms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  marginTop: '2px'
                }}
              />
              <label htmlFor="agreedToTerms" style={{
                color: '#cbd5e1',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                cursor: 'pointer'
              }}>
                Jag har läst{' '}
                <a href="/integritetspolicy" target="_blank" rel="noopener noreferrer" style={{
                  color: '#60a5fa',
                  textDecoration: 'none'
                }}>
                  integritetspolicyn
                </a>
                {' '}och tagit del av{' '}
                <a href="/tjansteavtal" target="_blank" rel="noopener noreferrer" style={{
                  color: '#60a5fa',
                  textDecoration: 'none'
                }}>
                  tjänsteavtal
                </a>
                .
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <AlertCircle size={20} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
                <p style={{
                  color: '#fca5a5',
                  margin: 0,
                  fontSize: '0.95rem',
                  lineHeight: 1.5
                }}>
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: loading ? '#64748b' : '#3b82f6',
                color: '#fff',
                padding: '1rem',
                borderRadius: '12px',
                border: 'none',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#2563eb';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 15px 40px rgba(59, 130, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#3b82f6';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.3)';
                }
              }}
            >
              {loading ? (
                'Skapar konto...'
              ) : (
                <>
                  Skapa konto
                  <UserPlus size={20} />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <p style={{
              color: '#94a3b8',
              fontSize: '0.95rem',
              margin: 0
            }}>
              Har du redan ett konto?{' '}
              <Link
                to="/login"
                style={{
                  color: '#60a5fa',
                  textDecoration: 'none',
                  fontWeight: 600,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#60a5fa';
                }}
              >
                Logga in här
              </Link>
            </p>
          </div>
        </div>

        {/* Benefits Card */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '3rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            Varför välja AIO Arbetsorder?
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '1rem',
            marginBottom: '2.5rem'
          }}>
            Allt du behöver för att hantera dina arbetsorder smidigt
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {benefits.map((benefit, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
                  e.currentTarget.style.transform = 'translateX(5px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  borderRadius: '10px',
                  padding: '0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60a5fa',
                  flexShrink: 0
                }}>
                  {benefit.icon}
                </div>
                <div>
                  <div style={{
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '1rem',
                    marginBottom: '0.25rem'
                  }}>
                    {benefit.title}
                  </div>
                  <div style={{
                    color: '#cbd5e1',
                    fontSize: '0.9rem'
                  }}>
                    {benefit.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAccountPage;
