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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#17BEBB' }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const accentColor = business?.accentColor || '#17BEBB';
  const backgroundColor = business?.backgroundColor || '#17BEBB';
  const businessName = business?.businessName || 'Urban Doggies';
  const tagline = business?.tagline || 'Digital Loyalty System';
  const logoUrl = business?.logo || null;

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      {/* Navigation */}
      <nav className="bg-white bg-opacity-10 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16 space-x-4">
            <a href="/">
              <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all text-white font-medium">
                <HomeIcon className="w-5 h-5" />
                <span>Home</span>
              </button>
            </a>
            <a href="/staff">
              <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all text-white font-medium">
                <Users className="w-5 h-5" />
                <span>Loyalty Desk</span>
              </button>
            </a>
            <a href="/admin">
              <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all text-white font-medium">
                <Settings className="w-5 h-5" />
                <span>Client Management</span>
              </button>
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          {logoUrl && (
            <img 
              src={logoUrl} 
              alt={businessName}
              className="h-24 mx-auto mb-6 object-contain"
            />
          )}
          {!logoUrl && (
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-20 h-20 text-white" viewBox="0 0 100 100">
                <circle cx="30" cy="30" r="20" fill="currentColor" opacity="0.8"/>
                <circle cx="70" cy="30" r="20" fill="currentColor" opacity="0.6"/>
                <circle cx="50" cy="60" r="25" fill="currentColor" opacity="0.9"/>
              </svg>
            </div>
          )}
          <h1 className="text-5xl font-bold text-white mb-4">{businessName}</h1>
          <p className="text-2xl text-white text-opacity-90">{tagline}</p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Loyalty Desk Card */}
          <a href="/staff" className="transform hover:scale-105 transition-transform">
            <div 
              className="rounded-2xl p-8 shadow-2xl border-4"
              style={{ 
                backgroundColor: '#F5F1E8',
                borderColor: '#1F3A93'
              }}
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: accentColor }}
              >
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#1F3A93' }}>
                Loyalty Desk
              </h2>
              <p className="text-gray-700">
                Search customers and add stamps
              </p>
            </div>
          </a>

          {/* Client Management Card */}
          <a href="/admin" className="transform hover:scale-105 transition-transform">
            <div 
              className="rounded-2xl p-8 shadow-2xl border-4"
              style={{ 
                backgroundColor: '#F5F1E8',
                borderColor: '#FF9F1C'
              }}
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: '#FF9F1C' }}
              >
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#FF9F1C' }}>
                Client Management
              </h2>
              <p className="text-gray-700">
                Manage clients, view analytics & more
              </p>
            </div>
          </a>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* For Staff */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-white">
            <div className="flex items-center mb-3">
              <Users className="w-6 h-6 mr-2" style={{ color: accentColor }} />
              <h3 className="text-xl font-bold">For Staff</h3>
            </div>
            <p className="text-white text-opacity-90">
              Quick customer check-in and stamp management
            </p>
          </div>

          {/* For Admins */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-white">
            <div className="flex items-center mb-3">
              <Settings className="w-6 h-6 mr-2" style={{ color: '#FF9F1C' }} />
              <h3 className="text-xl font-bold">For Admins</h3>
            </div>
            <p className="text-white text-opacity-90">
              Full system control, analytics and reporting
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
