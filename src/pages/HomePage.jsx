import React, { useState, useEffect } from 'react';
import { Users, Settings, Home as HomeIcon } from 'lucide-react';

const HomePage = () => {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const response = await fetch('/api/get-business-info');
        const data = await response.json();
        console.log('Business data:', data); // Debug
        setBusiness(data);
      } catch (error) {
        console.error('Error fetching business info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessInfo();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-slate-600 mx-auto mb-4"></div>
          <div className="text-slate-600 text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  const accentColor = business?.accentColor || '#17BEBB';
  const backgroundColor = business?.backgroundColor || '#17BEBB';
  const borderColor = business?.borderColor || '#1F3A93';
  const businessName = business?.businessName || 'Business Name';
  const tagline = business?.tagline || 'Digital Loyalty System';
  const logoUrl = business?.logo || null;

  console.log('Logo URL:', logoUrl); // Debug

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${backgroundColor}f5 0%, ${backgroundColor} 100%)`
      }}
    >
      {/* Navigation - Clean & Professional */}
      <nav className="backdrop-blur-lg bg-white/20 border-b border-white/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16 space-x-3">
            <a href="/">
              <button className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-white/30 hover:bg-white/40 backdrop-blur-sm transition-all duration-200 text-white font-medium shadow-sm hover:shadow-md">
                <HomeIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Home</span>
              </button>
            </a>
            <a href="/staff">
              <button className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-white/30 hover:bg-white/40 backdrop-blur-sm transition-all duration-200 text-white font-medium shadow-sm hover:shadow-md">
                <Users className="w-5 h-5" />
                <span className="hidden sm:inline">Loyalty Desk</span>
              </button>
            </a>
            <a href="/admin">
              <button className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-white/30 hover:bg-white/40 backdrop-blur-sm transition-all duration-200 text-white font-medium shadow-sm hover:shadow-md">
                <Settings className="w-5 h-5" />
                <span className="hidden sm:inline">Client Management</span>
              </button>
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          {/* Logo */}
          {logoUrl ? (
            <div className="mb-8">
              <img 
                src={logoUrl} 
                alt={businessName}
                className="h-28 mx-auto object-contain drop-shadow-lg"
                onError={(e) => {
                  console.error('Logo failed to load:', logoUrl);
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23ddd"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="12">Logo</text></svg>';
                }}
              />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto mb-8 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
              <div className="text-4xl font-bold text-white">
                {businessName.charAt(0)}
              </div>
            </div>
          )}
          
          {/* Business Name */}
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-3 drop-shadow-md">
            {businessName}
          </h1>
          
          {/* Tagline - Clean, no decorations */}
          <p className="text-xl sm:text-2xl text-white/90 font-light">
            {tagline}
          </p>
        </div>

        {/* Feature Cards - Professional & Clean */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          {/* Loyalty Desk Card */}
          <a 
            href="/staff" 
            className="group block transform hover:scale-[1.02] transition-all duration-200"
          >
            <div 
              className="rounded-2xl p-8 bg-white shadow-xl border-2 hover:shadow-2xl transition-shadow"
              style={{ borderColor: `${borderColor}40` }}
            >
              {/* Icon */}
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center mb-5 shadow-md"
                style={{ backgroundColor: accentColor }}
              >
                <Users className="w-8 h-8 text-white" />
              </div>
              
              {/* Content */}
              <h2 
                className="text-2xl font-bold mb-2"
                style={{ color: borderColor }}
              >
                Loyalty Desk
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Search customers and add stamps
              </p>
            </div>
          </a>

          {/* Client Management Card */}
          <a 
            href="/admin" 
            className="group block transform hover:scale-[1.02] transition-all duration-200"
          >
            <div className="rounded-2xl p-8 bg-white shadow-xl border-2 border-orange-200 hover:shadow-2xl transition-shadow">
              {/* Icon */}
              <div className="w-16 h-16 rounded-xl bg-orange-500 flex items-center justify-center mb-5 shadow-md">
                <Settings className="w-8 h-8 text-white" />
              </div>
              
              {/* Content */}
              <h2 className="text-2xl font-bold mb-2 text-orange-600">
                Client Management
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Manage clients, view analytics & more
              </p>
            </div>
          </a>
        </div>

        {/* Info Cards - Minimal */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* For Staff */}
          <div className="backdrop-blur-sm bg-white/20 border border-white/30 rounded-xl p-6 shadow-lg">
            <div className="flex items-start space-x-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: accentColor }}
              >
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">For Staff</h3>
                <p className="text-white/80 text-sm">
                  Quick customer check-in and stamp management
                </p>
              </div>
            </div>
          </div>

          {/* For Admins */}
          <div className="backdrop-blur-sm bg-white/20 border border-white/30 rounded-xl p-6 shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">For Admins</h3>
                <p className="text-white/80 text-sm">
                  Full system control, analytics and reporting
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
