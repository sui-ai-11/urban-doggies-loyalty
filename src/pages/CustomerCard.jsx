import React, { useState, useEffect } from 'react';
import { Gift, MessageCircle, Star, ChevronRight } from 'lucide-react';

function CustomerCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [activeView, setActiveView] = useState('stamp');

  // Support hash route (/#/card?token=X), direct path (/card?token=X), and bare query (?token=X)
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
          <div className="text-6xl mb-4">😢</div>
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
  const bgColor = business.backgroundColor || '#17BEBB';
  const cardBg = business.cardBackground || '#FFFFFF';

  const totalStamps = loyalty?.requiredVisits || business.stampsRequired || 10;
  const currentStamps = loyalty?.currentProgress || 0;
  const totalVisits = loyalty?.totalVisits || 0;

  // Nav buttons from business settings
  const navButtons = [
    { key: 'stamp', label: business.navButton1Text || 'Stamp Card', icon: Star },
    { key: 'rewards', label: business.navButton2Text || 'Rewards', icon: Gift },
    { key: 'contact', label: business.navButton3Text || 'Contact', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen py-6 px-4" style={{ backgroundColor: bgColor }}>
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-60 h-60 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: accentColor }} />
        <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: borderColor }} />
      </div>

      {/* Card Container */}
      <div className="relative z-10 max-w-md mx-auto rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
        style={{ backgroundColor: cardBg, border: `3px solid ${borderColor}20` }}>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            {business.logo ? (
              <img src={business.logo} alt={business.name} className="h-20 w-auto"
                onError={(e) => (e.target.style.display = 'none')} />
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

        {/* Navigation Tabs */}
        <div className="flex mx-6 mb-4 rounded-2xl overflow-hidden" style={{ backgroundColor: `${borderColor}10` }}>
          {navButtons.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveView(key)}
              className="flex-1 py-3 text-xs font-bold transition-all duration-200 flex flex-col items-center gap-1"
              style={{
                backgroundColor: activeView === key ? accentColor : 'transparent',
                color: activeView === key ? '#FFFFFF' : '#9CA3AF',
              }}>
              <Icon size={16} />
              {label}
            </button>
          ))}
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
                <div className="max-w-xs mx-auto bg-white rounded-2xl p-4 border-2 shadow-sm" style={{ borderColor: `${accentColor}30` }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${client.token}`}
                    alt="QR Code"
                    className="w-full rounded-xl"
                  />
                  <p className="text-center mt-3 font-mono font-bold text-lg tracking-widest" style={{ color: accentColor }}>
                    {client.token}
                  </p>
                  <p className="text-center text-gray-400 text-xs mt-1">Show this to staff to earn stamps</p>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-600">Progress</span>
                  <span className="text-sm font-bold" style={{ color: accentColor }}>
                    {currentStamps}/{totalStamps} stamps
                  </span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: `${accentColor}20` }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(currentStamps / totalStamps) * 100}%`,
                      backgroundColor: accentColor,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {loyalty?.nextRewardIn > 0
                    ? `${loyalty.nextRewardIn} more visit${loyalty.nextRewardIn > 1 ? 's' : ''} until your next reward!`
                    : '🎉 You earned a reward!'}
                </p>
              </div>

              {/* Stamp Grid */}
              <div className="grid grid-cols-5 gap-2 mb-6">
                {Array.from({ length: totalStamps }).map((_, i) => {
                  const isFilled = i < currentStamps;
                  const isMilestone1 = i === Math.floor(totalStamps / 2) - 1;
                  const isMilestone2 = i === totalStamps - 1;
                  return (
                    <div key={i}
                      className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        isFilled ? 'shadow-md' : 'border-2 border-dashed'
                      }`}
                      style={{
                        backgroundColor: isFilled ? accentColor : 'transparent',
                        borderColor: isFilled ? 'transparent' : `${accentColor}40`,
                        color: isFilled ? '#FFFFFF' : `${accentColor}60`,
                      }}>
                      {isFilled ? (
                        (isMilestone1 || isMilestone2) ? '⭐' : '✓'
                      ) : (
                        isMilestone1 ? '🎁' : isMilestone2 ? '🏆' : (i + 1)
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-white rounded-xl p-3 border" style={{ borderColor: `${accentColor}20` }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${accentColor}15` }}>🎁</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: borderColor }}>{business.milestone1Label || '10% OFF'}</p>
                    <p className="text-xs text-gray-400">{business.milestone1Description || `${Math.floor(totalStamps / 2)} visit reward`}</p>
                  </div>
                  {currentStamps >= Math.floor(totalStamps / 2) && (
                    <span className="text-xs font-bold px-2 py-1 rounded-full text-white shrink-0" style={{ backgroundColor: accentColor }}>Earned!</span>
                  )}
                </div>
                <div className="flex items-center gap-3 bg-white rounded-xl p-3 border" style={{ borderColor: `${accentColor}20` }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${accentColor}15` }}>🏆</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: borderColor }}>{business.milestone2Label || 'FREE SERVICE'}</p>
                    <p className="text-xs text-gray-400">{business.milestone2Description || `${totalStamps} visit reward`}</p>
                  </div>
                  {currentStamps >= totalStamps && (
                    <span className="text-xs font-bold px-2 py-1 rounded-full text-white shrink-0" style={{ backgroundColor: accentColor }}>Earned!</span>
                  )}
                </div>
              </div>

              {/* Total visits */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400">Total lifetime visits: <span className="font-bold" style={{ color: accentColor }}>{totalVisits}</span></p>
              </div>
            </div>
          )}

          {/* ═══ REWARDS VIEW ═══ */}
          {activeView === 'rewards' && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Your Rewards</h2>
                <p className="text-gray-500 text-sm font-light">Active coupons and earned rewards</p>
              </div>

              {coupons && coupons.length > 0 ? (
                <div className="space-y-3">
                  {coupons.map((coupon, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border-2 shadow-sm transition-all duration-200 hover:shadow-md"
                      style={{ borderColor: `${accentColor}30` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                          style={{ backgroundColor: accentColor }}>
                          <Gift size={24} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800">{coupon.text || 'Reward'}</p>
                          <p className="text-xs text-gray-400">
                            {coupon.type && <span className="capitalize">{coupon.type}</span>}
                            {coupon.expiryDate && <span> · Expires {coupon.expiryDate}</span>}
                          </p>
                        </div>
                        <ChevronRight size={20} className="text-gray-300 shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🎁</div>
                  <p className="text-gray-500 font-semibold mb-1">No rewards yet</p>
                  <p className="text-gray-400 text-sm">Keep collecting stamps to earn rewards!</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ CONTACT VIEW ═══ */}
          {activeView === 'contact' && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Get in Touch</h2>
                <p className="text-gray-500 text-sm font-light">{business.supportText || "We'd love to hear from you"}</p>
              </div>

              <div className="space-y-3">
                {business.chatLink && (
                  <a href={business.chatLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-white rounded-2xl p-4 border-2 transition-all duration-200 hover:shadow-md"
                    style={{ borderColor: `${accentColor}30` }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                      style={{ backgroundColor: '#25D366' }}>
                      <MessageCircle size={24} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800">{business.chatLabel || 'Chat with us'}</p>
                      <p className="text-xs text-gray-400">Send us a message</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 shrink-0" />
                  </a>
                )}

                {business.termsURL && (
                  <a href={business.termsURL} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-white rounded-2xl p-4 border-2 transition-all duration-200 hover:shadow-md"
                    style={{ borderColor: `${accentColor}30` }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm bg-gray-100 shrink-0">
                      <span className="text-lg">📋</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800">Terms & Conditions</p>
                      <p className="text-xs text-gray-400">View our policies</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 shrink-0" />
                  </a>
                )}

                {!business.chatLink && !business.termsURL && (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">💬</div>
                    <p className="text-gray-500 font-semibold mb-1">Contact info coming soon</p>
                    <p className="text-gray-400 text-sm">Check back later for ways to reach us</p>
                  </div>
                )}
              </div>

              {/* Ad Image */}
              {business.adImageUrl && (
                <div className="mt-6">
                  <img src={business.adImageUrl} alt="Promotion"
                    className="w-full rounded-2xl shadow-sm"
                    onError={(e) => (e.target.style.display = 'none')} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerCard;
