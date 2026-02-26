import React, { useState, useEffect } from 'react';
import { Users, Settings, Home } from 'lucide-react';

function isDark(hex) {
  if (!hex) return false;
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

function HomePage() {
  const [businessInfo, setBusinessInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const response = await fetch('/api/get-business-info');
        const data = await response.json();
        setBusinessInfo(data);
      } catch (error) {
        console.error('Error loading business info:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBusinessInfo();
  }, []);

  const bgColor = businessInfo?.backgroundColor || '#f9fafb';
  const accentColor = businessInfo?.accentColor || '#6b7280';
  const cardBg = businessInfo?.cardBackground || '#f8f8f8';
  const borderColor = businessInfo?.borderColor || '#374151';
  const btnOnAccent = isDark(accentColor) ? '#ffffff' : '#1a1a2e';

  const bgIsDark = isDark(bgColor);
  const heroText = bgIsDark ? '#ffffff' : borderColor;
  const heroSubtext = bgIsDark ? 'rgba(255,255,255,0.55)' : '#9ca3af';
  const navText = bgIsDark ? '#ffffff' : (isDark(borderColor) ? borderColor : '#f9fafb');

  const cardIsDark = isDark(cardBg);
  const cardHeading = cardIsDark ? '#ffffff' : (isDark(borderColor) ? borderColor : '#f9fafb');
  const cardText = cardIsDark ? '#d1d5db' : '#6b7280';
  const cardSubtext = cardIsDark ? '#9ca3af' : (isDark(accentColor) ? accentColor : '#6b7280');

  if (loading || !businessInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden animate-fade-in" style={{ backgroundColor: bgColor }}>
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
             style={{ backgroundColor: accentColor }}></div>
      </div>

      {/* Navigation — no company name on homepage */}
      <nav style={{ backgroundColor: bgIsDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${bgIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}` }} className="relative z-10">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div></div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-1">
              {[
                { href: '/#/', icon: Home, label: 'Home' },
                { href: '/#/staff', icon: Users, label: 'Loyalty Desk' },
                { href: '/#/admin', icon: Settings, label: 'Client Management' },
              ].map(({ href, icon: Icon, label }) => (
                <a key={href} href={href}
                  className="px-4 py-2 rounded-lg font-medium text-xs transition-all hover:scale-105 flex items-center gap-1.5 no-underline"
                  style={{
                    backgroundColor: bgIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    color: navText,
                  }}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </a>
              ))}
            </div>
            {/* Mobile hamburger */}
            <button className="md:hidden p-2 rounded-lg"
              style={{ backgroundColor: bgIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: navText }}
              onClick={() => setMobileNav(!mobileNav)}>
              <span style={{ fontSize: '18px' }}>{mobileNav ? '✕' : '☰'}</span>
            </button>
          </div>
          {/* Mobile menu */}
          {mobileNav && (
            <div className="md:hidden mt-2 flex flex-col gap-1.5 pb-2">
              {[
                { href: '/#/', icon: Home, label: 'Home' },
                { href: '/#/staff', icon: Users, label: 'Loyalty Desk' },
                { href: '/#/admin', icon: Settings, label: 'Client Management' },
              ].map(({ href, icon: Icon, label }) => (
                <a key={href} href={href}
                  className="px-4 py-2.5 rounded-lg font-medium text-xs flex items-center gap-2 no-underline"
                  style={{ backgroundColor: bgIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: navText }}
                  onClick={() => setMobileNav(false)}>
                  <Icon className="w-4 h-4" />
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-20">

        {/* Logo + Tagline at top center */}
        <div className="text-center mb-12 animate-slide-up">
          {businessInfo?.logo ? (
            <div style={{ marginBottom: '4px' }}>
              <img
                src={businessInfo.logo}
                alt={businessInfo.businessName}
                className="mx-auto object-contain"
                style={{
                  height: '280px',
                  maxWidth: '400px',
                  filter: bgIsDark ? 'drop-shadow(0 4px 24px rgba(255,255,255,0.1))' : 'drop-shadow(0 4px 24px rgba(0,0,0,0.08))',
                }}
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          ) : (
            <div
              className="mx-auto rounded-3xl flex items-center justify-center shadow-xl"
              style={{
                width: '200px',
                height: '200px',
                marginBottom: '4px',
                backgroundColor: accentColor,
                color: btnOnAccent,
                fontSize: '80px',
                fontWeight: 800,
              }}>
              {businessInfo?.businessName?.charAt(0) || 'B'}
            </div>
          )}
          {businessInfo?.tagline && (
            <p className="font-light tracking-widest uppercase" style={{ color: heroSubtext, fontSize: '0.7rem', letterSpacing: '0.2em' }}>
              {businessInfo.tagline}
            </p>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
          {/* Staff Card */}
          <a
            href="/#/staff"
            className="group rounded-2xl p-8 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl animate-slide-up no-underline"
            style={{
              animationDelay: '0.1s',
              backgroundColor: bgIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${bgIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = accentColor; e.currentTarget.querySelectorAll('[data-card-text]').forEach(el => el.style.color = btnOnAccent); }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = bgIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'; e.currentTarget.querySelector('[data-card-heading]').style.color = cardHeading; e.currentTarget.querySelector('[data-card-desc]').style.color = cardText; e.currentTarget.querySelector('[data-card-sub]').style.color = cardSubtext; }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              <Users style={{ width: 28, height: 28, color: btnOnAccent }} />
            </div>
            <h2 data-card-text data-card-heading className="text-xl font-bold mb-2 tracking-tight transition-colors duration-300" style={{ color: cardHeading }}>
              Loyalty Desk
            </h2>
            <p data-card-text data-card-desc className="text-sm font-normal leading-relaxed transition-colors duration-300" style={{ color: cardText }}>
              Search customers and add stamps
            </p>
            <div data-card-text data-card-sub className="mt-6 inline-flex items-center text-xs font-semibold gap-2 group-hover:gap-3 transition-all" style={{ color: cardSubtext }}>
              For Staff
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </a>

          {/* Admin Card */}
          <a
            href="/#/admin"
            className="group rounded-2xl p-8 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl animate-slide-up no-underline"
            style={{
              animationDelay: '0.2s',
              backgroundColor: bgIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${bgIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = accentColor; e.currentTarget.querySelectorAll('[data-card-text]').forEach(el => el.style.color = btnOnAccent); }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = bgIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'; e.currentTarget.querySelector('[data-card-heading]').style.color = cardHeading; e.currentTarget.querySelector('[data-card-desc]').style.color = cardText; e.currentTarget.querySelector('[data-card-sub]').style.color = cardSubtext; }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              <Settings style={{ width: 28, height: 28, color: btnOnAccent }} />
            </div>
            <h2 data-card-text data-card-heading className="text-xl font-bold mb-2 tracking-tight transition-colors duration-300" style={{ color: cardHeading }}>
              Client Management
            </h2>
            <p data-card-text data-card-desc className="text-sm font-normal leading-relaxed transition-colors duration-300" style={{ color: cardText }}>
              Manage clients, view analytics & more
            </p>
            <div data-card-text data-card-sub className="mt-6 inline-flex items-center text-xs font-semibold gap-2 group-hover:gap-3 transition-all" style={{ color: cardSubtext }}>
              For Admins
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-xs" style={{ color: `${heroText}20` }}>
          Made by Simple Labs PH
        </p>
      </div>
    </div>
  );
}

export default HomePage;
