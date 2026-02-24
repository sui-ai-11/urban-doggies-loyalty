import React, { useState, useEffect } from 'react';
import { Search, UserPlus, CreditCard, Sparkles } from 'lucide-react';

function isDark(hex) {
  if (!hex) return true;
  var c = hex.replace('#', '');
  return (0.299 * parseInt(c.substring(0,2),16) + 0.587 * parseInt(c.substring(2,4),16) + 0.114 * parseInt(c.substring(4,6),16)) / 255 < 0.5;
}

export default function PortalPage() {
  var _a = useState(null), businessInfo = _a[0], setBusinessInfo = _a[1];
  var _b = useState('find'), activeTab = _b[0], setActiveTab = _b[1];
  var _c = useState(''), searchInput = _c[0], setSearchInput = _c[1];
  var _d = useState(false), searching = _d[0], setSearching = _d[1];
  var _e = useState(''), searchError = _e[0], setSearchError = _e[1];
  var _f = useState({ firstName: '', lastName: '', mobile: '', email: '', birthday: '', birthdayMonth: '', customField: '' }), form = _f[0], setForm = _f[1];
  var _g = useState(false), submitting = _g[0], setSubmitting = _g[1];
  var _h = useState(''), regError = _h[0], setRegError = _h[1];
  var _i = useState(null), result = _i[0], setResult = _i[1];

  useEffect(function() {
    fetch('/api/get-business-info').then(function(r) { return r.json(); }).then(function(data) { setBusinessInfo(data); }).catch(function() {});
  }, []);

  var bgColor = (businessInfo && businessInfo.backgroundColor) || '#16161a';
  var accentColor = (businessInfo && businessInfo.accentColor) || '#7f5af0';
  var borderColor = (businessInfo && businessInfo.borderColor) || '#fffffe';
  var btnOnAccent = isDark(accentColor) ? '#ffffff' : '#1a1a2e';
  var bgIsDark = isDark(bgColor);
  // Smart heading color: must be readable on glass card (~white bg)
  var headingColor = (function() {
    if (!isDark(borderColor)) return '#1a1a2e';
    // Check contrast of borderColor against white
    var c = borderColor.replace('#','');
    var r = parseInt(c.substring(0,2),16)/255, g = parseInt(c.substring(2,4),16)/255, b = parseInt(c.substring(4,6),16)/255;
    r = r <= 0.03928 ? r/12.92 : Math.pow((r+0.055)/1.055, 2.4);
    g = g <= 0.03928 ? g/12.92 : Math.pow((g+0.055)/1.055, 2.4);
    b = b <= 0.03928 ? b/12.92 : Math.pow((b+0.055)/1.055, 2.4);
    var lumBorder = 0.2126*r + 0.7152*g + 0.0722*b;
    var contrast = (1.05) / (lumBorder + 0.05);
    return contrast >= 4.5 ? borderColor : '#1a1a2e';
  })();
  var heroText = bgIsDark ? '#ffffff' : headingColor;
  var heroSub = bgIsDark ? 'rgba(255,255,255,0.7)' : '#6b7280';
  var linkColor = isDark(accentColor) ? accentColor : '#1a1a2e';
  var customFieldLabel = (businessInfo && businessInfo.customFieldLabel) || '';
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function updateForm(key, value) { var u = Object.assign({}, form); u[key] = value; setForm(u); }

  function handleSearch(e) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearching(true); setSearchError('');
    var input = searchInput.trim();
    fetch('/api/client-dashboard?token=' + encodeURIComponent(input))
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        if (data && data.client) { window.location.hash = '/card?token=' + data.client.token; return; }
        var isEmail = input.indexOf('@') > -1;
        var query = isEmail ? 'email=' + encodeURIComponent(input) : 'mobile=' + encodeURIComponent(input);
        return fetch('/api/find-client-by-email?' + query).then(function(r) { return r.json(); });
      })
      .then(function(data) {
        if (!data) return;
        if (data.token) { window.location.hash = '/card?token=' + data.token; }
        else if (data.error) { setSearchError(data.error); }
        else { setSearchError('No card found. Please check your token, email, or mobile number.'); }
      })
      .catch(function() { setSearchError('Something went wrong. Please try again.'); })
      .finally(function() { setSearching(false); });
  }

  function handleRegister(e) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) { setRegError('First name and last name are required'); return; }
    if (!form.mobile.trim()) { setRegError('Mobile number is required'); return; }
    if (!form.birthdayMonth) { setRegError('Birthday month is required'); return; }
    setSubmitting(true); setRegError('');
    fetch('/api/register-client', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.firstName.trim() + ' ' + form.lastName.trim(), mobile: form.mobile.trim(), email: form.email.trim(), birthday: form.birthday, birthdayMonth: form.birthdayMonth, customField: form.customField.trim(), businessID: 'BIZ_001' }),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) { if (data.error) { setRegError(data.error); return; } setResult(data); })
      .catch(function() { setRegError('Something went wrong. Please try again.'); })
      .finally(function() { setSubmitting(false); });
  }

  // Poll for approval status when result exists
  var _ap = useState('pending'), approvalStatus = _ap[0], setApprovalStatus = _ap[1];
  
  useEffect(function() {
    if (!result || !result.client || !result.client.token) return;
    var token = result.client.token;
    var interval = setInterval(function() {
      fetch('/api/client-dashboard?token=' + encodeURIComponent(token))
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(data) {
          if (data && data.client) {
            var status = (data.client.status || '').toLowerCase();
            if (status === 'approved' || status === '') {
              setApprovalStatus('approved');
              clearInterval(interval);
            } else if (status === 'rejected') {
              setApprovalStatus('rejected');
              clearInterval(interval);
            }
          }
        })
        .catch(function() {});
    }, 3000);
    return function() { clearInterval(interval); };
  }, [result]);

  if (result) {
    if (approvalStatus === 'approved') {
      return (
        <div className="min-h-screen py-8 px-4" style={{ backgroundColor: bgColor }}>
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 right-10 w-60 h-60 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: accentColor }}></div>
            <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: borderColor }}></div>
          </div>
          <div className="relative z-10 max-w-md mx-auto">
            <div className="glass-card rounded-3xl p-8 shadow-2xl text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#10b981' }}>
                <Sparkles size={28} color="#ffffff" />
              </div>
              <h1 className="text-2xl font-black mb-2" style={{ color: headingColor }}>You're In, {result.client.name}!</h1>
              <p className="text-gray-500 mb-6">Your loyalty card is ready.</p>
              <button onClick={function() { window.location.hash = '/card?token=' + result.client.token; }}
                className="w-full py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-lg flex items-center justify-center gap-2 mb-3"
                style={{ backgroundColor: accentColor, color: btnOnAccent }}>
                <CreditCard size={20} /> View My Card
              </button>
              <div className="bg-white rounded-2xl p-3 border shadow-sm" style={{ borderColor: accentColor + '30' }}>
                <p className="text-xs text-gray-400 mb-1">Your token</p>
                <p className="font-mono font-bold text-lg tracking-widest" style={{ color: linkColor }}>{result.client.token}</p>
              </div>
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
          <div className="glass-card rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#10b981' }}>
              <Sparkles size={28} color="#ffffff" />
            </div>
            <h1 className="text-2xl font-black mb-2" style={{ color: headingColor }}>Thank You, {result.client.name}!</h1>
            <p className="text-gray-500 mb-6">Your registration has been submitted.</p>
            <div className="rounded-2xl p-5 mb-6" style={{ backgroundColor: accentColor + '10', border: '2px solid ' + accentColor + '20' }}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: accentColor }}></div>
                <p className="font-bold text-lg" style={{ color: headingColor }}>Waiting for Approval</p>
              </div>
              <p className="text-sm text-gray-500">Please show this screen to the staff at the counter. This page will update automatically.</p>
            </div>
            <div className="bg-white rounded-2xl p-4 mb-4 border shadow-sm" style={{ borderColor: accentColor + '30' }}>
              <p className="text-xs text-gray-400 mb-1">Your token</p>
              <p className="font-mono font-bold text-2xl tracking-widest" style={{ color: linkColor }}>{result.client.token}</p>
            </div>
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
        <div className="text-center mb-6">
          {businessInfo && businessInfo.logo ? (
            <img src={businessInfo.logo} alt={businessInfo.businessName} className="h-20 w-auto mx-auto mb-3" onError={function(e) { e.target.style.display = 'none'; }} />
          ) : (
            <h1 className="text-3xl font-black tracking-tight" style={{ color: heroText }}>{(businessInfo && businessInfo.businessName) || 'Business'}</h1>
          )}
          <p className="font-light" style={{ color: heroSub }}>{(businessInfo && businessInfo.tagline) || 'Digital Loyalty Program'}</p>
        </div>

        <div className="glass-card rounded-3xl shadow-2xl overflow-hidden">
          <div className="flex">
            <button onClick={function() { setActiveTab('find'); }} className="flex-1 py-4 text-center font-bold text-sm transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: activeTab === 'find' ? accentColor : (accentColor + '18'), color: activeTab === 'find' ? btnOnAccent : headingColor }}>
              <CreditCard size={16} /> Find My Card
            </button>
            <button onClick={function() { setActiveTab('register'); }} className="flex-1 py-4 text-center font-bold text-sm transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: activeTab === 'register' ? accentColor : (accentColor + '18'), color: activeTab === 'register' ? btnOnAccent : headingColor }}>
              <UserPlus size={16} /> Register
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {activeTab === 'find' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg" style={{ backgroundColor: accentColor }}>
                    <Search size={24} style={{ color: btnOnAccent }} />
                  </div>
                  <h2 className="text-lg font-bold" style={{ color: headingColor }}>Access Your Card</h2>
                  <p className="text-gray-500 text-xs mt-1">Enter your token, email, or mobile number</p>
                </div>
                <form onSubmit={handleSearch}>
                  <input type="text" value={searchInput} onChange={function(e) { setSearchInput(e.target.value); setSearchError(''); }}
                    placeholder="Token, email, or mobile number..." className="w-full px-5 py-4 rounded-2xl border-2 focus:outline-none text-sm mb-4"
                    style={{ borderColor: accentColor + '40' }} autoFocus />
                  <button type="submit" disabled={searching || !searchInput.trim()}
                    className="w-full py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: accentColor, color: btnOnAccent }}>
                    {searching ? 'Searching...' : <><Search size={20} /> Find My Card</>}
                  </button>
                </form>
                {searchError && (<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-center"><p className="text-red-600 text-sm font-semibold">{searchError}</p></div>)}
                <p className="text-xs text-gray-400 text-center mt-5">
                  {"Don't have a card yet? "}
                  <button onClick={function() { setActiveTab('register'); }} className="font-bold border-0 bg-transparent cursor-pointer" style={{ color: linkColor }}>Register here</button>
                </p>
              </div>
            )}

            {activeTab === 'register' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg" style={{ backgroundColor: accentColor }}>
                    <Sparkles size={24} style={{ color: btnOnAccent }} />
                  </div>
                  <h2 className="text-lg font-bold" style={{ color: headingColor }}>Join Our Loyalty Program</h2>
                  <p className="text-gray-500 text-xs mt-1">Sign up and start earning rewards!</p>
                </div>
                <form onSubmit={handleRegister}>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">First Name <span className="text-red-400">*</span></label>
                      <input type="text" value={form.firstName} onChange={function(e) { updateForm('firstName', e.target.value); }} placeholder="First name"
                        className="w-full px-4 py-3.5 rounded-xl border-2 focus:outline-none text-sm" style={{ borderColor: accentColor + '40' }} required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Last Name <span className="text-red-400">*</span></label>
                      <input type="text" value={form.lastName} onChange={function(e) { updateForm('lastName', e.target.value); }} placeholder="Last name"
                        className="w-full px-4 py-3.5 rounded-xl border-2 focus:outline-none text-sm" style={{ borderColor: accentColor + '40' }} required />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mobile Number <span className="text-red-400">*</span></label>
                    <input type="tel" value={form.mobile} onChange={function(e) { updateForm('mobile', e.target.value); }} placeholder="09XX XXX XXXX"
                      className="w-full px-4 py-3.5 rounded-xl border-2 focus:outline-none text-sm" style={{ borderColor: accentColor + '40' }} required />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Email</label>
                    <input type="email" value={form.email} onChange={function(e) { updateForm('email', e.target.value); }} placeholder="your@email.com"
                      className="w-full px-4 py-3.5 rounded-xl border-2 focus:outline-none text-sm" style={{ borderColor: accentColor + '40' }} />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Birthday Month <span className="text-red-400">*</span></label>
                    <select value={form.birthdayMonth} onChange={function(e) { updateForm('birthdayMonth', e.target.value); }}
                      className="w-full px-4 py-3.5 rounded-xl border-2 focus:outline-none text-sm bg-white" style={{ borderColor: accentColor + '40' }} required>
                      <option value="">Select month</option>
                      {months.map(function(m) { return <option key={m} value={m}>{m}</option>; })}
                    </select>
                  </div>
                  {customFieldLabel && (
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{customFieldLabel}</label>
                      <input type="text" value={form.customField} onChange={function(e) { updateForm('customField', e.target.value); }}
                        placeholder={'Enter ' + customFieldLabel.toLowerCase()} className="w-full px-4 py-3.5 rounded-xl border-2 focus:outline-none text-sm" style={{ borderColor: accentColor + '40' }} />
                    </div>
                  )}
                  {regError && (<div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold text-center">{regError}</div>)}
                  <button type="submit" disabled={submitting}
                    className="w-full py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: accentColor, color: btnOnAccent }}>
                    {submitting ? 'Creating your card...' : <><Sparkles size={20} /> Join & Get My Card</>}
                  </button>
                </form>
                <p className="text-xs text-gray-400 text-center mt-4">
                  {"Already have a card? "}
                  <button onClick={function() { setActiveTab('find'); }} className="font-bold border-0 bg-transparent cursor-pointer" style={{ color: linkColor }}>Find it here</button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
