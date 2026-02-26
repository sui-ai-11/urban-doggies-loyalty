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
  const borderColor = businessInfo?.borderColor || '#374151';
  const btnOnAccent = isDark(accentColor) ? '#ffffff' : '#1a1a2e';

  const bgIsDark = isDark(bgColor);
  const heroText = bgIsDark ? '#ffffff' : borderColor;
  const heroSubtext = bgIsDark ? 'rgba(255,255,255,0.55)' : '#9ca3af';
  const navText = bgIsDark ? '#ffffff' : (isDark(borderColor) ? borderColor : '#f9fafb');

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
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
             style={{ backgroundColor: accentColor }}></div>
      </div>

      {/* Navigation */}
      <nav style={{ backgroundColor: bgIsDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${bgIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}` }} className="relative z-10">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <a href="/#/" className="flex items-center gap-2 no-underline">
              <span className="text-sm font-semibold tracking-tight" style={{ color: navText, opacity: 0.7 }}>
                {businessInfo?.businessName || 'Home'}
              </span>
            </a>

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

      {/* Hero — Logo Centered */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <div className="text-center animate-slide-up" style={{ marginTop: '-40px' }}>

          {/* Large Hero Logo */}
          {businessInfo?.logo ? (
            <div className="mb-6">
              <img
                src={businessInfo.logo}
                alt={businessInfo.businessName}
                className="mx-auto object-contain"
                style={{
                  height: '160px',
                  maxWidth: '280px',
                  filter: bgIsDark ? 'drop-shadow(0 4px 24px rgba(255,255,255,0.1))' : 'drop-shadow(0 4px 24px rgba(0,0,0,0.08))',
                }}
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          ) : (
            <div
              className="mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-xl"
              style={{
                width: '120px',
                height: '120px',
                backgroundColor: accentColor,
                color: btnOnAccent,
                fontSize: '48px',
                fontWeight: 800,
              }}>
              {businessInfo?.businessName?.charAt(0) || 'B'}
            </div>
          )}

          {/* Business Name */}
          <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight" style={{ color: heroText }}>
            {businessInfo?.businessName || 'Business Name'}
          </h1>

          {/* Tagline */}
          <p className="text-sm md:text-base font-normal mb-10 tracking-wide" style={{ color: heroSubtext }}>
            {businessInfo?.tagline || 'Loyalty Rewards Program'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-sm mx-auto">
            <a href="/#/staff"
              className="w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2 no-underline"
              style={{ backgroundColor: accentColor, color: btnOnAccent }}>
              <Users className="w-4 h-4" />
              Loyalty Desk
            </a>
            <a href="/#/admin"
              className="w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2 no-underline"
              style={{
                backgroundColor: bgIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                color: heroText,
                border: `1px solid ${bgIsDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}`,
              }}>
              <Settings className="w-4 h-4" />
              Client Management
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="absolute bottom-6 text-center text-xs w-full" style={{ color: `${heroText}20` }}>
          Made by Simple Labs PH
        </p>
      </div>
    </div>
  );
}

export default HomePage;
