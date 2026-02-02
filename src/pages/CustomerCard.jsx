import React, { useState, useEffect } from 'react';
import { Gift, MessageCircle } from 'lucide-react';

function CustomerCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [activeView, setActiveView] = useState('stamp'); // stamp, rewards, message
  
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    async function loadClientData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/client-dashboard?token=${token}`);
        
        if (!response.ok) {
          throw new Error('Client not found');
        }
        
        const data = await response.json();
        setClientData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadClientData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#17BEBB] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#17BEBB] flex items-center justify-center p-6">
        <div className="bg-[#F5F1E8] rounded-3xl p-8 max-w-md border-8 border-[#1F3A93] shadow-2xl">
          <h1 className="text-4xl font-bold text-[#1F3A93] mb-4 text-center">
            Urban Doggies
          </h1>
          <p className="text-lg text-gray-700 mb-8 text-center">
            Digital Loyalty System
          </p>
          <div className="bg-white rounded-2xl p-6 mb-6">
            <p className="text-center text-gray-600 mb-4">
              Add ?token=YOUR_TOKEN to view your card
            </p>
            <p className="text-sm text-gray-500 text-center">
              Example: {window.location.origin}?token=ABC123
            </p>
          </div>
          <div className="space-y-3">
            <a 
              href="/admin" 
              className="block bg-[#1F3A93] text-white px-6 py-4 rounded-2xl font-bold text-center hover:bg-[#152959] transition"
            >
              Admin Panel
            </a>
            <a 
              href="/staff" 
              className="block bg-[#17BEBB] text-white px-6 py-4 rounded-2xl font-bold text-center hover:bg-[#15a8a5] transition"
            >
              Staff Check-In
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#17BEBB] flex items-center justify-center p-6">
        <div className="bg-[#F5F1E8] rounded-3xl p-8 max-w-md border-8 border-[#1F3A93] text-center">
          <div className="text-6xl mb-4">🐕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Card Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!clientData) return null;

  const { client, business, loyalty, coupons } = clientData;
  const primaryColor = business.accentColor || '#17BEBB';
  const secondaryColor = '#1F3A93';
  const accentColor = '#FF9F1C';

  return (
    <div className="min-h-screen" style={{ backgroundColor: business.backgroundColor }}>
      {/* Card Container */}
      <div 
        className="max-w-md mx-auto rounded-3xl border-8 shadow-2xl overflow-hidden"
        style={{ 
          backgroundColor: business.cardBackgroundColor,
          borderColor: business.borderColor
        }}
      >
        
        {/* Header with Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            {business.logo ? (
              <img src={business.logo} alt={business.name} className="h-24 w-auto" />
            ) : (
              <div className="flex flex-col items-center">
                <svg width="60" height="40" viewBox="0 0 60 40" className="mb-1">
                  <path d="M10 30 Q10 10, 20 10 Q30 10, 30 20" stroke={business.borderColor} strokeWidth="4" fill="none" strokeLinecap="round"/>
                  <path d="M20 30 Q20 15, 30 15 Q40 15, 40 25" stroke={business.accentColor} strokeWidth="4" fill="none" strokeLinecap="round"/>
                  <path d="M30 30 Q30 20, 40 20 Q50 20, 50 30" stroke={business.accentColor} strokeWidth="4" fill="none" strokeLinecap="round"/>
                </svg>
                <span className="text-3xl font-bold">
                  <span style={{ color: business.borderColor }}>{business.name.split(' ')[0]}</span>
                  <span style={{ color: business.accentColor }}>{business.name.split(' ')[1] || ''}</span>
                </span>
              </div>
            )}
          </div>
          {business.tagline && (
            <p className="text-center text-gray-600 text-sm">{business.tagline}</p>
          )}
        </div>

        {/* Main Content - Changes based on active view */}
        <div className="px-6 pb-6">
          
          {/* STAMP CARD VIEW */}
          {activeView === 'stamp' && (
            <div>
              {/* Greeting */}
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Hey, {client.name.split(' ')[0]}!
                </h2>
                <p className="text-gray-600">
                  {business.progressText || 'See your grooming progress and rewards.'}
                </p>
              </div>

              {/* QR Code Section - More Centered */}
              <div className="mb-6 px-6">
                <div className="max-w-xs mx-auto bg-white rounded-2xl p-4 border-2" style={{ borderColor: business.accentColor }}>
                  <div className="flex items-center gap-4">
                    {/* QR Code */}
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-white rounded-xl" style={{ 
                        boxShadow: `0 2px 8px ${business.accentColor}40`
                      }}>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${client.token}`}
                          alt="QR Code"
                          width="80"
                          height="80"
                          className="block"
                        />
                      </div>
                    </div>
                    
                    {/* Token Info */}
                    <div className="flex-1 text-left">
                      <p className="text-xs text-gray-500 mb-1 font-semibold">Your Token</p>
                      <p className="text-xl font-mono font-bold tracking-wider break-all" style={{ color: business.accentColor }}>
                        {client.token}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stamp Grid */}
              <div className="mb-10">
                <div className="grid grid-cols-5 gap-4">
                  {Array.from({ length: business.requiredVisits }).map((_, index) => {
                    const isStamped = index < loyalty.currentProgress;
                    const isMilestone = (index + 1) === 5 || (index + 1) === 10 || (index + 1) === business.requiredVisits;
                    const milestoneReward = (index + 1) === 5 ? (business.milestone1Label || '10% OFF') : 
                                          (index + 1) === 10 ? (business.milestone2Label || 'TREATS!') : 
                                          (index + 1) === business.requiredVisits ? (business.milestone2Label || 'REWARD!') : '';
                    
                    return (
                      <div key={index} className="relative pb-7">
                        <div
                          className="aspect-square rounded-full flex items-center justify-center text-xl font-bold border-4 transition-all duration-300"
                          style={{
                            backgroundColor: isStamped || isMilestone ? business.accentColor : 'transparent',
                            borderColor: isStamped || isMilestone ? business.accentColor : '#D1D5DB',
                            color: isStamped || isMilestone ? '#FFFFFF' : '#9CA3AF',
                            transform: isStamped ? 'scale(1)' : 'scale(0.95)'
                          }}
                        >
                          {isStamped ? (
                            index === 0 ? (
                              <div className="text-center text-xs leading-tight">
                                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).split(' ').map((part, i) => (
                                  <div key={i}>{part}</div>
                                ))}
                              </div>
                            ) : (
                              '✓'
                            )
                          ) : isMilestone && !isStamped ? (
                            (index + 1) === 5 ? '%' : 
                            (index + 1) === 10 ? '🎁' :
                            (index + 1) === business.requiredVisits ? '🎁' :
                            index + 1
                          ) : (
                            index + 1
                          )}
                        </div>
                        {isMilestone && !isStamped && milestoneReward && (
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-bold whitespace-nowrap">
                            <span style={{ color: business.accentColor }}>
                              ⭐ {milestoneReward}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ad Space / Dog Photo Section */}
              {business.adImageUrl && (
                <div 
                  className="relative mb-6 rounded-2xl overflow-hidden" 
                  style={{ 
                    minHeight: '280px',
                    backgroundColor: business.cardBackgroundColor
                  }}
                >
                  {/* Ad Image with Accent Color Shadow */}
                  <div className="relative z-10 flex items-center justify-center p-6">
                    <img 
                      src={`${business.adImageUrl}?t=${Date.now()}`} 
                      alt="Promotion" 
                      className="max-h-64 w-auto object-contain"
                      style={{
                        filter: `drop-shadow(0px 8px 16px ${business.accentColor}80)` // 80 = 50% opacity
                      }}
                      key={business.adImageUrl}
                    />
                  </div>
                </div>
              )}

              {/* Rewards Info */}
              <div className="bg-white rounded-2xl p-4 mb-6">
                <h3 className="font-bold text-gray-800 mb-3">Rewards:</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <span style={{ color: business.accentColor }}>⭐</span>
                    <span>{business.milestone1Description || '5th grooming: 10% off'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: business.accentColor }}>⭐</span>
                    <span>{business.milestone2Description || '10th grooming: Premium dog treats'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EXCLUSIVE REWARDS VIEW */}
          {activeView === 'rewards' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Exclusive Rewards</h2>
              
              {coupons && coupons.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {coupons.map((coupon, index) => (
                    <div 
                      key={index}
                      className="rounded-2xl p-6 text-white relative overflow-hidden"
                      style={{
                        backgroundColor: index % 2 === 0 ? business.accentColor : business.borderColor
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="bg-white bg-opacity-20 rounded-full p-2">
                          ⭐
                        </div>
                        <span className="bg-white bg-opacity-30 text-xs font-bold px-3 py-1 rounded-full">
                          EXCLUSIVE
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2">{coupon.text}</h3>
                      <p className="text-sm text-white text-opacity-90 mb-4">
                        Complete grooming package including bath, haircut, nail trim & ear cleaning
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          Valid until: {coupon.expiryDate || 'No expiry'}
                        </span>
                        <div className="bg-white bg-opacity-20 rounded-lg p-2">
                          🎁
                        </div>
                      </div>

                      {index % 2 === 0 && (
                        <div className="absolute bottom-4 right-4">
                          ❤️
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🎁</div>
                  <p>No active rewards yet.</p>
                  <p className="text-sm mt-2">Keep visiting to earn rewards!</p>
                </div>
              )}

              {/* Coupon History */}
              <div className="border-t border-gray-200 pt-4">
                <button className="w-full flex items-center justify-between text-gray-700 font-semibold">
                  <span>Coupon History</span>
                  <span className="text-gray-400">▼</span>
                </button>
              </div>
            </div>
          )}

          {/* MESSAGE US VIEW */}
          {activeView === 'message' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Us</h2>
              
              {/* Viber Button */}
              {business.chatLink && (
                <a
                  href={business.chatLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[#7360F2] hover:bg-[#6350e0] text-white rounded-2xl p-6 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white bg-opacity-20 rounded-full p-3">
                      <MessageCircle size={28} />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-bold text-lg">Message via Viber</div>
                      <div className="text-sm text-white text-opacity-90">
                        {business.supportText?.replace('Message us: ', '') || '+63 922 823 4849'}
                      </div>
                    </div>
                  </div>
                </a>
              )}

              {/* Call Button */}
              <a
                href={`tel:${business.supportText?.match(/\+?\d+/)?.[0] || '+639228531533'}`}
                className="block bg-[#17BEBB] hover:bg-[#15a8a5] text-white rounded-2xl p-6 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white bg-opacity-20 rounded-full p-3">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-lg">Call Us</div>
                    <div className="text-sm text-white text-opacity-90">
                      +63 922 853 1533
                    </div>
                  </div>
                </div>
              </a>
            </div>
          )}

        </div>

        {/* Bottom Navigation */}
        <div className="grid grid-cols-3 gap-3 p-4" style={{ backgroundColor: business.cardBackgroundColor }}>
          <button
            onClick={() => setActiveView('stamp')}
            className="py-4 rounded-2xl font-bold text-sm transition flex flex-col items-center justify-center gap-1"
            style={{
              backgroundColor: activeView === 'stamp' ? business.borderColor : '#FFFFFF',
              color: activeView === 'stamp' ? '#FFFFFF' : '#6B7280'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-1">
              <circle cx="12" cy="8" r="4"/>
              <path d="M12 12v10"/>
              <path d="M8 16h8"/>
            </svg>
            {business.navButton1Text || 'Stamp Card'}
          </button>
          
          <button
            onClick={() => setActiveView('rewards')}
            className="py-4 rounded-2xl font-bold text-sm transition flex flex-col items-center justify-center gap-1"
            style={{
              backgroundColor: activeView === 'rewards' ? business.accentColor : '#FFFFFF',
              color: activeView === 'rewards' ? '#FFFFFF' : '#6B7280'
            }}
          >
            <Gift size={24} className="mb-1" />
            {business.navButton2Text || 'Exclusive Rewards'}
          </button>
          
          <button
            onClick={() => setActiveView('message')}
            className="py-4 rounded-2xl font-bold text-sm transition flex flex-col items-center justify-center gap-1"
            style={{
              backgroundColor: activeView === 'message' ? business.accentColor : '#FFFFFF',
              color: activeView === 'message' ? '#FFFFFF' : '#6B7280'
            }}
          >
            <MessageCircle size={24} className="mb-1" />
            {business.navButton3Text || 'Message us'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomerCard;
