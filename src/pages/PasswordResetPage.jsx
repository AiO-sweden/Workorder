import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import './LoginPage.css'; // Reuse the same styling

export default function PasswordResetPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess("Ett e-postmeddelande för återställning av lösenord har skickats till din e-postadress.");
      setEmail("");
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError("Ingen användare hittades med denna e-postadress.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Ogiltig e-postadress.");
      } else {
        setError("Ett fel uppstod. Försök igen.");
      }
      console.error("Password reset error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-form-container">
        <div className="login-header">
          <Link to="/" className="login-logo-link">
            <img src="/AIO Arbetsorder svart.png" alt="AIO Arbetsorder Logotyp" className="login-page-logo-image" />
          </Link>
          <h1>Återställ lösenord</h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.5rem" }}>
            Ange din e-postadress så skickar vi instruktioner för att återställa ditt lösenord.
          </p>
        </div>
        <form onSubmit={handleResetPassword} className="login-form">
          <div className="form-group">
            <label htmlFor="email">E-postadress</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="din@epost.se"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="error-message">{error}</p>
          )}
          {success && (
            <p className="success-message" style={{
              padding: "0.75rem",
              backgroundColor: "#10b98115",
              border: "1px solid #10b981",
              borderRadius: "8px",
              color: "#10b981",
              fontSize: "0.9rem",
              marginBottom: "1rem"
            }}>
              {success}
            </p>
          )}
          <button type="submit" className="login-submit-button" disabled={loading}>
            {loading ? "Skickar..." : "Skicka återställningslänk"}
          </button>
        </form>
        <div className="signup-link-container">
          <p>
            Kom ihåg ditt lösenord? <Link to="/login">Logga in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
