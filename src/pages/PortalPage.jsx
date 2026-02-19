import React, { useState, useEffect } from 'react';

function isDark(hex) {
  if (!hex) return true;
  var c = hex.replace('#', '');
  var r = parseInt(c.substring(0, 2), 16);
  var g = parseInt(c.substring(2, 4), 16);
  var b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

function PortalPage() {
  var _a = useState(null), businessInfo = _a[0], setBusinessInfo = _a[1];
  var _b = useState('find'), activeTab = _b[0], setActiveTab = _b[1];

  // Find card state
  var _c = useState(''), searchInput = _c[0], setSearchInput = _c[1];
  var _d = useState(false), searching = _d[0], setSearching = _d[1];
  var _e = useState(''), searchError = _e[0], setSearchError = _e[1];

  // Register state
  var _f = useState({ name: '', mobile: '', email: '', birthday: '', birthdayMonth: '', customField: '' }),
    form = _f[0], setForm = _f[1];
  var _g = useState(false), submitting = _g[0], setSubmitting = _g[1];
  var _h = useState(''), regError = _h[0], setRegError = _h[1];
  var _i = useState(null), result = _i[0], setResult = _i[1];

  useEffect(function() {
    fetch('/api/get-business-info')
      .then(function(r) { return r.json(); })
      .then(function(data) { setBusinessInfo(data); })
      .catch(function() {});
  }, []);

  var bgColor = (businessInfo && businessInfo.backgroundColor) || '#0d0221';
  var accentColor = (businessInfo && businessInfo.accentColor) || '#0abdc6';
  var borderColor = (businessInfo && businessInfo.borderColor) || '#ea00d9';
  var bgIsDark = isDark(bgColor);
  var heroText = bgIsDark ? '#ffffff' : borderColor;
  var heroSub = bgIsDark ? 'rgba(255,255,255,0.7)' : '#6b7280';
  var customFieldLabel = (businessInfo && businessInfo.customFieldLabel) || '';
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function updateForm(key, value) {
    var updated = Object.assign({}, form);
    updated[key] = value;
    setForm(updated);
  }

  function handleSearch(e) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearching(true);
    setSearchError('');

    fetch('/api/client-dashboard?token=' + encodeURIComponent(searchInput.trim()))
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        if (data && data.client) {
          window.location.hash = '/card?token=' + data.client.token;
          return;
        }
        return fetch('/api/find-client-by-email?email=' + encodeURIComponent(searchInput.trim()))
          .then(function(r) { return r.json(); });
      })
      .then(function(data) {
        if (!data) return;
        if (data.token) {
          window.location.hash = '/card?token=' + data.token;
        } else if (data.error) {
          setSearchError(data.error);
        } else {
          setSearchError('No card found. Please check your email or token and try again.');
        }
      })
      .catch(function() { setSearchError('Something went wrong. Please try again.'); })
      .finally(function() { setSearching(false); });
  }

  function handleRegister(e) {
    e.preventDefault();
    if (!form.name.trim()) { setRegError('Name is required'); return; }
    if (!form.email.trim()) { setRegError('Email is required'); return; }
    setSubmitting(true);
    setRegError('');

    fetch('/api/register-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        birthday: form.birthday,
        birthdayMonth: form.birthdayMonth,
        customField: form.customField.trim(),
        businessID: 'BIZ_001',
      }),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) { setRegError(data.error); return; }
        setResult(data);
      })
      .catch(function() { setRegError('Something went wrong. Please try again.'); })
      .finally(function() { setSubmitting(false); });
  }

  // Success screen
  if (result) {
    return (
      <div className="min-h-screen py-8 px-4" style={{ backgroundColor: bgColor }}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-60 h-60 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: accentColor }}></div>
          <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: borderColor }}></div>
        </div>
        <div className="relative z-10 max-w-md mx-auto">
          <div className="glass-card rounded-3xl p-8 shadow-2xl text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-black mb-2" style={{ color: borderColor }}>Thank You, {result.client.name}!</h1>
            <p className="text-gray-500 mb-6">Your registration has been submitted.</p>
            <div className="rounded-2xl p-5 mb-6" style={{ backgroundColor: accentColor + '10', border: '2px solid ' + accentColor + '20' }}>
              <p className="font-bold text-lg mb-1" style={{ color: borderColor }}>⏳ Pending Approval</p>
              <p className="text-sm text-gray-500">Please show this screen to the staff at the counter to activate your loyalty card.</p>
            </div>
            <div className="bg-white rounded-2xl p-4 mb-4 border shadow-sm" style={{ borderColor: accentColor + '30' }}>
              <p className="text-xs text-gray-400 mb-1">Your token</p>
              <p className="font-mono font-bold text-2xl tracking-widest" style={{ color: accentColor }}>{result.client.token}</p>
            </div>
            <p className="text-xs text-gray-400 mb-2">Once approved, your card link will be sent to your email.</p>
            <p className="text-xs text-gray-400">You can also scan this QR code anytime to find your card.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: bgColor }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-60 h-60 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: accentColor }}></div>
        <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: borderColor }}></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          {businessInfo && businessInfo.logo ? (
            <img src={businessInfo.logo} alt={businessInfo.businessName}
              className="h-20 w-auto mx-auto mb-3"
              onError={function(e) { e.target.style.display = 'none'; }} />
          ) : (
            <h1 className="text-3xl font-black tracking-tight" style={{ color: heroText }}>
              {(businessInfo && businessInfo.businessName) || 'Business'}
            </h1>
          )}
          <p className="font-light" style={{ color: heroSub }}>
            {(businessInfo && businessInfo.tagline) || 'Digital Loyalty Program'}
          </p>
        </div>

        {/* Tab Card */}
        <div className="glass-card rounded-3xl shadow-2xl overflow-hidden">
          <div className="flex">
            <button onClick={function() { setActiveTab('find'); }}
              className="flex-1 py-4 text-center font-bold text-sm transition-all"
              style={{
                backgroundColor: activeTab === 'find' ? accentColor : 'transparent',
                color: activeTab === 'find' ? '#ffffff' : (bgIsDark ? '#ffffff80' : '#6b7280'),
              }}>
              💳 Find My Card
            </button>
            <button onClick={function() { setActiveTab('register'); }}
              className="flex-1 py-4 text-center font-bold text-sm transition-all"
              style={{
                backgroundColor: activeTab === 'register' ? accentColor : 'transparent',
                color: activeTab === 'register' ? '#ffffff' : (bgIsDark ? '#ffffff80' : '#6b7280'),
              }}>
              ✨ Register
            </button>
          </div>

          <div className="p-8">
            {/* Find My Card */}
            {activeTab === 'find' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
                    style={{ backgroundColor: accentColor }}>
                    <span style={{ fontSize: '24px' }}>🔍</span>
                  </div>
                  <h2 className="text-lg font-bold" style={{ color: borderColor }}>Access Your Card</h2>
                  <p className="text-gray-500 text-xs mt-1">Enter your email or token</p>
                </div>

                <form onSubmit={handleSearch}>
                  <input type="text" value={searchInput}
                    onChange={function(e) { setSearchInput(e.target.value); setSearchError(''); }}
                    placeholder="Email address or token..."
                    className="w-full px-5 py-4 rounded-2xl border-2 focus:outline-none text-sm mb-4"
                    style={{ borderColor: accentColor + '40' }}
                    autoFocus />
                  <button type="submit" disabled={searching || !searchInput.trim()}
                    className="w-full text-white py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: accentColor }}>
                    {searching ? (
                      <span>
                        <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" style={{ verticalAlign: 'middle' }}></span>
                        Searching...
                      </span>
                    ) : 'Find My Card'}
                  </button>
                </form>

                {searchError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                    <p className="text-red-600 text-sm font-semibold">{searchError}</p>
                  </div>
                )}

                <p className="text-xs text-gray-400 text-center mt-5">
                  Don't have a card yet?{' '}
                  <button onClick={function() { setActiveTab('register'); }}
                    className="font-bold border-0 bg-transparent cursor-pointer"
                    style={{ color: accentColor }}>Register here →</button>
                </p>
              </div>
            )}

            {/* Register */}
            {activeTab === 'register' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
                    style={{ backgroundColor: accentColor }}>
                    <span style={{ fontSize: '24px' }}>✨</span>
                  </div>
                  <h2 className="text-lg font-bold" style={{ color: borderColor }}>Join Our Loyalty Program</h2>
                  <p className="text-gray-500 text-xs mt-1">Sign up and start earning rewards!</p>
                </div>

                <form onSubmit={handleRegister}>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input type="text" value={form.name}
                      onChange={function(e) { updateForm('name', e.target.value); }}
                      placeholder="Your name"
                      className="w-full px-4 py-3.5 rounded-xl border-2 focus:outline-none text-sm"
                      style={{ borderColor: accentColor + '40' }}
                      required />
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mobile Number</label>
                    <input type="tel" value={form.mobile}
                      onChange={function(e) { updateForm('mobile', e.target.value); }}
                      placeholder="09XX XXX XXXX"
                      className="w-full px-4 py-3.5 rounded-xl border-2 focus:outline-none text-sm"
                      style={{ borderColor: accentColor + '40' }} />
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Email <span className="text-red-400">*</span></label>
                    <input type="email" value={form.email} required
                      onChange={function(e) { updateForm('email', e.target.value); }}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3.5 rounded-xl border-2 focus:outline-none text-sm"
                      style={{ borderColor: accentColor + '40' }} />
                    <p className="text-xs mt-1.5" style={{ color: accentColor }}>📧 Your loyalty card link will be sent to this email</p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Birthday Month</label>
                    <select value={form.birthdayMonth}
                      onChange={function(e) { updateForm('birthdayMonth', e.target.value); }}
                      className="w-full px-4 py-3.5 rounded-xl border-2 focus:outline-none text-sm bg-white"
                      style={{ borderColor: accentColor + '40' }}>
                      <option value="">Select month</option>
                      {months.map(function(m) { return <option key={m} value={m}>{m}</option>; })}
                    </select>
                  </div>

                  {customFieldLabel && (
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{customFieldLabel}</label>
                      <input type="text" value={form.customField}
                        onChange={function(e) { updateForm('customField', e.target.value); }}
                        placeholder={'Enter ' + customFieldLabel.toLowerCase()}
                        className="w-full px-4 py-3.5 rounded-xl border-2 focus:outline-none text-sm"
                        style={{ borderColor: accentColor + '40' }} />
                    </div>
                  )}

                  {regError && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold text-center">
                      {regError}
                    </div>
                  )}

                  <button type="submit" disabled={submitting}
                    className="w-full text-white py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-lg disabled:opacity-50"
                    style={{ backgroundColor: accentColor }}>
                    {submitting ? 'Creating your card...' : '🎁 Join & Get My Card'}
                  </button>
                </form>

                <p className="text-xs text-gray-400 text-center mt-4">
                  Already have a card?{' '}
                  <button onClick={function() { setActiveTab('find'); }}
                    className="font-bold border-0 bg-transparent cursor-pointer"
                    style={{ color: accentColor }}>Find it here →</button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortalPage;
