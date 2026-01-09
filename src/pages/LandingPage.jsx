import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Calendar,
  Clock,
  FileText,
  Users,
  BarChart3,
  Smartphone,
  Zap,
  ShieldCheck
} from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: <FileText size={32} />,
      title: 'Digitala Arbetsorder',
      description: 'Skapa och hantera arbetsorder enkelt. Perfekt för el-, VVS- och byggsektorn.'
    },
    {
      icon: <Clock size={32} />,
      title: 'Tidrapportering',
      description: 'Rapportera tid direkt i appen. Få realtidsöversikt över projektens lönsamhet.'
    },
    {
      icon: <Calendar size={32} />,
      title: 'Schemaläggning',
      description: 'Planera och fördela arbetsuppgifter med drag-and-drop kalender.'
    },
    {
      icon: <Users size={32} />,
      title: 'Kundhantering',
      description: 'Håll koll på dina kunder och deras historik på ett ställe.'
    },
    {
      icon: <BarChart3 size={32} />,
      title: 'Rapporter & Analys',
      description: 'Få insikter om din verksamhet med omfattande rapporter och PDF-export.'
    },
    {
      icon: <Smartphone size={32} />,
      title: 'Mobilvänligt',
      description: 'Fungerar perfekt på både desktop och mobil - arbeta varifrån som helst.'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      color: '#fff',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Header/Navigation */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 5%',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <img
            src="/logo.png"
            alt="AIO Arbetsorder"
            style={{
              height: '45px',
              filter: 'brightness(0) invert(1)'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <h1 style={{
            display: 'none',
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: 0
          }}>AIO Arbetsorder</h1>
        </div>
        <nav style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <Link
            to="/login"
            style={{
              color: '#fff',
              textDecoration: 'none',
              padding: '0.6rem 1.5rem',
              borderRadius: '8px',
              fontWeight: 500,
              transition: 'all 0.2s',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Logga in
          </Link>
          <Link
            to="/create-account"
            style={{
              color: '#1a1a2e',
              backgroundColor: '#fff',
              textDecoration: 'none',
              padding: '0.6rem 1.5rem',
              borderRadius: '8px',
              fontWeight: 600,
              transition: 'all 0.2s',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f0f0f0';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#fff';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Skapa konto
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '6rem 5% 4rem',
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4rem',
        alignItems: 'center'
      }}>
        <div style={{
          animation: 'fadeInUp 0.8s ease-out',
          paddingRight: '2rem'
        }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            color: '#60a5fa',
            padding: '0.6rem 1.2rem',
            borderRadius: '25px',
            fontSize: '0.95rem',
            fontWeight: 600,
            marginBottom: '2rem',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <Zap size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Smarta arbetsorder för hantverkare
          </div>

          <h1 style={{
            fontSize: '4rem',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '2rem',
            backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #60a5fa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em'
          }}>
            Ditt smarta verktyg för arbetsorder och tidrapportering
          </h1>

          <p style={{
            fontSize: '1.35rem',
            lineHeight: 1.7,
            color: '#e2e8f0',
            marginBottom: '3rem',
            maxWidth: '580px',
            fontWeight: 400
          }}>
            Hantera arbetsorder, rapportera tid, planera scheman och fakturera kunder - allt från en plattform. Perfekt för VVS, El, Bygg och serviceföretag.
          </p>

          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '3rem'
          }}>
            <Link
              to="/create-account"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                backgroundColor: '#3b82f6',
                color: '#fff',
                textDecoration: 'none',
                padding: '1.1rem 2.5rem',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '1.15rem',
                transition: 'all 0.3s',
                border: 'none',
                boxShadow: '0 12px 35px rgba(59, 130, 246, 0.35)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 18px 45px rgba(59, 130, 246, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 12px 35px rgba(59, 130, 246, 0.35)';
              }}
            >
              Kom igång gratis
              <CheckCircle2 size={22} />
            </Link>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                textDecoration: 'none',
                padding: '1.1rem 2rem',
                borderRadius: '14px',
                fontWeight: 600,
                fontSize: '1.15rem',
                transition: 'all 0.3s',
                border: '2px solid rgba(255, 255, 255, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              Logga in
            </Link>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.2rem',
            padding: '1.2rem 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} style={{ color: '#fbbf24', fontSize: '1.3rem' }}>★</span>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '1rem', marginBottom: '0.2rem' }}>
                Betyg 4.8/5
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                Från 100+ nöjda företag
              </div>
            </div>
          </div>
        </div>

        <div style={{
          position: 'relative',
          animation: 'fadeIn 1s ease-out 0.3s both'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)'
          }} />
          <img
            src="/Bild första sida .png"
            alt="AIO Arbetsorder Dashboard"
            style={{
              width: '100%',
              transform: 'scale(1.4)',
              borderRadius: '20px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
              zIndex: 1
            }}
          />

          {/* Floating badges */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '-30px',
            backgroundColor: '#fff',
            color: '#1a1a2e',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            zIndex: 2
          }}>
            <ShieldCheck size={24} color="#3b82f6" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>100% Säkert</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>GDPR-kompatibelt</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '6rem 5%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '4rem'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              marginBottom: '1rem'
            }}>
              Funktioner som förenklar din vardag
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#cbd5e1',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              AIO Arbetsorder är fullmatat med smarta funktioner som gör din arbetsdag enklare och mer produktiv
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '2rem',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  marginBottom: '0.75rem'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: '#cbd5e1',
                  lineHeight: 1.7,
                  fontSize: '1rem'
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{
        padding: '6rem 5%',
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '2.75rem',
            fontWeight: 700,
            marginBottom: '1rem'
          }}>
            Välj din plan
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: '#cbd5e1',
            marginBottom: '4rem',
            maxWidth: '700px',
            margin: '0 auto 4rem'
          }}>
            Enkla, transparenta priser. Ingen bindningstid. Avsluta när du vill.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {/* Starter Plan */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '2.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'left',
              transition: 'all 0.3s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#94a3b8'
              }}>Starter</div>
              <div style={{
                fontSize: '3rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.5rem'
              }}>
                <span>299</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 400, color: '#94a3b8' }}>kr/mån</span>
              </div>
              <p style={{
                color: '#cbd5e1',
                marginBottom: '2rem',
                fontSize: '0.95rem'
              }}>Perfekt för mindre företag</p>

              <div style={{ marginBottom: '2rem' }}>
                {[
                  'Upp till 3 användare',
                  '50 arbetsorder/månad',
                  'Tidrapportering',
                  'Grundläggande rapporter',
                  'Mobilapp',
                  'Email support'
                ].map((feature, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem',
                    color: '#cbd5e1'
                  }}>
                    <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/create-account"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontWeight: 600,
                  transition: 'all 0.3s',
                  border: '2px solid rgba(255, 255, 255, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                }}
              >
                Kom igång
              </Link>
            </div>

            {/* Professional Plan - MOST POPULAR */}
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '2.5rem',
              border: '2px solid #3b82f6',
              textAlign: 'left',
              position: 'relative',
              transition: 'all 0.3s',
              cursor: 'pointer',
              boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 20px 50px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(59, 130, 246, 0.3)';
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                right: '20px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                padding: '0.4rem 1rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Populärast</div>

              <div style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#60a5fa'
              }}>Professional</div>
              <div style={{
                fontSize: '3rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.5rem'
              }}>
                <span>699</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 400, color: '#94a3b8' }}>kr/mån</span>
              </div>
              <p style={{
                color: '#cbd5e1',
                marginBottom: '2rem',
                fontSize: '0.95rem'
              }}>För växande företag</p>

              <div style={{ marginBottom: '2rem' }}>
                {[
                  'Upp till 10 användare',
                  'Obegränsat med arbetsorder',
                  'Avancerad tidrapportering',
                  'PDF-export av rapporter',
                  'Schemaläggning',
                  'Kundhantering',
                  'Prioriterad support',
                  'Integrationer'
                ].map((feature, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem',
                    color: '#fff'
                  }}>
                    <CheckCircle2 size={20} style={{ color: '#3b82f6', flexShrink: 0 }} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/create-account"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  transition: 'all 0.3s',
                  boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2563eb';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 15px 40px rgba(59, 130, 246, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#3b82f6';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.4)';
                }}
              >
                Prova gratis i 30 dagar
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '2.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'left',
              transition: 'all 0.3s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#94a3b8'
              }}>Enterprise</div>
              <div style={{
                fontSize: '3rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.5rem'
              }}>
                <span>Kontakta</span>
              </div>
              <p style={{
                color: '#cbd5e1',
                marginBottom: '2rem',
                fontSize: '0.95rem'
              }}>För stora organisationer</p>

              <div style={{ marginBottom: '2rem' }}>
                {[
                  'Obegränsat med användare',
                  'Skräddarsydda funktioner',
                  'Dedikerad account manager',
                  'Onboarding & utbildning',
                  'SLA-garanti',
                  'API-åtkomst',
                  'Anpassade integrationer',
                  '24/7 prioriterad support'
                ].map((feature, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem',
                    color: '#cbd5e1'
                  }}>
                    <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <a
                href="mailto:sales@aioarbetsorder.se"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontWeight: 600,
                  transition: 'all 0.3s',
                  border: '2px solid rgba(255, 255, 255, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                }}
              >
                Kontakta oss
              </a>
            </div>
          </div>

          <div style={{
            marginTop: '3rem',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '0.95rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                <span>30 dagars gratis testperiod</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                <span>Inget kreditkort krävs</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                <span>Avsluta när du vill</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '6rem 5%',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          padding: '4rem 3rem',
          borderRadius: '24px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            marginBottom: '1.5rem'
          }}>
            Redo att komma igång?
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: '#cbd5e1',
            marginBottom: '2.5rem',
            lineHeight: 1.7
          }}>
            Skapa ditt konto och kom igång med AIO Arbetsorder på ett par minuter. Inga kreditkort krävs för provperioden.
          </p>
          <Link
            to="/create-account"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#fff',
              color: '#1a1a2e',
              textDecoration: 'none',
              padding: '1.2rem 3rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '1.2rem',
              transition: 'all 0.3s',
              border: 'none',
              boxShadow: '0 10px 30px rgba(255, 255, 255, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 15px 40px rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 30px rgba(255, 255, 255, 0.2)';
            }}
          >
            Skapa konto - Gratis i 30 dagar
            <CheckCircle2 size={24} />
          </Link>
          <p style={{
            marginTop: '1.5rem',
            color: '#94a3b8',
            fontSize: '0.95rem'
          }}>
            <CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Ingen bindningstid • Avsluta när du vill • Svensk support
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '3rem 5%',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{
            marginBottom: '1.5rem'
          }}>
            <img
              src="/logo.png"
              alt="AIO Arbetsorder"
              style={{
                height: '40px',
                filter: 'brightness(0) invert(1)',
                opacity: 0.7
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <p style={{
            color: '#94a3b8',
            fontSize: '0.95rem',
            marginBottom: '1rem'
          }}>
            AIO Arbetsorder - Det smarta projektverktyget för moderna hantverkare
          </p>
          <p style={{
            color: '#64748b',
            fontSize: '0.85rem'
          }}>
            &copy; {new Date().getFullYear()} All in one Sweden AB. Alla rättigheter förbehållna.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          section > div {
            grid-template-columns: 1fr !important;
          }

          h1 {
            font-size: 2rem !important;
          }

          h2 {
            font-size: 1.75rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
