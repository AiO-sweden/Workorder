import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, ArrowLeft, Mail, Lock, AlertCircle } from 'lucide-react';
import { useResponsive } from "../hooks/useResponsive";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, currentUser } = useAuth();
  const { isMobile } = useResponsive();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      console.log('✅ User already logged in, redirecting to dashboard');
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      // Supabase error handling
      if (err.message?.includes('Invalid login credentials') || err.message?.includes('Email not confirmed')) {
        setError("Felaktig e-postadress eller lösenord.");
      } else {
        setError("Ett fel uppstod vid inloggning. Försök igen: " + (err.message || ''));
      }
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      position: 'relative'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
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
          borderRadius: '8px'
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

      {/* Login Card */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: isMobile ? '16px' : '24px',
        padding: isMobile ? '1.5rem' : '3rem',
        width: '100%',
        maxWidth: '480px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2.5rem'
        }}>
          <Link to="/">
            <img
              src="/logo.png"
              alt="AIO Arbetsorder"
              style={{
                height: '50px',
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
            Välkommen tillbaka
          </h1>
          <p style={{
            color: '#94a3b8',
            fontSize: '1rem',
            margin: 0
          }}>
            Logga in på ditt konto
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {/* Email Field */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <label
              htmlFor="email"
              style={{
                color: '#e2e8f0',
                fontSize: '0.95rem',
                fontWeight: 500
              }}
            >
              E-postadress
            </label>
            <div style={{
              position: 'relative'
            }}>
              <Mail
                size={20}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="din@epost.se"
                style={{
                  width: '100%',
                  padding: '0.9rem 1rem 0.9rem 3rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1rem',
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

          {/* Password Field */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <label
              htmlFor="password"
              style={{
                color: '#e2e8f0',
                fontSize: '0.95rem',
                fontWeight: 500
              }}
            >
              Lösenord
            </label>
            <div style={{
              position: 'relative'
            }}>
              <Lock
                size={20}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Ditt lösenord"
                style={{
                  width: '100%',
                  padding: '0.9rem 1rem 0.9rem 3rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1rem',
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

          {/* Forgot Password Link */}
          <div style={{
            textAlign: 'right'
          }}>
            <Link
              to="/reset-password"
              style={{
                color: '#60a5fa',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#60a5fa';
              }}
            >
              Glömt lösenord?
            </Link>
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
              gap: '0.5rem'
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
              'Loggar in...'
            ) : (
              <>
                Logga in
                <LogIn size={20} />
              </>
            )}
          </button>
        </form>

        {/* Sign Up Link */}
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
            Har du inget konto?{' '}
            <Link
              to="/create-account"
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
              Skapa ett konto gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
