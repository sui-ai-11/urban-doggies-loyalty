import React, { useState, useEffect } from 'react';
import { Users, Settings, Home } from 'lucide-react';

// Helper: determine if a hex color is dark
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

  const bgColor = businessInfo?.backgroundColor || '#1a1a2e';
  const accentColor = businessInfo?.accentColor || '#4a4a5a';
  const cardBg = businessInfo?.cardBackground || '#f8f8f8';
  const borderColor = businessInfo?.borderColor || '#2a2a3a';
  const btnOnAccent = isDark(accentColor) ? '#ffffff' : '#1a1a2e';

  // Dynamic text colors based on background brightness
  const bgIsDark = isDark(bgColor);
  const heroText = bgIsDark ? '#ffffff' : borderColor;
  const heroSubtext = bgIsDark ? 'rgba(255,255,255,0.8)' : `${borderColor}99`;
  const navText = bgIsDark ? '#ffffff' : (isDark(borderColor) ? borderColor : '#1a1a2e');

  // Card text (cards are usually light)
  const cardIsDark = isDark(cardBg);
  const cardHeading = cardIsDark ? '#ffffff' : (isDark(borderColor) ? borderColor : '#1a1a2e');
  const cardText = cardIsDark ? '#d1d5db' : '#6b7280';
  const cardSubtext = cardIsDark ? '#9ca3af' : (isDark(accentColor) ? accentColor : '#4a4a5a');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden animate-fade-in" style={{ backgroundColor: bgColor }}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-20 blur-3xl" 
             style={{ backgroundColor: accentColor }}></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-20 blur-3xl" 
             style={{ backgroundColor: borderColor }}></div>
      </div>

      {/* Navigation */}
      <nav style={{ backgroundColor: bgIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${bgIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }} className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 animate-fade-in">
              {businessInfo?.logo ? (
                <img 
                  src={businessInfo.logo} 
                  alt={businessInfo.businessName}
                  className="h-14 w-14 object-contain rounded-xl p-2"
                  style={{ backgroundColor: bgIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                  onError={(e) => e.target.style.display = 'none'}
                />
              ) : (
                <div 
                  className="h-14 w-14 rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg"
                  style={{ backgroundColor: accentColor, color: btnOnAccent }}
                >
                  {businessInfo?.businessName?.charAt(0) || 'B'}
                </div>
              )}
              <span className="text-2xl font-bold tracking-tight" style={{ color: navText }}>
                {businessInfo?.businessName || 'Business Name'}
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex gap-2">
              {[
                { href: '/#/', icon: Home, label: 'Home' },
                { href: '/#/staff', icon: Users, label: 'Loyalty Desk' },
                { href: '/#/admin', icon: Settings, label: 'Client Management' },
              ].map(({ href, icon: Icon, label }) => (
                <a key={href} href={href}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 flex items-center gap-2"
                  style={{
                    backgroundColor: bgIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    color: navText,
                  }}>
                  <Icon className="w-4 h-4" />
                  {label}
                </a>
              ))}
            </div>
            {/* Mobile hamburger */}
            <button className="md:hidden p-2 rounded-xl"
              style={{ backgroundColor: bgIsDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)', color: navText }}
              onClick={() => setMobileNav(!mobileNav)}>
              <span style={{ fontSize: '22px' }}>{mobileNav ? '✕' : '☰'}</span>
            </button>
          </div>
          {/* Mobile menu */}
          {mobileNav && (
            <div className="md:hidden mt-3 flex flex-col gap-2 pb-2">
              {[
                { href: '/#/', icon: Home, label: 'Home' },
                { href: '/#/staff', icon: Users, label: 'Loyalty Desk' },
                { href: '/#/admin', icon: Settings, label: 'Client Management' },
              ].map(({ href, icon: Icon, label }) => (
                <a key={href} href={href}
                  className="px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-3 no-underline"
                  style={{ backgroundColor: bgIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', color: navText }}
                  onClick={() => setMobileNav(false)}>
                  <Icon className="w-5 h-5" />
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-20 animate-slide-up">
          <h1 className="text-6xl md:text-7xl font-black mb-4 tracking-tight" style={{ color: heroText }}>
            {businessInfo?.businessName || 'Business Name'}
          </h1>
          <p className="text-2xl md:text-3xl font-light tracking-wide" style={{ color: heroSubtext }}>
            {businessInfo?.tagline || 'Digital Loyalty System'}
          </p>
        </div>

        {/* Main Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Staff Card */}
          <a
            href="/#/staff"
            className="glass-card group rounded-3xl p-10 transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-slide-up"
            style={{ animationDelay: '0.1s', backgroundColor: cardBg }}
          >
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              <Users style={{ width: 40, height: 40, color: btnOnAccent }} />
            </div>
            <h2 className="text-3xl font-bold mb-3 tracking-tight" style={{ color: cardHeading }}>
              Loyalty Desk
            </h2>
            <p className="text-lg font-light leading-relaxed" style={{ color: cardText }}>
              Search customers and add stamps
            </p>
            <div className="mt-8 inline-flex items-center text-sm font-semibold gap-2 group-hover:gap-3 transition-all" style={{ color: cardSubtext }}>
              For Staff 
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </a>

          {/* Admin Card */}
          <a
            href="/#/admin"
            className="glass-card group rounded-3xl p-10 transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-slide-up"
            style={{ animationDelay: '0.2s', backgroundColor: cardBg }}
          >
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              <Settings style={{ width: 40, height: 40, color: btnOnAccent }} />
            </div>
            <h2 className="text-3xl font-bold mb-3 tracking-tight" style={{ color: cardHeading }}>
              Client Management
            </h2>
            <p className="text-lg font-light leading-relaxed" style={{ color: cardText }}>
              Manage clients, view analytics & more
            </p>
            <div className="mt-8 inline-flex items-center text-sm font-semibold gap-2 group-hover:gap-3 transition-all" style={{ color: cardSubtext }}>
              For Admins
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </a>
        </div>

        <p className="text-center text-xs mt-12" style={{ color: `${heroText}30` }}>v1.3.0</p>
      </div>
    </div>
  );
}

export default HomePage;
