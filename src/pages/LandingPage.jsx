import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css'; // We'll update this for styling

const LandingPage = () => {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="logo">
          <img src="/AIO Arbetsorder svart.png" alt="AIO Arbetsorder Logotyp" className="logo-image" />
        </div>
        <nav className="landing-nav">
          {/* <Link to="/features">Funktioner</Link>
          <Link to="/pricing">Priser</Link>
          <Link to="/contact">Kontakt</Link> */}
          <Link to="/login" className="nav-button login-button-header">Logga in</Link>
          <Link to="/create-account" className="nav-button signup-button-header">Skapa konto</Link>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <h1>Smart tidrapportering, projekthantering & fakturering</h1>
          <p className="hero-subtitle">
            För er som har behov av tidrapportering och projektredovisning med inbyggd mobil arbetsorder, offerthantering, fakturering och mycket mer. AIO Arbetsorder är ett av marknadens mest flexibla och prisvärda system som passar de flesta företag och branscher.
          </p>
          <div className="hero-buttons">
            <Link to="/create-account" className="cta-button primary">Prova Gratis i 30 Dagar</Link>
            {/* <Link to="/features" className="cta-button secondary">Läs mer</Link> */}
          </div>
        </div>
        <div className="hero-image-container">
          {/* Placeholder for an image, similar to the phone in the example */}
          {/* You can use an actual image path here, e.g., /images/app-showcase.png */}
          <img src="/Första bild.png" alt="AIO Arbetsorder App Skärmdump" className="hero-image" />
        </div>
      </section>

      {/* Future sections can be added here:
      <section className="features-section">
        <h2>Funktioner som förenklar din vardag</h2>
        {...}
      </section>

      <section className="testimonials-section">
        <h2>Vad våra kunder säger</h2>
        {...}
      </section>
      */}

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} AIO Arbetsorder. Alla rättigheter förbehållna.</p>
        {/* Add more footer links if needed */}
      </footer>
    </div>
  );
};

export default LandingPage;