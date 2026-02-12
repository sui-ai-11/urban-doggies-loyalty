import React, { useState, useEffect } from 'react';
import { Users, Settings, Home } from 'lucide-react';

function HomePage() {
  const [businessInfo, setBusinessInfo] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const bgColor = businessInfo?.backgroundColor || '#17BEBB';
  const accentColor = businessInfo?.accentColor || '#17BEBB';
  const cardBg = businessInfo?.cardBackground || '#F5F1E8';
  const borderColor = businessInfo?.borderColor || '#1F3A93';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: bgColor }}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-20 blur-3xl" 
             style={{ backgroundColor: accentColor }}></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-20 blur-3xl" 
             style={{ backgroundColor: borderColor }}></div>
      </div>

      {/* Glassmorphism Navigation */}
      <nav className="glass relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 animate-fade-in">
              {businessInfo?.logo ? (
                <img 
                  src={businessInfo.logo} 
                  alt={businessInfo.businessName}
                  className="h-14 w-14 object-contain rounded-xl glass-card p-2"
                  onError={(e) => e.target.style.display = 'none'}
                />
              ) : (
                <div 
                  className="h-14 w-14 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: accentColor }}
                >
                  {businessInfo?.businessName?.charAt(0) || 'B'}
                </div>
              )}
              <span className="text-2xl font-bold text-white tracking-tight">
                {businessInfo?.businessName || 'Business Name'}
              </span>
            </div>

            {/* Navigation Links */}
            <div className="flex gap-2">
              <a
                href="/#/"
                className="glass px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105 hover:bg-white hover:bg-opacity-20 flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Home
              </a>
              <a
                href="/#/staff"
                className="glass px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105 hover:bg-white hover:bg-opacity-20 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Loyalty Desk
              </a>
              <a
                href="/#/admin"
                className="glass px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105 hover:bg-white hover:bg-opacity-20 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Client Management
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-20 animate-slide-up">
          <h1 className="text-6xl md:text-7xl font-black text-white mb-4 tracking-tight">
            {businessInfo?.businessName || 'Business Name'}
          </h1>
          <p className="text-2xl md:text-3xl text-white font-light tracking-wide opacity-90">
            {businessInfo?.tagline || 'Digital Loyalty System'}
          </p>
        </div>

        {/* Main Cards - Glassmorphism */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Staff Card */}
          <a
            href="/#/staff"
            className="glass-card group rounded-3xl p-10 transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              <Users className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3 tracking-tight" style={{ color: borderColor }}>
              Loyalty Desk
            </h2>
            <p className="text-gray-600 text-lg font-light leading-relaxed">
              Search customers and add stamps
            </p>
            <div className="mt-8 inline-flex items-center text-sm font-semibold gap-2 group-hover:gap-3 transition-all" style={{ color: accentColor }}>
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
            style={{ animationDelay: '0.2s' }}
          >
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              <Settings className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3 tracking-tight" style={{ color: borderColor }}>
              Client Management
            </h2>
            <p className="text-gray-600 text-lg font-light leading-relaxed">
              Manage clients, view analytics & more
            </p>
            <div className="mt-8 inline-flex items-center text-sm font-semibold gap-2 group-hover:gap-3 transition-all" style={{ color: accentColor }}>
              For Admins
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </a>
        </div>

        {/* Info Sections */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="glass rounded-2xl p-6 transition-all hover:bg-white hover:bg-opacity-20 animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">📋 For Staff</h3>
            <p className="text-white font-light opacity-90">
              Quick customer check-in and stamp management
            </p>
          </div>
          <div className="glass rounded-2xl p-6 transition-all hover:bg-white hover:bg-opacity-20 animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">⚙️ For Admins</h3>
            <p className="text-white font-light opacity-90">
              Full system control, analytics and reporting
            </p>
          </div>
        </div>
        <p className="text-center text-white text-opacity-30 text-xs mt-12">v1.2.0</p>
      </div>
    </div>
  );
}

export default HomePage;
