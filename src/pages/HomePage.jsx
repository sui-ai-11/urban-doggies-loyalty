import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { Users, Settings } from 'lucide-react';

function HomePage() {
  const [businessLogo, setBusinessLogo] = useState('');
  const [businessName, setBusinessName] = useState('Urban Doggies');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch business info to get logo
    async function fetchBusinessInfo() {
      try {
        // Try to get any client to extract business info
        const response = await fetch('/api/get-all-clients');
        if (response.ok) {
          const data = await response.json();
          if (data.clients && data.clients.length > 0) {
            // Get business info from first client
            const firstClient = data.clients[0];
            const clientResponse = await fetch(`/api/client-dashboard?token=${firstClient.token}`);
            if (clientResponse.ok) {
              const clientData = await clientResponse.json();
              if (clientData.business) {
                setBusinessLogo(clientData.business.logo);
                setBusinessName(clientData.business.name);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching business info:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBusinessInfo();
  }, []);

  return (
    <div className="min-h-screen bg-[#17BEBB]">
      <Navigation currentPage="home" />
      
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="mb-6">
            {!loading && businessLogo ? (
              <img 
                src={businessLogo} 
                alt={businessName}
                className="h-24 w-auto mx-auto mb-4"
              />
            ) : (
              <svg width="120" height="80" viewBox="0 0 120 80" className="mx-auto mb-4">
                <path d="M20 60 Q20 20, 40 20 Q60 20, 60 40" stroke="#1F3A93" strokeWidth="8" fill="none" strokeLinecap="round"/>
                <path d="M40 60 Q40 30, 60 30 Q80 30, 80 50" stroke="#FF9F1C" strokeWidth="8" fill="none" strokeLinecap="round"/>
                <path d="M60 60 Q60 40, 80 40 Q100 40, 100 60" stroke="#1F3A93" strokeWidth="8" fill="none" strokeLinecap="round"/>
              </svg>
            )}
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">{businessName}</h1>
          <p className="text-2xl text-white text-opacity-90 font-semibold">Digital Loyalty System</p>
        </div>

        <div className="space-y-4">
          {/* Client Management Button */}
          <a
            href="/staff"
            className="block bg-[#F5F1E8] border-8 border-[#1F3A93] rounded-3xl p-8 hover:scale-105 transition-transform shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#1F3A93] rounded-full p-4">
                <Users size={40} className="text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-3xl font-bold text-[#1F3A93]">Client Management</h2>
                <p className="text-gray-600 mt-1">Search customers and add stamps</p>
              </div>
            </div>
          </a>

          {/* Admin Panel Button */}
          <a
            href="/admin"
            className="block bg-[#F5F1E8] border-8 border-[#FF9F1C] rounded-3xl p-8 hover:scale-105 transition-transform shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#FF9F1C] rounded-full p-4">
                <Settings size={40} className="text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-3xl font-bold text-[#FF9F1C]">Admin Panel</h2>
                <p className="text-gray-600 mt-1">Manage clients, view analytics & more</p>
              </div>
            </div>
          </a>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="bg-white bg-opacity-20 backdrop-blur rounded-2xl p-6 text-white">
            <h3 className="font-bold text-xl mb-2">📱 For Staff</h3>
            <p className="text-sm">Quick customer check-in and stamp management</p>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur rounded-2xl p-6 text-white">
            <h3 className="font-bold text-xl mb-2">⚙️ For Admins</h3>
            <p className="text-sm">Full system control, analytics and reporting</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
