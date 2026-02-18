import React, { useState, useEffect } from 'react';

function PortalPage() {
  var _a = useState(null), businessInfo = _a[0], setBusinessInfo = _a[1];
  var _b = useState(''), searchInput = _b[0], setSearchInput = _b[1];
  var _c = useState(false), loading = _c[0], setLoading = _c[1];
  var _d = useState(''), error = _d[0], setError = _d[1];
  var _e = useState(null), foundToken = _e[0], setFoundToken = _e[1];

  useEffect(function() {
    fetch('/api/get-business-info')
      .then(function(r) { return r.json(); })
      .then(function(data) { setBusinessInfo(data); })
      .catch(function() {});
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setLoading(true);
    setError('');
    setFoundToken(null);

    // Try as token first
    fetch('/api/client-dashboard?token=' + encodeURIComponent(searchInput.trim()))
      .then(function(r) {
        if (r.ok) return r.json();
        return null;
      })
      .then(function(data) {
        if (data && data.client) {
          // Found by token — redirect to card
          window.location.hash = '/card?token=' + data.client.token;
          return;
        }
        // Not a token — try searching by email
        return fetch('/api/find-client-by-email?email=' + encodeURIComponent(searchInput.trim()))
          .then(function(r) { return r.json(); });
      })
      .then(function(data) {
        if (!data) return;
        if (data.token) {
          window.location.hash = '/card?token=' + data.token;
        } else if (data.error) {
          setError(data.error);
        } else {
          setError('No card found. Please check your email or token and try again.');
        }
      })
      .catch(function() {
        setError('Something went wrong. Please try again.');
      })
      .finally(function() { setLoading(false); });
  }

  var accentColor = (businessInfo && businessInfo.accentColor) || '#17BEBB';
  var borderColor = (businessInfo && businessInfo.borderColor) || '#1F3A93';
  var bgColor = (businessInfo && businessInfo.backgroundColor) || '#1a1a2e';
  var logo = businessInfo && businessInfo.logo;
  var businessName = (businessInfo && businessInfo.businessName) || 'Loyalty';

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: bgColor }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-60 h-60 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: accentColor }}></div>
        <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: borderColor }}></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            {logo ? (
              <img src={logo} alt={businessName} className="h-16 mx-auto mb-3"
                onError={function(e) { e.target.style.display = 'none'; }} />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
                style={{ backgroundColor: accentColor }}>
                <span style={{ fontSize: '28px' }}>💳</span>
              </div>
            )}
            <h1 className="text-2xl font-black mb-1" style={{ color: borderColor }}>My Loyalty Card</h1>
            <p className="text-gray-500 text-sm">Enter your email or token to access your card</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={searchInput}
              onChange={function(e) { setSearchInput(e.target.value); setError(''); }}
              placeholder="Email address or token..."
              className="w-full px-5 py-4 rounded-2xl border-2 focus:outline-none text-sm mb-4"
              style={{ borderColor: accentColor + '40' }}
              autoFocus
            />

            <button type="submit" disabled={loading || !searchInput.trim()}
              className="w-full text-white py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: accentColor }}>
              {loading ? (
                <span>
                  <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" style={{ verticalAlign: 'middle' }}></span>
                  Searching...
                </span>
              ) : (
                'Find My Card'
              )}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-center">
              <p className="text-red-600 text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Help text */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-xs">Don't have a card yet?</p>
            <a href="/#/register" className="text-sm font-bold no-underline" style={{ color: accentColor }}>Register here →</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortalPage;
