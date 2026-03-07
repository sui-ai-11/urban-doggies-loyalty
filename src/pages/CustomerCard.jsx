import React, { useState, useEffect } from 'react';
import { Gift, MessageCircle, Star, ChevronRight, Phone } from 'lucide-react';
import { renderIcon } from '../icon-registry';

const PawIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="8" cy="7" rx="2.2" ry="2.8" />
    <ellipse cx="16" cy="7" rx="2.2" ry="2.8" />
    <ellipse cx="4.5" cy="12.5" rx="2" ry="2.5" />
    <ellipse cx="19.5" cy="12.5" rx="2" ry="2.5" />
    <path d="M12 22c-3.5 0-6-2-6.5-4.5-.3-1.5.5-3 2-4 1.2-.8 2.8-1.5 4.5-1.5s3.3.7 4.5 1.5c1.5 1 2.3 2.5 2 4C18 20 15.5 22 12 22z" />
  </svg>
);

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
  const [walletUrl, setWalletUrl] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-4" />
          <p className="text-sm font-semibold text-gray-500">Loading your card…</p>
        </div>
      </div>
    );
  }

  // Pending approval screen
  if (clientData && clientData.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f9fafb' }}>
        <div className="glass-card rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-2xl font-black mb-2 text-white">Pending Approval</h1>
          <p className="text-gray-400 mb-4">Hi {clientData.client.name}! Your registration is being reviewed.</p>
          <p className="text-gray-500 text-sm">Your card is being reviewed. We'll notify you once approved!</p>
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
  const prepaid = clientData.prepaid || { balance: 0, transactions: [] };
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

        {/* Header with glassmorphism */}
        <div className="p-6 pb-4" style={{
          backgroundColor: cardIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${cardIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
        }}>
          <div className="flex items-center justify-center gap-3 mb-2">
            {business.logo ? (
              <img src={business.logo} alt={business.name} className="h-20 w-auto"
                referrerPolicy="no-referrer"
                onError={(e) => (e.target.style.display = 'none')} />
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black tracking-tight" style={{ color: headingColor }}>
                  {business.name}
                </span>
              </div>
            )}
          </div>
          {business.tagline && <p className="text-center text-sm font-light" style={{ color: textColor }}>{business.tagline}</p>}
        </div>

        {/* Navigation Tabs */}
        <div className="flex mx-6 my-4 rounded-2xl overflow-hidden" style={{ backgroundColor: cardIsDark ? 'rgba(255,255,255,0.1)' : `${accentColor}10`, border: `1px solid ${accentColor}15` }}>
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

        <div className="px-6 pb-6">
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
                  <p className="text-center text-gray-400 text-xs mt-1">Your stamp card — earn stamps with every visit</p>
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
                    : '🎉 Reward earned! Message us to claim.'}
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
                  // Fallback to legacy milestone fields — only if labels are actually configured
                  if (business.milestone1Label || business.milestone2Label) {
                    milestones = [
                      business.milestone1Label ? { position: business.milestone1Position || Math.floor(totalStamps / 2), icon: business.milestone1Icon || '🎁', label: business.milestone1Label, description: business.milestone1Description || '' } : null,
                      business.milestone2Label ? { position: business.milestone2Position || totalStamps, icon: business.milestone2Icon || '🏆', label: business.milestone2Label, description: business.milestone2Description || '' } : null,
                    ].filter(Boolean);
                  }
                }
                const milestoneMap = {};
                milestones.forEach(m => { milestoneMap[m.position] = m; });
                const stampIcon = business.stampFilledIcon || '✓';

                return (
                  <>
                    <div className="grid grid-cols-5 gap-2 mb-6">
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
                            {ms ? renderIcon(ms.icon, 18, isFilled ? '#FFFFFF' : subtextColor)
                              : (isFilled ? renderIcon(stampIcon, 18, '#FFFFFF') : pos)}
                          </div>
                        );
                      })}
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
                            style={{ backgroundColor: milestoneClaimed ? '#f3f4f6' : `${accentColor}15` }}>{renderIcon(m.icon, 20, milestoneClaimed ? '#9ca3af' : accentColor)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm" style={{ color: milestoneClaimed ? '#9ca3af' : headingColor }}>{m.label}</p>
                            <p className="text-xs" style={{ color: subtextColor }}>{m.description || `Visit ${m.position} reward`}</p>
                          </div>
                          {milestoneClaimed ? (
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500 shrink-0">✓ Claimed</span>
                          ) : reached ? (
                            <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: accentColor + '20', color: accentColor }}>Ready to claim</span>
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

              {/* Add to Google Wallet */}
              <div className="mt-5 text-center">
                {walletUrl ? (
                  <a href={walletUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:shadow-lg hover:scale-[1.02]"
                    style={{ backgroundColor: '#000', color: '#fff' }}>
                    <img src="https://pay.google.com/about/static_kix/images/logos/google-pay-logo.png" alt="G" className="h-5 w-auto" 
                      onError={function(e) { e.target.style.display = 'none'; }} />
                    Add to Google Wallet
                  </a>
                ) : (
                  <button onClick={function() {
                    setWalletLoading(true);
                    fetch('/api/wallet-pass?token=' + token)
                      .then(function(r) { return r.json(); })
                      .then(function(data) {
                        if (data.saveUrl) {
                          setWalletUrl(data.saveUrl);
                          window.open(data.saveUrl, '_blank');
                        }
                        setWalletLoading(false);
                      })
                      .catch(function() { setWalletLoading(false); });
                  }}
                    disabled={walletLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:shadow-lg hover:scale-[1.02] disabled:opacity-50"
                    style={{ backgroundColor: '#000', color: '#fff' }}>
                    {walletLoading ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Loading...</>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                        Add to Google Wallet
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ═══ PREPAID CREDITS ═══ */}
          {activeView === 'stamp' && business.features && business.features.prepaid && (prepaid.balance > 0 || prepaid.transactions.length > 0) && (
            <div className="mt-6 rounded-2xl p-5" style={{ backgroundColor: cardIsDark ? 'rgba(255,255,255,0.05)' : '#ffffff', border: '1px solid ' + accentColor + '25' }}>
              <h3 className="text-lg font-bold mb-3" style={{ color: headingColor }}>💳 Prepaid Balance</h3>
              <div className="text-center mb-4 py-3 rounded-xl" style={{ backgroundColor: accentColor + '15' }}>
                <p className="text-3xl font-black" style={{ color: accentColor }}>₱{prepaid.balance.toLocaleString()}</p>
                <p className="text-xs mt-1" style={{ color: subtextColor }}>Available credits</p>
              </div>
              {prepaid.transactions.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: subtextColor }}>Recent Transactions</p>
                  <div className="space-y-1.5" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {prepaid.transactions.slice(0, 20).map(function(tx, i) {
                      var isCredit = tx.type === 'credit';
                      return (
                        <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ backgroundColor: cardIsDark ? 'rgba(255,255,255,0.03)' : '#f9fafb' }}>
                          <span className="text-xs" style={{ color: subtextColor }}>{tx.date}</span>
                          <span className="text-sm font-bold" style={{ color: isCredit ? '#22c55e' : '#ef4444' }}>
                            {isCredit ? '+' : '-'}₱{tx.amount.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ SHARE & EARN ═══ */}
          {activeView === 'stamp' && business.features && business.features.referrals && (
            <div className="mt-6 rounded-2xl p-5" style={{ backgroundColor: accentColor + '10', border: '1px solid ' + accentColor + '25' }}>
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: headingColor }}><PawIcon size={20} color={accentColor} /> Refer a Friend</h3>
                <p className="text-sm mb-1" style={{ color: subtextColor }}>
                  Know someone who'd love our grooming services?
                </p>
                <p className="text-sm mb-3" style={{ color: subtextColor }}>
                  Send them your referral link — once they book and complete their first grooming, you'll receive <strong style={{ color: accentColor }}>50% OFF</strong> your next service! Your friend also gets <strong style={{ color: accentColor }}>10% OFF</strong> as a welcome treat. The best part? They can share and get the same rewards too!
                </p>

              {client.referralCount > 0 && (
                <p className="text-xs font-bold mb-3" style={{ color: accentColor }}>
                  🏆 You've referred {client.referralCount} friend{client.referralCount !== 1 ? 's' : ''}!
                </p>
              )}

              <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: cardIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }}>
                <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: subtextColor }}>Your Referral Code</p>
                <p className="text-xl font-black tracking-widest" style={{ color: headingColor }}>{client.token}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={function() {
                    var link = window.location.origin + '/#/portal?ref=' + client.token;
                    navigator.clipboard.writeText(link).then(function() {
                      alert('Referral link copied!');
                    });
                  }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm transition hover:shadow-lg"
                  style={{ backgroundColor: accentColor, color: btnOnAccent }}>
                  📋 Copy Link
                </button>
                <button
                  onClick={function() {
                    var link = window.location.origin + '/#/portal?ref=' + client.token;
                    var msg = '\ud83d\udc3e Hey! I\u2019ve been getting my fur babies groomed at ' + (business.businessName || 'our shop') + ' and they\u2019re amazing! Use my referral link to sign up \u2014 you\u2019ll get 10% OFF your first grooming. Once you book and complete your visit, I get 50% OFF too! ' + link;
                    if (navigator.share) {
                      navigator.share({ text: msg }).catch(function() {});
                    } else {
                      navigator.clipboard.writeText(msg).then(function() {
                        alert('Message copied! Paste it in Viber or any chat.');
                      });
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm transition hover:shadow-lg"
                  style={{ backgroundColor: cardIsDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)', color: headingColor }}>
                  💬 Share
                </button>
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
                  {coupons.filter(c => c.redeemed !== 'VOIDED' && (c.notes || '').indexOf('milestone_') === -1).slice().sort((a, b) => {
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
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: accentColor + '15' }}>
                    <Gift size={28} style={{ color: accentColor }} />
                  </div>
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
                <a href={business.chatLink} target="_blank" rel="noopener noreferrer"
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
                {(business.feedbackUrl || business.contactEmail) && (
                <a href={business.feedbackUrl
                    ? business.feedbackUrl + (business.feedbackUrl.indexOf('?') > -1 ? '&' : '?') + 'entry.token=' + encodeURIComponent(client.token || '')
                    : 'mailto:' + business.contactEmail + '?subject=Feedback from ' + (client.name || 'Customer')}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl p-4 border-2 transition-all duration-200 hover:shadow-md"
                  style={{ backgroundColor: cardIsDark ? 'rgba(255,255,255,0.05)' : '#ffffff', borderColor: `${accentColor}30` }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                    style={{ backgroundColor: '#10b981' }}>
                    <MessageCircle size={20} style={{ color: '#ffffff' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold" style={{ color: headingColor }}>{business.feedbackLabel || 'Send Feedback'}</p>
                    <p className="text-xs" style={{ color: subtextColor }}>{business.feedbackUrl ? 'Share your experience' : business.contactEmail}</p>
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
