import React, { useState, useEffect, useRef } from 'react';
import { Search, Eye, Copy, ArrowLeft, Camera, Lock } from 'lucide-react';
import { renderIcon } from '../icon-registry';

function isDark(hex) {
  if (!hex) return true;
  var c = hex.replace('#', '');
  var r = parseInt(c.substring(0, 2), 16);
  var g = parseInt(c.substring(2, 4), 16);
  var b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

function StaffPanel() {
  var _lock = useState(true), isLocked = _lock[0], setIsLocked = _lock[1];
  var _pin = useState(''), pinInput = _pin[0], setPinInput = _pin[1];
  var _pinErr = useState(''), pinError = _pinErr[0], setPinError = _pinErr[1];
  var _staff = useState(''), selectedStaff = _staff[0], setSelectedStaff = _staff[1];
  var _branch = useState(''), selectedBranch = _branch[0], setSelectedBranch = _branch[1];
  var _a = useState(''), searchInput = _a[0], setSearchInput = _a[1];
  var _b = useState(false), loading = _b[0], setLoading = _b[1];
  var _c = useState(''), message = _c[0], setMessage = _c[1];
  var _d = useState(null), clientInfo = _d[0], setClientInfo = _d[1];
  var _d2 = useState([]), clientCoupons = _d2[0], setClientCoupons = _d2[1];
  var _e = useState(null), multipleResults = _e[0], setMultipleResults = _e[1];
  var _f = useState(false), showScanner = _f[0], setShowScanner = _f[1];
  var _mn = useState(false), mobileNav = _mn[0], setMobileNav = _mn[1];
  var _g = useState(false), scanning = _g[0], setScanning = _g[1];
  var _h = useState(null), businessInfo = _h[0], setBusinessInfo = _h[1];
  var _i = useState([]), pendingClients = _i[0], setPendingClients = _i[1];
  var videoRef = useRef(null);
  var canvasRef = useRef(null);
  var scanIntervalRef = useRef(null);

  function loadPending() {
    fetch('/api/approve-client')
      .then(function(r) { return r.json(); })
      .then(function(data) { setPendingClients(data.pending || []); })
      .catch(function(err) { console.error('Error loading pending:', err); });
  }

  useEffect(function() {
    fetch('/api/get-business-info')
      .then(function(r) { return r.json(); })
      .then(function(data) { setBusinessInfo(data); })
      .catch(function(err) { console.error('Error:', err); });
    loadPending();
  }, []);

  // Load jsQR when scanner opens
  useEffect(function() {
    if (showScanner && !window.jsQR) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [showScanner]);

  var bgColor = (businessInfo && businessInfo.backgroundColor) || '#1a1a2e';
  var accentColor = (businessInfo && businessInfo.accentColor) || '#6b7280';
  var borderColor = (businessInfo && businessInfo.borderColor) || '#374151';
  var cardBg = (businessInfo && businessInfo.cardBackground) || '#ffffff';
  var bgIsDark = isDark(bgColor);
  var heroText = bgIsDark ? '#ffffff' : borderColor;
  var heroSub = bgIsDark ? 'rgba(255,255,255,0.7)' : '#6b7280';

  // Staff & branch lists
  var staffNames = (businessInfo && businessInfo.staffList) ? businessInfo.staffList.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];
  var branchNames = (businessInfo && businessInfo.branchList) ? businessInfo.branchList.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];

  // Smart text colors for glass card panels (white/light backgrounds)
  function isLightColor(hex) {
    var c = (hex || '#000').replace('#','');
    return (0.299*parseInt(c.substring(0,2),16) + 0.587*parseInt(c.substring(2,4),16) + 0.114*parseInt(c.substring(4,6),16))/255 > 0.6;
  }
  var panelText = isLightColor(borderColor) ? '#1a1a2e' : borderColor;
  var panelAccent = isLightColor(accentColor) ? '#1a1a2e' : accentColor;
  // Smart button text: dark text on light bg, white text on dark bg
  var btnOnAccent = isLightColor(accentColor) ? '#1a1a2e' : '#ffffff';
  var btnOnBorder = isLightColor(borderColor) ? '#1a1a2e' : '#ffffff';

  // QR Scanner
  function startScanner() {
    setShowScanner(true);
    setMessage('');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(function(stream) {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setScanning(true);
          scanQRCode();
        }
      })
      .catch(function() {
        setMessage('Camera access denied or not available');
        setShowScanner(false);
      });
  }

  function scanQRCode() {
    scanIntervalRef.current = setInterval(function() {
      if (videoRef.current && canvasRef.current && window.jsQR) {
        var video = videoRef.current;
        var canvas = canvasRef.current;
        var ctx = canvas.getContext('2d');
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          var code = window.jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            stopScanner();
            setSearchInput(code.data.toUpperCase());
            searchByToken(code.data.toUpperCase());
          }
        }
      }
    }, 300);
  }

  function resolveMilestones(milestonesJson, totalVisits, requiredVisits) {
    var parsed = {};
    try { parsed = JSON.parse(milestonesJson || '{}'); } catch(e) {}
    // Old format: array → treat as Card 1
    if (Array.isArray(parsed)) return { milestones: parsed, cardCycle: 1 };
    
    var completedCards = Math.floor(totalVisits / requiredVisits);
    var cycle = completedCards + 1; // Current card number (1-indexed)
    
    // Find the right tier: exact match, or highest tier with _default flag, or highest available
    var tierKeys = Object.keys(parsed).filter(function(k) { return !k.includes('_'); }).sort(function(a,b) { return parseInt(a)-parseInt(b); });
    
    if (parsed[String(cycle)]) {
      return { milestones: parsed[String(cycle)], cardCycle: cycle };
    }
    
    // Find highest tier with _default flag
    for (var i = tierKeys.length - 1; i >= 0; i--) {
      if (parsed[tierKeys[i] + '_default'] && parseInt(tierKeys[i]) <= cycle) {
        return { milestones: parsed[tierKeys[i]], cardCycle: cycle };
      }
    }
    
    // Fallback: use last defined tier
    var lastKey = tierKeys[tierKeys.length - 1];
    return { milestones: parsed[lastKey] || [], cardCycle: cycle };
  }

  function buildClientInfo(result) {
    var total = (result.loyalty && result.loyalty.totalVisits) || 0;
    var required = (result.business && result.business.requiredVisits) || 10;
    var progress = (result.loyalty && result.loyalty.currentProgress !== undefined) ? result.loyalty.currentProgress : (total % required);
    
    var resolved = resolveMilestones(
      result.business && result.business.milestonesJson,
      total, required
    );
    
    return {
      name: result.client.name,
      token: result.client.token,
      email: result.client.email,
      currentVisits: total,
      currentProgress: progress,
      requiredVisits: required,
      milestones: resolved.milestones,
      cardCycle: resolved.cardCycle,
    };
  }

  function stopScanner() {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(function(t) { t.stop(); });
    }
    setShowScanner(false);
    setScanning(false);
  }

  function searchByToken(token) {
    setLoading(true);
    setMessage('');
    setClientInfo(null);
    setMultipleResults(null);
    fetch('/api/client-dashboard?token=' + token)
      .then(function(r) {
        if (!r.ok) throw new Error('Customer not found');
        return r.json();
      })
      .then(function(result) {
        if (result.client) {
          setClientInfo(buildClientInfo(result));
          setClientCoupons(result.coupons || []);
          setMessage('Customer found! Review info and confirm to add stamp.');
        }
      })
      .catch(function(error) {
        setMessage('Error: ' + error.message);
        setClientInfo(null);
      })
      .finally(function() { setLoading(false); });
  }

  function searchCustomer(e) {
    e.preventDefault();
    if (!searchInput.trim()) {
      setMessage('Please enter a token or customer name');
      return;
    }
    setLoading(true);
    setMessage('');
    setClientInfo(null);
    setMultipleResults(null);
    var query = searchInput.trim();
    var upperQuery = query.toUpperCase();

    // Try token first
    fetch('/api/client-dashboard?token=' + upperQuery)
      .then(function(r) {
        if (r.ok) return r.json();
        // Token not found — try name search
        return fetch('/api/search-client?name=' + encodeURIComponent(query))
          .then(function(r2) {
            if (!r2.ok) throw new Error('Customer not found');
            return r2.json();
          });
      })
      .then(function(result) {
        if (result.client && result.loyalty) {
          // Full dashboard data from token search
          setClientInfo(buildClientInfo(result));
          setClientCoupons(result.coupons || []);
          setMultipleResults(null);
          setMessage('Customer found! Review info and confirm to add stamp.');
        } else if (result.client && !result.loyalty) {
          // Partial data from search-client — fetch full dashboard
          fetch('/api/client-dashboard?token=' + result.client.token)
            .then(function(r2) { return r2.ok ? r2.json() : null; })
            .then(function(full) {
              if (full && full.client) {
                setClientInfo(buildClientInfo(full));
                setClientCoupons(full.coupons || []);
              }
            });
          setMultipleResults(null);
          setMessage('Customer found! Review info and confirm to add stamp.');
        } else if (result.multiple) {
          // Multiple matches
          setMultipleResults(result.multiple);
          setClientInfo(null);
          setMessage('Found ' + result.multiple.length + ' customers. Please select:');
        } else {
          setMessage('Customer not found');
        }
      })
      .catch(function(error) {
        setMessage('Error: ' + error.message);
        setClientInfo(null);
      })
      .finally(function() { setLoading(false); });
  }

  function confirmAddStamp() {
    if (!clientInfo) return;
    setLoading(true);
    setMessage('');
    fetch('/api/add-stamp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: clientInfo.token, businessID: 'BIZ_001', addedBy: 'staff', staffName: selectedStaff, branch: selectedBranch })
    })
      .then(function(r) { return r.json(); })
      .then(function(result) {
        if (result.error) throw new Error(result.error);
        if (result.milestoneReward) {
          setMessage('🎉 SUCCESS! ' + result.client.name + ' earned a reward: "' + result.milestoneReward + '"');
        } else {
          setMessage('✅ Stamp added! ' + result.client.name + ' now has ' + result.totalVisits + ' visits.');
        }
        // Update visits count on screen and recalculate cycle
        var newTotal = result.totalVisits;
        var newProgress = newTotal % clientInfo.requiredVisits;
        var newCycle = Math.floor(newTotal / clientInfo.requiredVisits) + 1;
        
        if (newProgress === 0 && newTotal > 0) {
          // Card just completed! Show full card (10/10) instead of resetting to 0
          setClientInfo(Object.assign({}, clientInfo, {
            currentVisits: newTotal,
            currentProgress: clientInfo.requiredVisits, // Show as 10/10 not 0/10
            cardCycle: newCycle - 1, // Stay on completed card
          }));
          // Reload coupons in case a reward was auto-created
          if (result.milestoneReward) {
            fetch('/api/client-dashboard?token=' + clientInfo.token)
              .then(function(r) { return r.json(); })
              .then(function(dashResult) {
                if (dashResult.coupons) setClientCoupons(dashResult.coupons);
              });
          }
        } else if (newCycle !== clientInfo.cardCycle) {
          // Cycle changed (after adding more stamps on a new card) — reload full data
          fetch('/api/client-dashboard?token=' + clientInfo.token)
            .then(function(r) { return r.json(); })
            .then(function(fullResult) {
              if (fullResult.client) {
                setClientInfo(buildClientInfo(fullResult));
                setClientCoupons(fullResult.coupons || []);
              }
            });
        } else {
          setClientInfo(Object.assign({}, clientInfo, { currentVisits: newTotal, currentProgress: newProgress }));
          // Reload coupons in case a reward was auto-created
          if (result.milestoneReward) {
            fetch('/api/client-dashboard?token=' + clientInfo.token)
              .then(function(r) { return r.json(); })
              .then(function(dashResult) {
                if (dashResult.coupons) setClientCoupons(dashResult.coupons);
              });
          }
        }
      })
      .catch(function(error) { setMessage('Error: ' + error.message); })
      .finally(function() { setLoading(false); });
  }

  function voidLastStamp() {
    if (!clientInfo) return;
    if (!confirm('Void last stamp for ' + clientInfo.name + '? This will also revoke any milestone rewards above the new stamp count.')) return;
    setLoading(true);
    setMessage('');
    fetch('/api/void-stamp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: clientInfo.token, businessID: 'BIZ_001', voidedBy: 'staff' })
    })
      .then(function(r) { return r.json(); })
      .then(function(result) {
        if (result.error) throw new Error(result.error);
        setMessage('⚠️ Stamp voided for ' + clientInfo.name + '. Now has ' + result.remainingVisits + ' visits.');
        // Update visits immediately
        var newProgress = result.remainingVisits % clientInfo.requiredVisits;
        var newCycle = Math.floor(result.remainingVisits / clientInfo.requiredVisits) + 1;
        setClientInfo(Object.assign({}, clientInfo, {
          currentVisits: result.remainingVisits,
          currentProgress: newProgress,
          cardCycle: newCycle,
        }));
        // Reload full data after a short delay (let Sheets propagate)
        setTimeout(function() {
          fetch('/api/client-dashboard?token=' + clientInfo.token)
            .then(function(r2) { return r2.json(); })
            .then(function(fullResult) {
              if (fullResult.client) {
                setClientInfo(buildClientInfo(fullResult));
                setClientCoupons(fullResult.coupons || []);
              }
            });
        }, 1000);
      })
      .catch(function(error) { setMessage('Error: ' + error.message); })
      .finally(function() { setLoading(false); });
  }

  function cancelSearch() {
    setClientInfo(null);
    setSearchInput('');
    setMessage('');
    setMultipleResults(null);
  }

  function selectCustomer(customer) {
    fetch('/api/client-dashboard?token=' + customer.token)
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(full) {
        if (full && full.client) {
          setClientInfo(buildClientInfo(full));
        } else {
          setClientInfo({
            name: customer.name, token: customer.token, email: customer.email,
            currentVisits: 0, requiredVisits: 10, milestones: [],
          });
        }
        setClientCoupons(full ? (full.coupons || []) : []);
        setMultipleResults(null);
        setMessage('Customer selected! Review info and confirm to add stamp.');
      });
  }

  if (!businessInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  var staffPin = businessInfo.staffPin || '0000';

  function handlePinSubmit() {
    if (pinInput === staffPin) {
      setIsLocked(false);
      setPinError('');
    } else {
      setPinError('Incorrect PIN');
    }
  }

  if (isLocked) {
    var bgIsDarkPin = isLightColor(bgColor) ? false : true;
    var navTextPin = bgIsDarkPin ? '#ffffff' : (isLightColor(borderColor) ? '#1a1a2e' : borderColor);
    return (
      <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
        <nav className="relative z-20" style={{ backgroundColor: isLightColor(borderColor) ? '#1a1a2e' : borderColor }}>
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <a href="/#/" className="flex items-center gap-3 no-underline">
                {businessInfo.logo ? (
                  <img src={businessInfo.logo} alt={businessInfo.businessName}
                    className="h-12 w-12 object-contain rounded-xl p-1.5"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    onError={function(e) { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg"
                    style={{ backgroundColor: accentColor, color: btnOnAccent }}>
                    {(businessInfo.businessName || 'B').charAt(0)}
                  </div>
                )}
                <span className="text-xl font-bold text-white tracking-tight hidden sm:inline">
                  {businessInfo.businessName || 'Business'}
                </span>
              </a>
            </div>
          </div>
        </nav>
        <div className="flex items-center justify-center p-6" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="glass-card rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ backgroundColor: accentColor + '15' }}>
              <Lock size={24} color={accentColor} />
            </div>
            <h2 className="text-lg font-bold mt-0 mb-1" style={{ color: '#1a1a2e' }}>Loyalty Desk</h2>
            <p className="text-gray-400 text-xs mb-5">Enter PIN to access</p>
            <input type="password" value={pinInput}
              onChange={function(e) { setPinInput(e.target.value); setPinError(''); }}
              onKeyDown={function(e) { if (e.key === 'Enter') handlePinSubmit(); }}
              placeholder="Enter PIN"
              className="w-full px-5 py-3 text-center text-lg tracking-[0.25em] rounded-xl border-2 focus:outline-none mb-4"
              style={{ borderColor: accentColor + '50', fontFamily: 'system-ui, -apple-system, sans-serif' }}
              autoFocus />
            {pinError && <p className="text-red-500 text-xs font-semibold mb-3">{pinError}</p>}
            <button onClick={handlePinSubmit}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:shadow-lg"
              style={{ backgroundColor: accentColor, color: btnOnAccent }}>
              Unlock
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {/* Nav */}
      <nav className="relative z-20" style={{ backgroundColor: isLightColor(borderColor) ? '#1a1a2e' : borderColor }}>
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <a href="/#/" className="flex items-center gap-3 no-underline">
              {businessInfo.logo ? (
                <img src={businessInfo.logo} alt={businessInfo.businessName}
                  className="h-12 w-12 object-contain rounded-xl p-1.5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  onError={function(e) { e.target.style.display = 'none'; }} />
              ) : (
                <div className="h-12 w-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg"
                  style={{ backgroundColor: accentColor, color: btnOnAccent }}>
                  {(businessInfo.businessName || 'B').charAt(0)}
                </div>
              )}
              <span className="text-xl font-bold text-white tracking-tight hidden sm:inline">
                {businessInfo.businessName || 'Business'}
              </span>
            </a>
            {/* Desktop links */}
            <div className="hidden md:flex gap-2">
              {[
                { href: '/#/', label: 'Home' },
                { href: '/#/staff', label: 'Loyalty Desk', active: true },
                { href: '/#/admin', label: 'Client Management' },
              ].map(function(link) {
                return (
                  <a key={link.href} href={link.href}
                    className="px-4 py-2.5 rounded-xl font-semibold text-sm no-underline flex items-center gap-2"
                    style={{ backgroundColor: link.active ? accentColor : 'rgba(255,255,255,0.1)', color: link.active ? (isLightColor(accentColor) ? '#1a1a2e' : '#ffffff') : '#ffffff' }}>
                    {link.label}
                  </a>
                );
              })}
            </div>
            {/* Mobile hamburger */}
            <button className="md:hidden p-2 rounded-xl text-white"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              onClick={function() { setMobileNav(!mobileNav); }}>
              <span style={{ fontSize: '22px' }}>{mobileNav ? '✕' : '☰'}</span>
            </button>
          </div>
          {/* Mobile menu */}
          {mobileNav && (
            <div className="md:hidden mt-3 flex flex-col gap-2 pb-2">
              {[
                { href: '/#/', label: 'Home' },
                { href: '/#/staff', label: 'Loyalty Desk', active: true },
                { href: '/#/admin', label: 'Client Management' },
              ].map(function(link) {
                return (
                  <a key={link.href} href={link.href}
                    className="px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-3 text-white no-underline"
                    style={{ backgroundColor: link.active ? accentColor : 'rgba(255,255,255,0.1)', color: link.active ? (isLightColor(accentColor) ? '#1a1a2e' : '#ffffff') : '#ffffff' }}
                    onClick={function() { setMobileNav(false); }}>
                    {link.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-40 right-20 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: accentColor }}></div>
        <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: borderColor }}></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-8">
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-4xl font-black mb-2 tracking-tight" style={{ color: heroText }}>Loyalty Desk</h1>
          <p className="font-light text-lg" style={{ color: heroSub }}>Search by token or customer name</p>
        </div>

        {/* Staff & Branch Selector */}
        {(staffNames.length > 0 || branchNames.length > 0) && (
          <div className="glass-card rounded-xl p-3 mb-6 animate-slide-up flex flex-wrap gap-3 items-center justify-center">
            {staffNames.length > 0 && (
              <select value={selectedStaff} onChange={function(e) { setSelectedStaff(e.target.value); }}
                className="px-3 py-2 rounded-lg border text-xs font-medium bg-white"
                style={{ borderColor: accentColor + '40', color: panelText }}>
                <option value="">Select Staff</option>
                {staffNames.map(function(name) { return <option key={name} value={name}>{name}</option>; })}
              </select>
            )}
            {branchNames.length > 0 && (
              <select value={selectedBranch} onChange={function(e) { setSelectedBranch(e.target.value); }}
                className="px-3 py-2 rounded-lg border text-xs font-medium bg-white"
                style={{ borderColor: accentColor + '40', color: panelText }}>
                <option value="">Select Branch</option>
                {branchNames.map(function(name) { return <option key={name} value={name}>{name}</option>; })}
              </select>
            )}
          </div>
        )}

        {/* QR Scanner Modal */}
        {showScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="glass-card rounded-3xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold" style={{ color: panelText }}>Scan QR Code</h2>
                <button onClick={stopScanner} className="p-2 hover:bg-gray-100 rounded-xl transition">
                  <span style={{ fontSize: '24px', color: '#666' }}>✕</span>
                </button>
              </div>
              <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: '1' }}>
                <video ref={videoRef} className="w-full h-full object-cover" playsInline></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div style={{ width: '70%', height: '70%', border: '4px solid ' + accentColor, borderRadius: '16px' }}></div>
                </div>
              </div>
              <p className="text-center text-gray-500 mt-4 font-semibold text-sm">
                {scanning ? 'Position QR code within frame…' : 'Starting camera…'}
              </p>
            </div>
          </div>
        )}

        {/* Pending Registrations Banner */}
        {!clientInfo && !showScanner && !multipleResults && pendingClients.length > 0 && (
          <div className="glass-card rounded-2xl shadow-md p-4 mb-4 animate-slide-up" style={{ border: '2px solid ' + accentColor + '30' }}>
            <button onClick={function() {
              var el = document.getElementById('pending-list');
              if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
            }} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🔔</span>
                <span className="font-bold text-sm" style={{ color: panelText }}>{pendingClients.length} Pending Registration{pendingClients.length > 1 ? 's' : ''}</span>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: accentColor + '15', color: panelAccent }}>Tap to review</span>
            </button>
            <div id="pending-list" style={{ display: 'none' }} className="mt-3 space-y-2">
              {pendingClients.map(function(client) {
                return (
                  <div key={client.clientID} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="font-bold text-sm" style={{ color: panelText }}>{client.name}</p>
                      <p className="text-xs text-gray-400">
                        {client.mobile || 'No mobile'} · {client.token}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={function() {
                        fetch('/api/approve-client', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ clientID: client.clientID, action: 'approve' }),
                        })
                          .then(function(r) { return r.json(); })
                          .then(function(data) {
                            if (data.success) {
                              setMessage('✅ ' + client.name + ' approved!');
                              loadPending();
                            }
                          });
                      }}
                        className="px-3 py-1.5 text-white rounded-lg text-xs font-bold transition hover:shadow-md"
                        style={{ backgroundColor: '#22c55e' }}>
                        ✓
                      </button>
                      <button onClick={function() {
                        if (confirm('Reject ' + client.name + "'s registration?")) {
                          fetch('/api/approve-client', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ clientID: client.clientID, action: 'reject' }),
                          })
                            .then(function(r) { return r.json(); })
                            .then(function(data) {
                              if (data.success) {
                                setMessage('Registration rejected');
                                loadPending();
                              }
                            });
                        }
                      }}
                        className="px-2 py-1.5 rounded-lg text-xs font-bold transition hover:bg-red-50"
                        style={{ color: '#ef4444' }}>
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Form */}
        {!clientInfo && !showScanner && !multipleResults && (
          <div className="glass-card rounded-3xl shadow-xl p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-18 h-18 rounded-2xl mb-4 shadow-lg p-4"
                style={{ backgroundColor: accentColor }}>
                <Search size={36} style={{ color: '#ffffff' }} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: panelText }}>Customer Check-In</h2>
            </div>

            <button type="button" onClick={startScanner}
              className="w-full py-5 rounded-2xl font-bold text-lg transition-all duration-200 hover:shadow-lg hover:scale-[1.01] flex items-center justify-center gap-3 mb-4"
              style={{ backgroundColor: borderColor, color: btnOnBorder }}>
              <Camera size={20} /> Scan QR Code
            </button>

            <div className="text-center text-gray-400 font-semibold text-sm my-4">OR</div>

            <form onSubmit={searchCustomer}>
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider text-center">
                  Enter Token or Customer Name
                </label>
                <input type="text" value={searchInput}
                  onChange={function(e) { setSearchInput(e.target.value); }}
                  className="w-full px-6 py-5 text-xl text-center rounded-2xl focus:outline-none shadow-inner bg-white"
                  style={{ border: '3px solid ' + accentColor }}
                  autoFocus
                  placeholder="e.g. SMFECQJR or Juan" />
              </div>
              <button type="submit" disabled={loading || !searchInput.trim()}
                className="w-full py-5 rounded-2xl font-bold text-lg transition-all duration-200 hover:shadow-lg hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-3"
                style={{ backgroundColor: accentColor, color: btnOnAccent }}>
                {loading ? '⏳ Searching…' : <><Search size={20} /> Search Customer</>}
              </button>
            </form>
          </div>
        )}

        {/* Multiple Results */}
        {multipleResults && multipleResults.length > 0 && (
          <div className="glass-card rounded-3xl shadow-xl p-8 animate-slide-up">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: panelText }}>Select Customer</h2>
              <p className="text-gray-500 mt-2 text-sm">Found {multipleResults.length} customers. Click to select:</p>
            </div>
            <div className="space-y-3 mb-6">
              {multipleResults.map(function(customer, i) {
                return (
                  <button key={i} onClick={function() { selectCustomer(customer); }}
                    className="w-full bg-white hover:shadow-md rounded-2xl p-5 text-left transition-all duration-200"
                    style={{ border: '2px solid ' + accentColor + '40', display: 'block', cursor: 'pointer' }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-lg" style={{ color: panelText }}>{customer.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Token: <span className="font-mono font-bold" style={{ color: panelAccent }}>{customer.token}</span></p>
                        {customer.email && <p className="text-xs text-gray-500">Email: {customer.email}</p>}
                      </div>
                      <span style={{ color: accentColor, fontSize: '20px' }}>›</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={cancelSearch} className="w-full bg-gray-100 text-gray-600 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition">Cancel</button>
          </div>
        )}

        {/* Customer Info */}
        {clientInfo && (
          <div className="glass-card rounded-3xl shadow-xl p-6 animate-slide-up">

            {/* Header: Name + Visits */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold" style={{ color: panelText }}>{clientInfo.name}</h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{clientInfo.token}</p>
              </div>
              <div className="text-center px-4 py-2 rounded-2xl" style={{ backgroundColor: accentColor + '15' }}>
                <p className="text-2xl font-black" style={{ color: panelAccent }}>{clientInfo.currentProgress !== undefined ? clientInfo.currentProgress : clientInfo.currentVisits}/{clientInfo.requiredVisits}</p>
                <p className="text-xs text-gray-400">visits{clientInfo.cardCycle > 1 ? ' · Card ' + clientInfo.cardCycle : ''}</p>
              </div>
            </div>

            {/* Milestones */}
            {clientInfo.milestones && clientInfo.milestones.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Milestones</p>
                <div className="space-y-1.5">
                  {clientInfo.milestones.map(function(m, idx) {
                    var progressForMilestones = clientInfo.currentProgress !== undefined ? clientInfo.currentProgress : clientInfo.currentVisits;
                    var reached = progressForMilestones >= m.position;
                    var cycle = clientInfo.cardCycle || 1;
                    // Check if this milestone has a coupon for THIS cycle (exclude VOIDED)
                    var milestoneCoupon = null;
                    for (var ci = 0; ci < clientCoupons.length; ci++) {
                      if (clientCoupons[ci].redeemed === 'VOIDED') continue;
                      var cn = clientCoupons[ci].notes || '';
                      if (cn.indexOf('milestone_' + m.position + '_cycle_' + cycle) > -1) {
                        milestoneCoupon = clientCoupons[ci];
                        break;
                      }
                    }
                    // Legacy fallback: only for cycle 1 if no cycle tag found
                    if (!milestoneCoupon && cycle === 1) {
                      for (var ci2 = 0; ci2 < clientCoupons.length; ci2++) {
                        if (clientCoupons[ci2].redeemed === 'VOIDED') continue;
                        var cn2 = clientCoupons[ci2].notes || '';
                        if ((cn2.indexOf('Milestone: ' + m.label) > -1 || cn2.indexOf('milestone_' + m.position) > -1) && cn2.indexOf('_cycle_') === -1) {
                          milestoneCoupon = clientCoupons[ci2];
                          break;
                        }
                      }
                    }
                    var isClaimed = milestoneCoupon && milestoneCoupon.redeemed === 'TRUE';
                    var isPending = milestoneCoupon && milestoneCoupon.redeemed !== 'TRUE';

                    return (
                      <div key={idx} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-100">
                        <div className="flex items-center gap-2">
                          <span>{renderIcon(m.icon || 'gift', 16, 'currentColor')}</span>
                          <div>
                            <p className="font-semibold text-xs" style={{ color: reached ? borderColor : '#9ca3af' }}>{m.label}</p>
                            <p className="text-xs text-gray-400">Visit {m.position}{m.description ? ' · ' + m.description : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {!reached && (
                            <span className="text-xs text-gray-300">{m.position - progressForMilestones} away</span>
                          )}
                          {reached && isClaimed && (
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500">✓ Claimed</span>
                          )}
                          {reached && isPending && (
                            <button onClick={function() {
                              var thisCoupon = milestoneCoupon;
                              if (!confirm('Mark "' + m.label + '" as claimed/given?')) return;
                              fetch('/api/manage-coupons', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'redeem', couponID: thisCoupon.couponID }),
                              })
                                .then(function(r) { return r.json(); })
                                .then(function(data) {
                                  if (data.success) {
                                    setMessage('✅ Milestone claimed: ' + m.label);
                                    setClientCoupons(clientCoupons.map(function(c) {
                                      if (c.couponID === thisCoupon.couponID) return Object.assign({}, c, { redeemed: 'TRUE' });
                                      return c;
                                    }));
                                  } else {
                                    setMessage('❌ ' + (data.error || 'Failed'));
                                  }
                                })
                                .catch(function() { setMessage('❌ Failed'); });
                            }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-white"
                              style={{ backgroundColor: '#10b981' }}>
                              Claim
                            </button>
                          )}
                          {reached && !milestoneCoupon && (
                            <button onClick={function() {
                              var mLabel = m.label;
                              var mPos = m.position;
                              if (!confirm('Issue & claim milestone "' + mLabel + '"?')) return;

                              // Step 1: Create the coupon
                              fetch('/api/manage-coupons', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  clientID: clientInfo.token,
                                  type: 'milestone',
                                  text: mLabel,
                                  notes: 'Milestone: ' + mLabel + ' (milestone_' + mPos + '_cycle_' + (clientInfo.cardCycle || 1) + ')',
                                  businessID: 'BIZ_001',
                                }),
                              })
                                .then(function(r) { return r.json(); })
                                .then(function(createData) {
                                  if (!createData.success || !createData.couponID) {
                                    setMessage('❌ Failed to create: ' + (createData.error || 'Unknown error'));
                                    return;
                                  }
                                  // Step 2: Redeem it
                                  fetch('/api/manage-coupons', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'redeem', couponID: createData.couponID }),
                                  })
                                    .then(function(r2) { return r2.json(); })
                                    .then(function(redeemData) {
                                      if (redeemData.success) {
                                        setMessage('✅ Milestone given & claimed: ' + mLabel);
                                      } else {
                                        setMessage('⚠️ Created but failed to claim: ' + (redeemData.error || ''));
                                      }
                                      // Step 3: Reload all coupons
                                      fetch('/api/client-dashboard?token=' + clientInfo.token)
                                        .then(function(r3) { return r3.json(); })
                                        .then(function(result) {
                                          if (result.coupons) setClientCoupons(result.coupons);
                                        });
                                    });
                                })
                                .catch(function(err) { setMessage('❌ Error: ' + err.message); });
                            }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold"
                              style={{ backgroundColor: accentColor, color: btnOnAccent }}>
                              Give & Claim
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Primary Actions */}
            <div className="flex gap-2 mb-4">
              <button onClick={confirmAddStamp} disabled={loading}
                className="flex-1 py-3.5 rounded-2xl font-bold transition-all hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 text-sm"
                style={{ backgroundColor: accentColor, color: btnOnAccent }}>
                {loading ? '⏳' : '✓ Add Stamp'}
              </button>
              <button onClick={voidLastStamp} disabled={loading || clientInfo.currentVisits === 0}
                className="px-4 py-3.5 rounded-2xl font-bold transition hover:bg-red-100 disabled:opacity-30 text-sm"
                style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                ↩ Void
              </button>
            </div>

            {/* Active Coupons */}
            {clientCoupons.filter(function(c) { return c.redeemed !== 'TRUE' && c.redeemed !== 'VOIDED'; }).length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Coupons ({clientCoupons.filter(function(c) { return c.redeemed !== 'TRUE' && c.redeemed !== 'VOIDED'; }).length})
                </p>
                <div className="space-y-2">
                  {clientCoupons.filter(function(c) { return c.redeemed !== 'TRUE' && c.redeemed !== 'VOIDED'; }).map(function(coupon, idx) {
                    return (
                      <div key={idx} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-gray-100">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="font-semibold text-sm truncate" style={{ color: panelText }}>{coupon.text || 'Coupon'}</p>
                          <p className="text-xs text-gray-400">{coupon.type}{coupon.expiryDate ? ' · ' + coupon.expiryDate : ''}</p>
                        </div>
                        <button onClick={function() {
                          if (!confirm('Mark "' + (coupon.text || 'coupon') + '" as claimed?')) return;
                          fetch('/api/manage-coupons', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'redeem', couponID: coupon.couponID }),
                          })
                            .then(function(r) { return r.json(); })
                            .then(function(data) {
                              if (data.success) {
                                setMessage('✅ Coupon claimed: ' + (coupon.text || 'Coupon'));
                                setClientCoupons(clientCoupons.map(function(c) {
                                  if (c.couponID === coupon.couponID) return Object.assign({}, c, { redeemed: 'TRUE' });
                                  return c;
                                }));
                              } else {
                                setMessage('❌ ' + (data.error || 'Failed'));
                              }
                            })
                            .catch(function() { setMessage('❌ Failed to redeem'); });
                        }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: '#10b981' }}>
                          Claim
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Secondary Actions */}
            <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid #e5e7eb' }}>
              <button onClick={function() {
                window.open(window.location.origin + '/#/card?token=' + clientInfo.token, '_blank');
              }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition">
                <Eye size={14} /> View Card
              </button>
              <button onClick={function() {
                var link = window.location.origin + '/#/card?token=' + clientInfo.token;
                navigator.clipboard.writeText(link).then(function() {
                  setMessage('✅ Card link copied!');
                }).catch(function() {
                  // Fallback for older browsers
                  var ta = document.createElement('textarea');
                  ta.value = link;
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand('copy');
                  document.body.removeChild(ta);
                  setMessage('✅ Card link copied!');
                });
              }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition">
                <Copy size={14} /> Copy Link
              </button>
              <button onClick={function() { setClientInfo(null); setClientCoupons([]); setMessage(''); setSearchInput(''); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition">
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          </div>
        )}

        {/* Message Toast */}
        {message && (
          <div className={'mt-4 px-4 py-3 rounded-xl text-center text-xs font-medium animate-slide-up ' +
            (message.indexOf('🎉') > -1 ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : (message.indexOf('✅') > -1 || message.indexOf('Stamp added') > -1 || message.indexOf('SUCCESS') > -1 || message.indexOf('approved') > -1) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : message.indexOf('found') > -1 || message.indexOf('selected') > -1 || message.indexOf('Found') > -1 ? 'bg-sky-50 text-sky-700 border border-sky-200'
            : message.indexOf('Please') > -1 ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200')
          }>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default StaffPanel;
