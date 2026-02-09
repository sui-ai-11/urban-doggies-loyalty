import React, { useState, useEffect } from 'react';
import { Users, Settings, Home as HomeIcon, Sparkles } from 'lucide-react';

const HomePage = () => {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const response = await fetch('/api/get-business-info');
        const data = await response.json();
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <div className="text-white text-xl font-medium">Loading your loyalty system...</div>
        </div>
      </div>
    );
  }

  const accentColor = business?.accentColor || '#17BEBB';
  const backgroundColor = business?.backgroundColor || '#17BEBB';
  const borderColor = business?.borderColor || '#1F3A93';
  const businessName = business?.businessName || 'Urban Doggies';
  const tagline = business?.tagline || 'Digital Loyalty System';
  const logoUrl = business?.logo || null;

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-500"
      style={{
        background: `linear-gradient(135deg, ${backgroundColor} 0%, ${backgroundColor}dd 100%)`
      }}
    >
      {/* Navigation - Glassmorphism */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/10 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16 space-x-2 sm:space-x-4">
            <a href="/">
              <button className="group flex items-center space-x-2 px-4 sm:px-6 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">Home</span>
              </button>
            </a>
            <a href="/staff">
              <button className="group flex items-center space-x-2 px-4 sm:px-6 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Loyalty Desk</span>
              </button>
            </a>
            <a href="/admin">
              <button className="group flex items-center space-x-2 px-4 sm:px-6 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-500" />
                <span className="hidden sm:inline">Client Management</span>
              </button>
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Logo and Title Section */}
        <div className="text-center mb-12 animate-fade-in">
          {/* Logo */}
          {logoUrl ? (
            <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
              <img 
                src={logoUrl} 
                alt={businessName}
                className="h-24 sm:h-32 mx-auto object-contain drop-shadow-2xl"
                onError={(e) => {
                  console.error('Logo failed to load:', logoUrl);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-8 bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl transform hover:rotate-12 transition-transform duration-500">
              <svg className="w-20 h-20 sm:w-24 sm:h-24 text-white" viewBox="0 0 100 100">
                <circle cx="30" cy="30" r="20" fill="currentColor" opacity="0.8"/>
                <circle cx="70" cy="30" r="20" fill="currentColor" opacity="0.6"/>
                <circle cx="50" cy="60" r="25" fill="currentColor" opacity="0.9"/>
              </svg>
            </div>
          )}
          
          {/* Business Name */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-4 drop-shadow-lg tracking-tight">
            {businessName}
          </h1>
          
          {/* Tagline */}
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
            <p className="text-xl sm:text-2xl text-white/90 font-medium">
              {tagline}
            </p>
            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
          </div>
        </div>

        {/* Feature Cards - Premium Design */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          {/* Loyalty Desk Card */}
          <a 
            href="/staff" 
            className="group transform hover:scale-105 hover:-rotate-1 transition-all duration-300"
          >
            <div 
              className="relative rounded-3xl p-8 shadow-2xl backdrop-blur-sm bg-white/95 border-4 overflow-hidden"
              style={{ borderColor: borderColor }}
            >
              {/* Gradient Overlay */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-full blur-3xl"></div>
              
              {/* Icon */}
              <div 
                className="relative w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform group-hover:rotate-12 transition-transform duration-300"
                style={{ backgroundColor: accentColor }}
              >
                <Users className="w-10 h-10 text-white" />
              </div>
              
              {/* Content */}
              <h2 
                className="text-3xl font-bold mb-3 group-hover:translate-x-2 transition-transform"
                style={{ color: borderColor }}
              >
                Loyalty Desk
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Search customers and add stamps with our fast QR scanner
              </p>
              
              {/* Hover Arrow */}
              <div className="mt-4 flex items-center text-gray-400 group-hover:text-gray-600 transition-colors">
                <span className="text-sm font-medium">Get started</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>

          {/* Client Management Card */}
          <a 
            href="/admin" 
            className="group transform hover:scale-105 hover:rotate-1 transition-all duration-300"
          >
            <div 
              className="relative rounded-3xl p-8 shadow-2xl backdrop-blur-sm bg-white/95 border-4 overflow-hidden"
              style={{ borderColor: '#FF9F1C' }}
            >
              {/* Gradient Overlay */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-transparent rounded-full blur-3xl"></div>
              
              {/* Icon */}
              <div 
                className="relative w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform group-hover:rotate-12 transition-transform duration-300"
                style={{ backgroundColor: '#FF9F1C' }}
              >
                <Settings className="w-10 h-10 text-white" />
              </div>
              
              {/* Content */}
              <h2 className="text-3xl font-bold mb-3 text-orange-600 group-hover:translate-x-2 transition-transform">
                Client Management
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Manage clients, view analytics & customize your branding
              </p>
              
              {/* Hover Arrow */}
              <div className="mt-4 flex items-center text-gray-400 group-hover:text-gray-600 transition-colors">
                <span className="text-sm font-medium">Open dashboard</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>
        </div>

        {/* Bottom Info Cards - Modern Glassmorphism */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* For Staff */}
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-xl hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-lg"
                style={{ backgroundColor: accentColor }}
              >
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">For Staff</h3>
            </div>
            <p className="text-white/90 leading-relaxed">
              Quick customer check-in and stamp management with QR code scanning
            </p>
          </div>

          {/* For Admins */}
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-xl hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center mr-4 shadow-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">For Admins</h3>
            </div>
            <p className="text-white/90 leading-relaxed">
              Full system control with analytics, reporting, and branding customization
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};

export default HomePage;
