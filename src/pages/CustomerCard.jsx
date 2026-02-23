import React, { useState, useEffect } from 'react';
import { Gift, MessageCircle, Star, ChevronRight, Phone } from 'lucide-react';

// Helper: determine if a hex color is dark
function isDark(hex) {
  if (!hex) return false;
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

function CustomerCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [activeView, setActiveView] = useState('stamp');

  // Support hash route, direct path, and bare query
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

  // Auto-poll when pending — check every 5 seconds
  const pendingRef = React.useRef(false);
  useEffect(() => {
    if (!clientData || clientData.status !== 'pending' || !token) {
      pendingRef.current = false;
      return;
    }
    if (pendingRef.current) return;
    pendingRef.current = true;
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/client-dashboard?token=${token}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status !== 'pending') {
            pendingRef.current = false;
            clearInterval(interval);
            setClientData(data);
          }
        }
      } catch (e) {}
    }, 5000);
    return () => { clearInterval(interval); pendingRef.current = false; };
  }, [clientData && clientData.status, token]);

  // Auto-refresh data every 10 seconds for live coupon/stamp updates
  useEffect(() => {
    if (!clientData || !token || clientData.status === 'pending') return;
    const refreshInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/client-dashboard?token=${token}`);
        if (response.ok) {
          const data = await response.json();
          setClientData(data);
        }
      } catch (e) {}
    }, 10000);
    return () => clearInterval(refreshInterval);
  }, [token, clientData && clientData.status]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-white mx-auto mb-4" />
          <p className="text-lg font-semibold">Loading…</p>
        </div>
      </div>
    );
  }

  // Pending approval screen
  if (clientData && clientData.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#0d0221' }}>
        <div className="glass-card rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-2xl font-black mb-2 text-white">Pending Approval</h1>
          <p className="text-gray-400 mb-4">Hi {clientData.client.name}! Your registration is being reviewed.</p>
          <p className="text-gray-500 text-sm">Please show this to the staff at the counter.</p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <p className="text-gray-500 text-xs">Checking automatically…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-900">
        <div className="glass-card rounded-3xl p-8 max-w-md shadow-2xl">
          <h1 className="text-3xl font-black text-gray-800 mb-3 text-center tracking-tight">Digital Loyalty</h1>
          <p className="text-gray-500 mb-8 text-center font-light">Add ?token=YOUR_TOKEN to view your card</p>
          <div className="space-y-3">
            <a href="/#/admin" className="block bg-gray-800 text-white px-6 py-4 rounded-2xl font-semibold text-center hover:bg-gray-700 transition">Admin Panel</a>
            <a href="/#/staff" className="block text-white px-6 py-4 rounded-2xl font-semibold text-center transition bg-gray-700">Staff Check-In</a>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-900">
        <div className="glass-card rounded-3xl p-8 max-w-md text-center shadow-2xl">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Card Not Found</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!clientData) return null;

  const client = clientData.client || {};
  const business = clientData.business || {};
  const loyalty = clientData.loyalty || {};
  const coupons = clientData.coupons || [];
  const accentColor = business.accentColor || '#4a4a5a';
  const btnOnAccent = isDark(accentColor) ? '#ffffff' : '#1a1a2e';
  const borderColor = business.borderColor || '#1F3A93';
  const bgColor = business.backgroundColor || '#4a4a5a';
  const cardBg = business.cardBackground || '#FFFFFF';

  // Dynamic text colors based on card background brightness
  const cardIsDark = isDark(cardBg);
  const headingColor = cardIsDark ? '#FFFFFF' : (borderColor || '#1a1a2e');
  const textColor = cardIsDark ? '#d1d5db' : '#6b7280';
  const subtextColor = cardIsDark ? '#9ca3af' : '#9ca3af';

  const totalStamps = loyalty?.requiredVisits || business.stampsRequired || 10;
  const currentStamps = loyalty?.currentProgress || 0;
  const cardCycle = Math.floor((loyalty?.totalVisits || 0) / totalStamps) + 1;
  const totalVisits = loyalty?.totalVisits || 0;

  // Nav buttons from business settings
  const navButtons = [
    { key: 'stamp', label: business.navButton1Text || 'Date Stamp', icon: Star },
    { key: 'rewards', label: business.navButton2Text || 'Coupons', icon: Gift },
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
      <div className="relative z-10 max-w-md mx-auto rounded-3xl overflow-hidden animate-slide-up"
        style={{
          backgroundColor: cardBg,
          border: `2px solid ${accentColor}35`,
          boxShadow: `0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px ${accentColor}15, inset 0 1px 0 ${accentColor}10`,
        }}>

        {/* Accent Header Band */}
        <div style={{
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
          padding: '24px 24px 20px',
        }}>
          <div className="flex items-center justify-center gap-3 mb-2">
            {business.logo ? (
              <img src={business.logo} alt={business.name} className="h-20 w-auto"
                style={{ filter: 'brightness(0) invert(1)' }}
                onError={(e) => { e.target.style.filter = 'none'; }} />
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black tracking-tight" style={{ color: btnOnAccent }}>
                  {business.name}
                </span>
              </div>
            )}
          </div>
          {business.tagline && <p className="text-center text-sm font-light" style={{ color: btnOnAccent, opacity: 0.85 }}>{business.tagline}</p>}
        </div>

        {/* Navigation Tabs */}
        <div className="flex mx-6 -mt-5 rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: cardBg, border: `1px solid ${accentColor}20` }}>
          {navButtons.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveView(key)}
              className="flex-1 py-3 text-xs font-bold transition-all duration-200 flex flex-col items-center gap-1"
              style={{
                backgroundColor: activeView === key ? accentColor : 'transparent',
                color: activeView === key ? btnOnAccent : subtextColor,
              }}>
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="px-6 pb-6 pt-4">
          {/* ═══ STAMP VIEW ═══ */}
          {activeView === 'stamp' && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-1" style={{ color: headingColor }}>
                  Hey, {(client.name || 'there').split(' ')[0]}!
                </h2>
                <p className="text-sm font-light" style={{ color: textColor }}>
                  {business.progressText || 'Track your visits and earn rewards!'}
                </p>
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
                  <span className="text-sm font-semibold" style={{ color: textColor }}>Progress{cardCycle > 1 ? ` · Card ${cardCycle}` : ''}</span>
                  <span className="text-sm font-bold" style={{ color: accentColor }}>
                    {currentStamps}/{totalStamps} stamps
                  </span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: `${accentColor}15` }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(currentStamps / totalStamps) * 100}%`,
                      background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
                      boxShadow: currentStamps > 0 ? `0 0 8px ${accentColor}50` : 'none',
                    }}
                  />
                </div>
                <p className="text-xs mt-2 text-center" style={{ color: subtextColor }}>
                  {loyalty?.nextRewardIn > 0
                    ? `${loyalty.nextRewardIn} more visit${loyalty.nextRewardIn > 1 ? 's' : ''} until your next reward!`
                    : '🎉 Reward earned! Show this to staff to claim.'}
                </p>
              </div>

              {/* Stamp Grid */}
              {(() => {
                // Parse milestones — support tiered format
                let milestones = [];
                try {
                  let parsed = JSON.parse(business.milestonesJson || '[]');
                  if (Array.isArray(parsed)) {
                    // Old format: array
                    milestones = parsed;
                  } else if (typeof parsed === 'object') {
                    // Tiered format
                    let tierKeys = Object.keys(parsed).filter(k => !k.includes('_')).sort((a,b) => parseInt(a)-parseInt(b));
                    
                    // Exact match
                    if (parsed[String(cardCycle)]) {
                      milestones = parsed[String(cardCycle)];
                    } else {
                      // Find highest tier with _default
                      let found = false;
                      for (let i = tierKeys.length - 1; i >= 0; i--) {
                        if (parsed[tierKeys[i] + '_default'] && parseInt(tierKeys[i]) <= cardCycle) {
                          milestones = parsed[tierKeys[i]];
                          found = true;
                          break;
                        }
                      }
                      if (!found && tierKeys.length > 0) {
                        milestones = parsed[tierKeys[tierKeys.length - 1]] || [];
                      }
                    }
                  }
                } catch(e) {}
                if (milestones.length === 0) {
                  // Fallback to legacy milestone fields
                  milestones = [
                    { position: business.milestone1Position || Math.floor(totalStamps / 2), icon: business.milestone1Icon || '🎁', label: business.milestone1Label || '10% OFF', description: business.milestone1Description || '' },
                    { position: business.milestone2Position || totalStamps, icon: business.milestone2Icon || '🏆', label: business.milestone2Label || 'FREE SERVICE', description: business.milestone2Description || '' },
                  ];
                }
                const milestoneMap = {};
                milestones.forEach(m => { milestoneMap[m.position] = m; });
                const stampIcon = business.stampFilledIcon || '✓';

                return (
                  <>
                    <div className="rounded-2xl p-4 mb-6" style={{ backgroundColor: `${accentColor}08`, border: `1px dashed ${accentColor}25` }}>
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: totalStamps }).map((_, i) => {
                        const pos = i + 1;
                        const isFilled = i < currentStamps;
                        const ms = milestoneMap[pos];
                        return (
                          <div key={i}
                            className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                              isFilled ? 'shadow-md' : 'border-2 border-dashed'
                            }`}
                            style={{
                              backgroundColor: isFilled ? accentColor : 'transparent',
                              borderColor: isFilled ? 'transparent' : `${accentColor}40`,
                              color: isFilled ? '#FFFFFF' : subtextColor,
                            }}>
                            {ms ? ms.icon : (isFilled ? stampIcon : pos)}
                          </div>
                        );
                      })}
                    </div>
                    </div>

                    {/* Milestone Info Cards */}
                    <div className="space-y-2">
                      {milestones.filter(m => m.label).map((m, i) => {
                        const reached = currentStamps >= m.position;
                        // Check if this milestone has been claimed for THIS cycle
                        let milestoneClaimed = false;
                        if (coupons) {
                          // First check cycle-specific tag (exclude VOIDED)
                          for (let ci = 0; ci < coupons.length; ci++) {
                            if (coupons[ci].redeemed === 'VOIDED') continue;
                            const cn = coupons[ci].notes || '';
                            if (cn.indexOf('milestone_' + m.position + '_cycle_' + cardCycle) > -1 && coupons[ci].redeemed === 'TRUE') {
                              milestoneClaimed = true;
                              break;
                            }
                          }
                          // Legacy fallback for cycle 1
                          if (!milestoneClaimed && cardCycle === 1) {
                            for (let ci2 = 0; ci2 < coupons.length; ci2++) {
                              if (coupons[ci2].redeemed === 'VOIDED') continue;
                              const cn2 = coupons[ci2].notes || '';
                              if ((cn2.indexOf('Milestone: ' + m.label) > -1 || cn2.indexOf('milestone_' + m.position) > -1) && cn2.indexOf('_cycle_') === -1 && coupons[ci2].redeemed === 'TRUE') {
                                milestoneClaimed = true;
                                break;
                              }
                            }
                          }
                        }
                        return (
                        <div key={i} className="flex items-center gap-3 rounded-xl p-3 border"
                          style={{
                            backgroundColor: cardIsDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                            borderColor: milestoneClaimed ? '#d1d5db' : `${accentColor}20`,
                            opacity: milestoneClaimed ? 0.6 : 1,
                          }}>
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                            style={{ backgroundColor: milestoneClaimed ? '#f3f4f6' : `${accentColor}15` }}>{m.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm" style={{ color: milestoneClaimed ? '#9ca3af' : headingColor }}>{m.label}</p>
                            <p className="text-xs" style={{ color: subtextColor }}>{m.description || `Visit ${m.position} reward`}</p>
                          </div>
                          {milestoneClaimed ? (
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500 shrink-0">✓ Claimed</span>
                          ) : reached ? (
                            <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: accentColor + '20', color: accentColor }}>Show to staff</span>
                          ) : null}
                        </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}

              {/* Total visits */}
              <div className="mt-4 text-center">
                <p className="text-xs" style={{ color: subtextColor }}>Total lifetime visits: <span className="font-bold" style={{ color: accentColor }}>{totalVisits}</span></p>
              </div>
            </div>
          )}

          {/* ═══ REWARDS VIEW ═══ */}
          {activeView === 'rewards' && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-1" style={{ color: headingColor }}>Your Coupons</h2>
                <p className="text-sm font-light" style={{ color: textColor }}>Active coupons and earned rewards</p>
              </div>

              {coupons && coupons.length > 0 ? (
                <div className="space-y-3">
                  {coupons.filter(c => c.redeemed !== 'VOIDED').slice().sort((a, b) => {
                    var aActive = a.redeemed !== 'TRUE' && !(a.expiryDate && new Date(a.expiryDate) < new Date()) ? 0 : 1;
                    var bActive = b.redeemed !== 'TRUE' && !(b.expiryDate && new Date(b.expiryDate) < new Date()) ? 0 : 1;
                    return aActive - bActive;
                  }).map((coupon, i) => {
                    var isClaimed = coupon.redeemed === 'TRUE';
                    var isExpired = !isClaimed && coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
                    return (
                    <div key={i} className="rounded-2xl p-4 border-2 shadow-sm"
                      style={{
                        backgroundColor: cardIsDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                        borderColor: isClaimed ? '#d1d5db' : `${accentColor}30`,
                        opacity: isClaimed ? 0.6 : 1,
                      }}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                          style={{ backgroundColor: isClaimed ? '#9ca3af' : accentColor }}>
                          <Gift size={24} style={{ color: isClaimed ? '#ffffff' : btnOnAccent }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold" style={{ color: isClaimed ? '#9ca3af' : headingColor }}>{coupon.text || 'Reward'}</p>
                          <p className="text-xs" style={{ color: subtextColor }}>
                            {coupon.type && <span className="capitalize">{coupon.type}</span>}
                            {coupon.expiryDate && <span> · Expires {coupon.expiryDate}</span>}
                          </p>
                          {!isClaimed && coupon.notes && <p className="text-xs mt-1" style={{ color: accentColor }}>{coupon.notes}</p>}
                        </div>
                        {isClaimed ? (
                          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 shrink-0">✓ Claimed</span>
                        ) : isExpired ? (
                          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-50 text-red-500 shrink-0">Expired</span>
                        ) : (
                          <span className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor, color: btnOnAccent }}>Active</span>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🎁</div>
                  <p className="font-semibold mb-1" style={{ color: headingColor }}>No coupons yet</p>
                  <p className="text-sm" style={{ color: subtextColor }}>Keep collecting stamps to earn coupons!</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ CONTACT VIEW ═══ */}
          {activeView === 'contact' && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-1" style={{ color: headingColor }}>{business.chatLabel || 'Get in Touch'}</h2>
                <p className="text-sm font-light" style={{ color: textColor }}>
                  {business.supportText || "We'd love to hear from you"}
                </p>
              </div>

              <div className="space-y-3">
                {/* Chat Button */}
                {business.chatLink && (
                <a href={business.chatLink}
                  className="flex items-center gap-3 rounded-2xl p-4 border-2 transition-all duration-200 hover:shadow-md"
                  style={{ backgroundColor: cardIsDark ? 'rgba(255,255,255,0.05)' : '#ffffff', borderColor: `${accentColor}30` }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                    style={{ backgroundColor: '#7360F2' }}>
                    <MessageCircle size={24} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold" style={{ color: headingColor }}>{business.navButton1Contact || 'Message Us'}</p>
                    <p className="text-xs" style={{ color: subtextColor }}>Tap to chat</p>
                  </div>
                  <ChevronRight size={20} style={{ color: subtextColor }} className="shrink-0" />
                </a>
                )}

                {/* Call Button */}
                {business.termsURL && (
                <a href={'tel:' + business.termsURL.replace(/\s/g, '')}
                  className="flex items-center gap-3 rounded-2xl p-4 border-2 transition-all duration-200 hover:shadow-md"
                  style={{ backgroundColor: cardIsDark ? 'rgba(255,255,255,0.05)' : '#ffffff', borderColor: `${accentColor}30` }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                    style={{ backgroundColor: accentColor }}>
                    <Phone size={24} style={{ color: btnOnAccent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold" style={{ color: headingColor }}>{business.callLabel || 'Call Us'}</p>
                    <p className="text-xs" style={{ color: subtextColor }}>{business.termsURL}</p>
                  </div>
                  <ChevronRight size={20} style={{ color: subtextColor }} className="shrink-0" />
                </a>
                )}

                {/* Feedback Button */}
                {business.contactEmail && (
                <a href={'mailto:' + business.contactEmail + '?subject=Feedback from ' + (client.name || 'Customer')}
                  className="flex items-center gap-3 rounded-2xl p-4 border-2 transition-all duration-200 hover:shadow-md"
                  style={{ backgroundColor: cardIsDark ? 'rgba(255,255,255,0.05)' : '#ffffff', borderColor: `${accentColor}30` }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                    style={{ backgroundColor: '#10b981' }}>
                    <span style={{ fontSize: '20px' }}>📝</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold" style={{ color: headingColor }}>{business.feedbackLabel || 'Send Feedback'}</p>
                    <p className="text-xs" style={{ color: subtextColor }}>{business.contactEmail}</p>
                  </div>
                  <ChevronRight size={20} style={{ color: subtextColor }} className="shrink-0" />
                </a>
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
