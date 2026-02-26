import React, { useState, useEffect } from 'react';

function isDark(hex) {
  if (!hex) return true;
  var c = hex.replace('#', '');
  var r = parseInt(c.substring(0, 2), 16);
  var g = parseInt(c.substring(2, 4), 16);
  var b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

function RegisterPage() {
  var _a = useState(null), businessInfo = _a[0], setBusinessInfo = _a[1];
  var _b = useState({ name: '', mobile: '', email: '', birthday: '', birthdayMonth: '', customField: '' }),
    form = _b[0], setForm = _b[1];
  var _c = useState(false), submitting = _c[0], setSubmitting = _c[1];
  var _d = useState(''), error = _d[0], setError = _d[1];
  var _e = useState(null), result = _e[0], setResult = _e[1];

  useEffect(function() {
    fetch('/api/get-business-info')
      .then(function(r) { return r.json(); })
      .then(function(data) { setBusinessInfo(data); })
      .catch(function(err) { console.error(err); });
  }, []);

  function updateForm(key, value) {
    var updated = Object.assign({}, form);
    updated[key] = value;
    setForm(updated);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSubmitting(true);
    setError('');

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
        if (data.error) { setError(data.error); return; }
        setResult(data);
      })
      .catch(function(err) { setError('Something went wrong. Please try again.'); })
      .finally(function() { setSubmitting(false); });
  }

  var bgColor = (businessInfo && businessInfo.backgroundColor) || '#16161a';
  var accentColor = (businessInfo && businessInfo.accentColor) || '#7f5af0';
  var borderColor = (businessInfo && businessInfo.borderColor) || '#fffffe';
  var btnOnAccent = isDark(accentColor) ? '#ffffff' : '#1a1a2e';
  var cardBg = (businessInfo && businessInfo.cardBackground) || '#150734';
  var bgIsDark = isDark(bgColor);
  var headingColor = (function() {
    if (!isDark(borderColor)) return '#1a1a2e';
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
  var customFieldLabel = (businessInfo && businessInfo.customFieldLabel) || '';

  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Success — show pending confirmation
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
            <h1 className="text-2xl font-black mb-2" style={{ color: headingColor }}>Thank You, {result.client.name}!</h1>
            <p className="text-gray-500 mb-6">Your registration has been submitted.</p>

            <div className="rounded-2xl p-5 mb-6" style={{ backgroundColor: accentColor + '10', border: '2px solid ' + accentColor + '20' }}>
              <p className="font-bold text-lg mb-1" style={{ color: headingColor }}>⏳ Pending Approval</p>
              <p className="text-sm text-gray-500">Please show this screen to the staff at the counter to activate your loyalty card.</p>
            </div>

            <div className="bg-white rounded-2xl p-4 mb-6 border shadow-sm" style={{ borderColor: accentColor + '30' }}>
              <p className="text-xs text-gray-400 mb-1">Your token</p>
              <p className="font-mono font-bold text-2xl tracking-widest" style={{ color: accentColor }}>{result.client.token}</p>
            </div>

            <p className="text-xs text-gray-400">Once approved, you can access your loyalty card anytime at:</p>
            <a href="/#/portal" className="inline-block mt-2 px-4 py-2 rounded-xl text-sm font-bold no-underline"
              style={{ backgroundColor: accentColor + '15', color: accentColor }}>
              💳 Customer Portal
            </a>
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
            {(businessInfo && businessInfo.tagline) || 'Join our loyalty program'}
          </p>
        </div>

        {/* Form */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
              style={{ backgroundColor: accentColor }}>
              <span style={{ fontSize: '28px' }}>✨</span>
            </div>
            <h2 className="text-xl font-bold" style={{ color: headingColor }}>Join Our Loyalty Program</h2>
            <p className="text-gray-500 text-sm mt-1">Sign up and start earning rewards!</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Name - required */}
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

            {/* Mobile */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mobile Number</label>
              <input type="tel" value={form.mobile}
                onChange={function(e) { updateForm('mobile', e.target.value); }}
                placeholder="09XX XXX XXXX"
                className="w-full px-4 py-3.5 rounded-xl border-2 focus:outline-none text-sm"
                style={{ borderColor: accentColor + '40' }} />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Email *</label>
              <input type="email" value={form.email} required
                onChange={function(e) { updateForm('email', e.target.value); }}
                placeholder="your@email.com"
                className="w-full px-4 py-3.5 rounded-xl border-2 focus:outline-none text-sm"
                style={{ borderColor: accentColor + '40' }} />
              <p className="text-xs mt-1.5" style={{ color: accentColor }}>📧 Your loyalty card link will be sent to this email</p>
            </div>

            {/* Birthday */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Birthday</label>
              <input type="date" value={form.birthday}
                onChange={function(e) {
                  var val = e.target.value;
                  var month = '';
                  if (val) {
                    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                    month = months[parseInt(val.split('-')[1]) - 1] || '';
                  }
                  setForm(Object.assign({}, form, { birthday: val, birthdayMonth: month }));
                }}
                className="w-full px-4 py-3.5 rounded-xl border-2 focus:outline-none text-sm"
                style={{ borderColor: accentColor + '40' }} />
            </div>

            {/* Custom field — only show if business has a label for it */}
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

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold text-center">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-lg disabled:opacity-50"
              style={{ backgroundColor: accentColor, color: btnOnAccent }}>
              {submitting ? 'Creating your card...' : '🎁 Join & Get My Card'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            By signing up you agree to receive loyalty program updates.
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
