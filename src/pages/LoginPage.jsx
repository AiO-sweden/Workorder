import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import './LoginPage.css'; // Import new CSS file

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login, currentUser } = useAuth();

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
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-form-container">
        <div className="login-header">
          <Link to="/" className="login-logo-link">
            <img src="/AIO Arbetsorder svart.png" alt="AIO Arbetsorder Logotyp" className="login-page-logo-image" />
          </Link>
          <h1>Logga in</h1>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">E-postadress</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="din@epost.se"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Lösenord</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Ditt lösenord"
            />
          </div>
          <div className="forgot-password-link" style={{ textAlign: "right", marginBottom: "1rem" }}>
            <Link to="/reset-password" style={{ color: "#3b82f6", textDecoration: "none", fontSize: "0.875rem" }}>
              Glömt lösenord?
            </Link>
          </div>
          {error && (
            <p className="error-message">{error}</p>
          )}
          <button type="submit" className="login-submit-button">
            Logga in
          </button>
        </form>
        <div className="signup-link-container">
          <p>
            Har du inget konto? <Link to="/create-account">Skapa ett konto gratis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

