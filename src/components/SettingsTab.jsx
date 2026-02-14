import React, { useState, useEffect } from 'react';

function SettingsTab() {
  var _a = useState(null), businessInfo = _a[0], setBusinessInfo = _a[1];
  var _b = useState([]), coupons = _b[0], setCoupons = _b[1];
  var _c = useState(false), saving = _c[0], setSaving = _c[1];
  var _d = useState(''), toast = _d[0], setToast = _d[1];
  var _e = useState('coupons'), activeSection = _e[0], setActiveSection = _e[1];

  // Editable fields
  var _f = useState({}), fields = _f[0], setFields = _f[1];

  // New coupon form
  var _g = useState({ clientID: '', type: 'reward', text: '', expiryDate: '', notes: '' }),
    newCoupon = _g[0], setNewCoupon = _g[1];

  // All clients for coupon assignment
  var _h = useState([]), clients = _h[0], setClients = _h[1];

  useEffect(function() {
    // Load business info
    fetch('/api/get-business-info')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        setBusinessInfo(data);
        setFields({
          businessName: data.businessName || '',
          tagline: data.tagline || '',
          logo: data.logo || '',
          stampsRequired: data.stampsRequired || 10,
          rewardDescription: data.rewardDescription || '',
          progressText: data.progressText || '',
          milestone1Label: data.milestone1Label || '',
          milestone2Label: data.milestone2Label || '',
          milestone1Description: data.milestone1Description || '',
          milestone2Description: data.milestone2Description || '',
          chatLabel: data.chatLabel || '',
          chatLink: data.chatLink || '',
          supportText: data.supportText || '',
          adImageUrl: data.adImageUrl || '',
          navButton1Text: data.navButton1Text || '',
          navButton2Text: data.navButton2Text || '',
          navButton3Text: data.navButton3Text || '',
          milestone1Position: data.milestone1Position || 0,
          milestone2Position: data.milestone2Position || 0,
          milestone1Icon: data.milestone1Icon || '🎁',
          milestone2Icon: data.milestone2Icon || '🏆',
          stampFilledIcon: data.stampFilledIcon || '✓',
        });
      })
      .catch(function(err) { console.error(err); });

    // Load coupons
    fetch('/api/manage-coupons')
      .then(function(r) { return r.json(); })
      .then(function(data) { setCoupons(data.coupons || []); })
      .catch(function(err) { console.error(err); });

    // Load clients
    fetch('/api/get-all-clients')
      .then(function(r) { return r.json(); })
      .then(function(data) { setClients(data.clients || []); })
      .catch(function(err) { console.error(err); });
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(function() { setToast(''); }, 3000);
  }

  function updateField(key, value) {
    var updated = Object.assign({}, fields);
    updated[key] = value;
    setFields(updated);
  }

  function saveSettings(fieldsToSave) {
    setSaving(true);
    var payload = {};
    if (fieldsToSave) {
      for (var i = 0; i < fieldsToSave.length; i++) {
        payload[fieldsToSave[i]] = fields[fieldsToSave[i]];
      }
    } else {
      payload = Object.assign({}, fields);
    }

    fetch('/api/update-business-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) showToast('Settings saved!');
        else showToast('Error: ' + (data.error || 'Unknown'));
      })
      .catch(function(err) { showToast('Error: ' + err.message); })
      .finally(function() { setSaving(false); });
  }

  function addCoupon() {
    if (!newCoupon.text.trim()) { showToast('Coupon text is required'); return; }
    setSaving(true);
    fetch('/api/manage-coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCoupon),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          showToast('Coupon created!');
          setNewCoupon({ clientID: '', type: 'reward', text: '', expiryDate: '', notes: '' });
          // Reload coupons
          return fetch('/api/manage-coupons').then(function(r) { return r.json(); });
        }
      })
      .then(function(data) { if (data) setCoupons(data.coupons || []); })
      .catch(function(err) { showToast('Error: ' + err.message); })
      .finally(function() { setSaving(false); });
  }

  function deleteCoupon(rowIndex) {
    if (!confirm('Remove this coupon?')) return;
    fetch('/api/manage-coupons?row=' + rowIndex, { method: 'DELETE' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          showToast('Coupon removed');
          return fetch('/api/manage-coupons').then(function(r) { return r.json(); });
        }
      })
      .then(function(data) { if (data) setCoupons(data.coupons || []); })
      .catch(function(err) { showToast('Error: ' + err.message); });
  }

  var accentColor = (businessInfo && businessInfo.accentColor) || '#7f5af0';
  var borderColor = (businessInfo && businessInfo.borderColor) || '#1a1a2e';

  var sections = [
    { key: 'coupons', label: '🎁 Coupons' },
    { key: 'rewards', label: '⭐ Rewards' },
    { key: 'business', label: '🏢 Business' },
    { key: 'contact', label: '💬 Contact' },
  ];

  function renderInput(label, fieldKey, placeholder, type) {
    return (
      <div className="mb-4">
        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
        <input
          type={type || 'text'}
          value={fields[fieldKey] || ''}
          onChange={function(e) { updateField(fieldKey, e.target.value); }}
          placeholder={placeholder || ''}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none text-sm"
          style={{ borderColor: 'rgba(0,0,0,0.1)' }}
        />
      </div>
    );
  }

  var activeCoupons = coupons.filter(function(c) { return c.redeemed !== 'TRUE'; });
  var redeemedCoupons = coupons.filter(function(c) { return c.redeemed === 'TRUE'; });

  return (
    <div className="animate-fade-in">
      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {sections.map(function(s) {
          return (
            <button key={s.key} onClick={function() { setActiveSection(s.key); }}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                backgroundColor: activeSection === s.key ? accentColor : '#f3f4f6',
                color: activeSection === s.key ? 'white' : '#6b7280'
              }}>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ═══ COUPONS SECTION ═══ */}
      {activeSection === 'coupons' && (
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ color: borderColor }}>Manage Coupons</h3>

          {/* Add New Coupon */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
            <h4 className="font-bold text-sm mb-4" style={{ color: borderColor }}>Add New Coupon</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Assign to Client</label>
                <select value={newCoupon.clientID}
                  onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { clientID: e.target.value })); }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm bg-white">
                  <option value="">All clients (global)</option>
                  {clients.map(function(c) {
                    return <option key={c.token} value={c.clientID || c.token}>{c.name} ({c.token})</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Type</label>
                <select value={newCoupon.type}
                  onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { type: e.target.value })); }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm bg-white">
                  <option value="reward">Reward</option>
                  <option value="discount">Discount</option>
                  <option value="freebie">Freebie</option>
                  <option value="promo">Promo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Coupon Text</label>
                <input type="text" value={newCoupon.text}
                  onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { text: e.target.value })); }}
                  placeholder="e.g. 20% OFF next visit"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Expiry Date</label>
                <input type="date" value={newCoupon.expiryDate}
                  onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { expiryDate: e.target.value })); }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Notes</label>
              <input type="text" value={newCoupon.notes}
                onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { notes: e.target.value })); }}
                placeholder="Optional notes"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm" />
            </div>
            <button onClick={addCoupon} disabled={saving}
              className="mt-4 px-6 py-3 text-white rounded-xl font-bold text-sm hover:shadow-lg transition disabled:opacity-50"
              style={{ backgroundColor: accentColor }}>
              {saving ? 'Creating...' : '+ Add Coupon'}
            </button>
          </div>

          {/* Active Coupons */}
          <h4 className="font-bold text-sm mb-3" style={{ color: borderColor }}>
            Active Coupons ({activeCoupons.length})
          </h4>
          {activeCoupons.length === 0 ? (
            <p className="text-gray-400 text-sm mb-6">No active coupons</p>
          ) : (
            <div className="space-y-2 mb-6">
              {activeCoupons.map(function(c) {
                var clientName = '';
                for (var i = 0; i < clients.length; i++) {
                  if (clients[i].clientID === c.clientID || clients[i].token === c.clientID) {
                    clientName = clients[i].name;
                    break;
                  }
                }
                return (
                  <div key={c.rowIndex} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
                    <div>
                      <p className="font-bold text-sm" style={{ color: borderColor }}>{c.text}</p>
                      <p className="text-xs text-gray-400">
                        {c.type} · {clientName || c.clientID || 'All clients'}
                        {c.expiryDate ? ' · Expires ' + c.expiryDate : ''}
                      </p>
                    </div>
                    <button onClick={function() { deleteCoupon(c.rowIndex); }}
                      className="text-red-400 hover:text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Redeemed */}
          {redeemedCoupons.length > 0 && (
            <div>
              <h4 className="font-bold text-sm mb-3 text-gray-400">Redeemed ({redeemedCoupons.length})</h4>
              <div className="space-y-2">
                {redeemedCoupons.map(function(c) {
                  return (
                    <div key={c.rowIndex} className="bg-gray-50 rounded-xl p-4 opacity-60">
                      <p className="font-bold text-sm text-gray-500 line-through">{c.text}</p>
                      <p className="text-xs text-gray-400">{c.type} · Redeemed {c.redeemedAt || ''}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ REWARDS SECTION ═══ */}
      {activeSection === 'rewards' && (
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ color: borderColor }}>Reward Settings</h3>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {renderInput('Required Visits for Reward', 'stampsRequired', '10', 'number')}
            {renderInput('Default Reward Text', 'rewardDescription', 'Free grooming session')}
            {renderInput('Progress Message', 'progressText', 'Track your visits and earn rewards!')}

            <h4 className="font-bold text-sm mt-6 mb-3" style={{ color: borderColor }}>Milestone 1 (Mid-reward)</h4>
            {renderInput('Position (visit #, 0 = auto halfway)', 'milestone1Position', '5', 'number')}
            {renderInput('Label', 'milestone1Label', '10% OFF')}
            {renderInput('Description', 'milestone1Description', '5th visit reward')}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {['🎁', '⭐', '🎉', '🔥', '💎', '🌟', '🎯', '🏅', '🎊', '💝', '🐾', '🦴'].map(function(emoji) {
                  return (
                    <button key={emoji} onClick={function() { updateField('milestone1Icon', emoji); }}
                      className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: fields.milestone1Icon === emoji ? accentColor + '20' : '#f3f4f6',
                        border: fields.milestone1Icon === emoji ? '2px solid ' + accentColor : '2px solid transparent'
                      }}>
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            <h4 className="font-bold text-sm mt-6 mb-3" style={{ color: borderColor }}>Milestone 2 (Final reward)</h4>
            {renderInput('Position (visit #, 0 = auto last)', 'milestone2Position', '10', 'number')}
            {renderInput('Label', 'milestone2Label', 'FREE SERVICE')}
            {renderInput('Description', 'milestone2Description', '10th visit reward')}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {['🏆', '👑', '🎁', '💎', '⭐', '🌟', '🎯', '🏅', '🎊', '💝', '🐾', '🦴'].map(function(emoji) {
                  return (
                    <button key={emoji} onClick={function() { updateField('milestone2Icon', emoji); }}
                      className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: fields.milestone2Icon === emoji ? accentColor + '20' : '#f3f4f6',
                        border: fields.milestone2Icon === emoji ? '2px solid ' + accentColor : '2px solid transparent'
                      }}>
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            <h4 className="font-bold text-sm mt-6 mb-3" style={{ color: borderColor }}>Stamp Icon (filled)</h4>
            <div className="mb-4">
              <div className="flex gap-2 flex-wrap">
                {['✓', '⭐', '🐾', '❤️', '✨', '🔥', '💎', '🌸', '🦴', '🎵', '☕', '🍕'].map(function(emoji) {
                  return (
                    <button key={emoji} onClick={function() { updateField('stampFilledIcon', emoji); }}
                      className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: fields.stampFilledIcon === emoji ? accentColor + '20' : '#f3f4f6',
                        border: fields.stampFilledIcon === emoji ? '2px solid ' + accentColor : '2px solid transparent'
                      }}>
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={function() { saveSettings(['stampsRequired', 'rewardDescription', 'progressText', 'milestone1Label', 'milestone1Description', 'milestone2Label', 'milestone2Description', 'milestone1Position', 'milestone2Position', 'milestone1Icon', 'milestone2Icon', 'stampFilledIcon']); }}
              disabled={saving}
              className="mt-2 px-6 py-3 text-white rounded-xl font-bold text-sm hover:shadow-lg transition disabled:opacity-50"
              style={{ backgroundColor: accentColor }}>
              {saving ? 'Saving...' : 'Save Reward Settings'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ BUSINESS SECTION ═══ */}
      {activeSection === 'business' && (
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ color: borderColor }}>Business Profile</h3>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {renderInput('Business Name', 'businessName', 'Urban Doggies')}
            {renderInput('Tagline', 'tagline', 'Digital Loyalty System')}
            {renderInput('Logo URL', 'logo', 'https://...')}
            {renderInput('Ad/Promo Image URL', 'adImageUrl', 'https://...')}
            <h4 className="font-bold text-sm mt-6 mb-3" style={{ color: borderColor }}>Card Navigation Labels</h4>
            {renderInput('Tab 1 Label', 'navButton1Text', 'Date Stamp')}
            {renderInput('Tab 2 Label', 'navButton2Text', 'Rewards')}
            {renderInput('Tab 3 Label', 'navButton3Text', 'Contact')}
            <button onClick={function() { saveSettings(['businessName', 'tagline', 'logo', 'adImageUrl', 'navButton1Text', 'navButton2Text', 'navButton3Text']); }}
              disabled={saving}
              className="mt-2 px-6 py-3 text-white rounded-xl font-bold text-sm hover:shadow-lg transition disabled:opacity-50"
              style={{ backgroundColor: accentColor }}>
              {saving ? 'Saving...' : 'Save Business Profile'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ CONTACT SECTION ═══ */}
      {activeSection === 'contact' && (
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ color: borderColor }}>Contact Info</h3>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {renderInput('Chat Label', 'chatLabel', 'Message via Viber')}
            {renderInput('Chat Link / Number', 'chatLink', 'viber://chat?number=%2B6312345678')}
            {renderInput('Support Text', 'supportText', "We'd love to hear from you")}
            <button onClick={function() { saveSettings(['chatLabel', 'chatLink', 'supportText']); }}
              disabled={saving}
              className="mt-2 px-6 py-3 text-white rounded-xl font-bold text-sm hover:shadow-lg transition disabled:opacity-50"
              style={{ backgroundColor: accentColor }}>
              {saving ? 'Saving...' : 'Save Contact Info'}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg font-bold text-sm text-white animate-slide-up"
          style={{ backgroundColor: toast.indexOf('Error') > -1 ? '#ef4444' : '#22c55e' }}>
          {toast}
        </div>
      )}
    </div>
  );
}

export default SettingsTab;
