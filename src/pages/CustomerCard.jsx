import React, { useState, useEffect } from 'react';
import { Gift, MessageCircle } from 'lucide-react';

function CustomerCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [activeView, setActiveView] = useState('stamp');

  // Support both hash and query string token
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const queryParams = new URLSearchParams(window.location.search);
  const token = hashParams.get('token') || queryParams.get('token');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    async function loadClientData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/client-dashboard?token=${token}`);
        if (!response.ok) throw new Error('Client not found');
        setClientData(await response.json());
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }
    loadClientData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#17BEBB' }}>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-white mx-auto mb-4" />
          <p className="text-lg font-semibold">Loading…</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#17BEBB' }}>
        <div className="glass-card rounded-3xl p-8 max-w-md shadow-2xl">
          <h1 className="text-3xl font-black text-gray-800 mb-3 text-center tracking-tight">Digital Loyalty</h1>
          <p className="text-gray-500 mb-8 text-center font-light">Add ?token=YOUR_TOKEN to view your card</p>
          <div className="space-y-3">
            <a href="/#/admin" className="block bg-gray-800 text-white px-6 py-4 rounded-2xl font-semibold text-center hover:bg-gray-700 transition">Admin Panel</a>
            <a href="/#/staff" className="block text-white px-6 py-4 rounded-2xl font-semibold text-center transition" style={{ backgroundColor: '#17BEBB' }}>Staff Check-In</a>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#17BEBB' }}>
        <div className="glass-card rounded-3xl p-8 max-w-md text-center shadow-2xl">
          <div className="text-6xl mb-4">🐕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Card Not Found</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!clientData) return null;

  const { client, business, loyalty, coupons } = clientData;
  const accentColor = business.accentColor || '#17BEBB';
  const borderColor = business.borderColor || '#1F3A93';

  return (
    <div className="min-h-screen py-6 px-4" style={{ backgroundColor: business.backgroundColor || '#17BEBB' }}>
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-60 h-60 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: accentColor }} />
        <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: borderColor }} />
      </div>

      {/* Card Container */}
      <div className="relative z-10 max-w-md mx-auto rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
        style={{ backgroundColor: business.cardBackgroundColor || '#FFFFFF', border: `3px solid ${business.borderColor || '#1F3A93'}20` }}>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            {business.logo ? (
              <img src={business.logo} alt={business.name} className="h-20 w-auto" />
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black tracking-tight" style={{ color: borderColor }}>
                  {business.name}
                </span>
              </div>
            )}
          </div>
          {business.tagline && <p className="text-center text-gray-500 text-sm font-light">{business.tagline}</p>}
        </div>

        <div className="px-6 pb-6">
          {/* ═══ STAMP VIEW ═══ */}
          {activeView === 'stamp' && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Hey, {client.name.split(' ')[0]}!</h2>
                <p className="text-gray-500 text-sm font-light">{business.progressText || 'See your progress and rewards.'}</p>
              </div>

              {/* QR Code */}
              <div className="mb-6 px-4">
                <div className="max-w-xs mx-auto bg-white rounded-2xl p-4 border-2 shadow-sm" style={{ borderColor:
