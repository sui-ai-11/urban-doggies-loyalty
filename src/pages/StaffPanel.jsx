import React, { useState, useEffect, useRef } from 'react';

function isDark(hex) {
  if (!hex) return true;
  var c = hex.replace('#', '');
  var r = parseInt(c.substring(0, 2), 16);
  var g = parseInt(c.substring(2, 4), 16);
  var b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

function StaffPanel() {
  var _a = useState(''), searchInput = _a[0], setSearchInput = _a[1];
  var _b = useState(false), loading = _b[0], setLoading = _b[1];
  var _c = useState(''), message = _c[0], setMessage = _c[1];
  var _d = useState(null), clientInfo = _d[0], setClientInfo = _d[1];
  var _e = useState(null), multipleResults = _e[0], setMultipleResults = _e[1];
  var _f = useState(false), showScanner = _f[0], setShowScanner = _f[1];
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
  var accentColor = (businessInfo && businessInfo.accentColor) || '#7f5af0';
  var borderColor = (businessInfo && businessInfo.borderColor) || '#2cb67d';
  var cardBg = (businessInfo && businessInfo.cardBackground) || '#ffffff';
  var bgIsDark = isDark(bgColor);
  var heroText = bgIsDark ? '#ffffff' : borderColor;
  var heroSub = bgIsDark ? 'rgba(255,255,255,0.7)' : '#6b7280';

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
          setClientInfo({
            name: result.client.name,
            token: result.client.token,
            breed: result.client.breed,
            mobile: result.client.mobile,
            currentVisits: (result.loyalty && result.loyalty.totalVisits) || 0,
            requiredVisits: (result.business && result.business.requiredVisits) || 10
          });
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
        if (result.client) {
          // Single client from token search
          setClientInfo({
            name: result.client.name,
            token: result.client.token,
            breed: result.client.breed,
            mobile: result.client.mobile,
            currentVisits: (result.loyalty && result.loyalty.totalVisits) || 0,
            requiredVisits: (result.business && result.business.requiredVisits) || 10
          });
          setMultipleResults(null);
          setMessage('Customer found! Review info and confirm to add stamp.');
        } else if (result.clients && result.clients.length > 1) {
          // Multiple matches
          setMultipleResults(result.clients);
          setClientInfo(null);
          setMessage('Found ' + result.clients.length + ' customers. Please select:');
        } else if (result.clients && result.clients.length === 1) {
          // Single match from name search — fetch full loyalty data
          var c = result.clients[0];
          fetch('/api/client-dashboard?token=' + c.token)
            .then(function(r2) { return r2.ok ? r2.json() : null; })
            .then(function(full) {
              setClientInfo({
                name: c.name, token: c.token, breed: c.breed, mobile: c.mobile,
                currentVisits: full ? (full.loyalty && full.loyalty.totalVisits) || 0 : 0,
                requiredVisits: full ? (full.business && full.business.requiredVisits) || 10 : 10
              });
              setMultipleResults(null);
              setMessage('Customer found! Review info and confirm to add stamp.');
            });
        } else {
          throw new Error('Customer not found');
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
      body: JSON.stringify({ token: clientInfo.token, businessID: 'BIZ_001', addedBy: 'staff' })
    })
      .then(function(r) { return r.json(); })
      .then(function(result) {
        if (result.error) throw new Error(result.error);
        if (result.rewardEarned) {
          setMessage('🎉 SUCCESS! ' + result.client.name + ' earned a reward: "' + result.rewardText + '"');
        } else {
          setMessage('✅ Stamp added! ' + result.client.name + ' now has ' + result.totalVisits + ' visits.');
        }
        setTimeout(function() { setSearchInput(''); setClientInfo(null); setMessage(''); }, 4000);
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
    // Fetch full loyalty data for selected customer
    fetch('/api/client-dashboard?token=' + customer.token)
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(full) {
        setClientInfo({
          name: customer.name, token: customer.token, breed: customer.breed, mobile: customer.mobile,
          currentVisits: full ? (full.loyalty && full.loyalty.totalVisits) || 0 : 0,
          requiredVisits: full ? (full.business && full.business.requiredVisits) || 10 : 10
        });
        setMultipleResults(null);
        setMessage('Customer selected! Review info and confirm to add stamp.');
      });
  }

  if (!businessInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {/* Nav */}
      <nav className="relative z-20" style={{ backgroundColor: borderColor }}>
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <a href="/#/" className="flex items-center gap-3 no-underline">
              {businessInfo.logo ? (
                <img src={businessInfo.logo} alt={businessInfo.businessName}
                  className="h-12 w-12 object-contain rounded-xl p-1.5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  onError={function(e) { e.target.style.display = 'none'; }} />
              ) : (
                <div className="h-12 w-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: accentColor }}>
                  {(businessInfo.businessName || 'B').charAt(0)}
                </div>
              )}
              <span className="text-xl font-bold text-white tracking-tight hidden sm:inline">
                {businessInfo.businessName || 'Business'}
              </span>
            </a>
            <div className="flex gap-2">
              {[
                { href: '/#/', label: 'Home' },
                { href: '/#/staff', label: 'Loyalty Desk', active: true },
                { href: '/#/admin', label: 'Client Management' },
              ].map(function(link) {
                return (
                  <a key={link.href} href={link.href}
                    className="px-4 py-2.5 rounded-xl font-semibold text-sm text-white no-underline flex items-center gap-2"
                    style={{ backgroundColor: link.active ? accentColor : 'rgba(255,255,255,0.1)' }}>
                    {link.label}
                  </a>
                );
              })}
            </div>
          </div>
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

        {/* QR Scanner Modal */}
        {showScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="glass-card rounded-3xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold" style={{ color: borderColor }}>Scan QR Code</h2>
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
                <span className="font-bold text-sm" style={{ color: borderColor }}>{pendingClients.length} Pending Registration{pendingClients.length > 1 ? 's' : ''}</span>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: accentColor + '15', color: accentColor }}>Tap to review</span>
            </button>
            <div id="pending-list" style={{ display: 'none' }} className="mt-3 space-y-2">
              {pendingClients.map(function(client) {
                return (
                  <div key={client.rowIndex} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="font-bold text-sm" style={{ color: borderColor }}>{client.name}</p>
                      <p className="text-xs text-gray-400">
                        {client.mobile || 'No mobile'} · {client.token}
                        {client.customField ? ' · ' + client.customField : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={function() {
                        fetch('/api/approve-client', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ rowIndex: client.rowIndex, action: 'approve' }),
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
                            body: JSON.stringify({ rowIndex: client.rowIndex, action: 'reject' }),
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
                <span style={{ fontSize: '36px' }}>🔍</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: borderColor }}>Customer Check-In</h2>
            </div>

            <button type="button" onClick={startScanner}
              className="w-full text-white py-5 rounded-2xl font-bold text-lg transition-all duration-200 hover:shadow-lg hover:scale-[1.01] flex items-center justify-center gap-3 mb-4"
              style={{ backgroundColor: borderColor }}>
              📷 Scan QR Code
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
                className="w-full text-white py-5 rounded-2xl font-bold text-lg transition-all duration-200 hover:shadow-lg hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-3"
                style={{ backgroundColor: accentColor }}>
                {loading ? '⏳ Searching…' : '🔍 Search Customer'}
              </button>
            </form>
          </div>
        )}

        {/* Multiple Results */}
        {multipleResults && multipleResults.length > 0 && (
          <div className="glass-card rounded-3xl shadow-xl p-8 animate-slide-up">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: borderColor }}>Select Customer</h2>
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
                        <p className="font-bold text-lg" style={{ color: borderColor }}>{customer.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Token: <span className="font-mono font-bold" style={{ color: accentColor }}>{customer.token}</span></p>
                        {customer.mobile && <p className="text-xs text-gray-500">Mobile: {customer.mobile}</p>}
                        {customer.breed && <p className="text-xs text-gray-500">Pet: 🐕 {customer.breed}</p>}
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
        {clientInfo && message.indexOf('Stamp added') === -1 && message.indexOf('SUCCESS') === -1 && (
          <div className="glass-card rounded-3xl shadow-xl p-8 animate-slide-up">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl mb-4 shadow-lg">
                <span style={{ color: 'white', fontSize: '32px' }}>✓</span>
              </div>
              <h2 className="text-2xl font-bold text-green-600">Customer Found!</h2>
            </div>

            <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: '2px solid ' + accentColor + '30' }}>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Name</span>
                  <span className="font-bold text-xl" style={{ color: borderColor }}>{clientInfo.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Token</span>
                  <span className="font-bold text-lg font-mono" style={{ color: accentColor }}>{clientInfo.token}</span>
                </div>
                {clientInfo.mobile && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mobile</span>
                    <span className="text-gray-700">{clientInfo.mobile}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Visits</span>
                  <span className="font-bold text-2xl" style={{ color: accentColor }}>{clientInfo.currentVisits}/{clientInfo.requiredVisits}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <a href={'/#/card?token=' + clientInfo.token}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-200 transition text-center no-underline">
                👁️ View Card
              </a>
              {clientInfo.mobile && (
                <a href={'viber://forward?text=' + encodeURIComponent('Here is your loyalty card link: ' + window.location.origin + '/#/card?token=' + clientInfo.token)}
                  className="flex items-center justify-center gap-2 text-white py-3 rounded-2xl font-semibold text-sm hover:shadow-md transition text-center no-underline"
                  style={{ backgroundColor: '#7360F2' }}>
                  💬 Send via Viber
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={cancelSearch}
                className="bg-gray-100 text-gray-600 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition">Cancel</button>
              <button onClick={confirmAddStamp} disabled={loading}
                className="text-white py-4 rounded-2xl font-bold transition-all duration-200 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: accentColor }}>
                {loading ? '⏳ Adding…' : '✓ Add Stamp'}
              </button>
            </div>
          </div>
        )}

        {/* Message Toast */}
        {message && (
          <div className={'mt-6 p-4 rounded-2xl text-center font-semibold text-sm animate-slide-up ' +
            (message.indexOf('🎉') > -1 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-800 border border-orange-200'
            : (message.indexOf('✅') > -1 || message.indexOf('Stamp added') > -1 || message.indexOf('SUCCESS') > -1) ? 'bg-green-50 text-green-800 border border-green-200'
            : message.indexOf('found') > -1 || message.indexOf('selected') > -1 || message.indexOf('Found') > -1 ? 'bg-blue-50 text-blue-800 border border-blue-200'
            : message.indexOf('Please') > -1 ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            : 'bg-red-50 text-red-800 border border-red-200')
          }>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default StaffPanel;
