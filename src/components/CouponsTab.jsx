import React, { useState, useEffect } from 'react';

function CouponsTab() {
  var _a = useState([]), coupons = _a[0], setCoupons = _a[1];
  var _b = useState([]), clients = _b[0], setClients = _b[1];
  var _c = useState(null), businessInfo = _c[0], setBusinessInfo = _c[1];
  var _d = useState(false), saving = _d[0], setSaving = _d[1];
  var _e = useState(''), message = _e[0], setMessage = _e[1];
  var _f = useState({ clientID: '', type: 'reward', text: '', expiryDate: '', notes: '', birthdayMonth: '' }),
    newCoupon = _f[0], setNewCoupon = _f[1];
  var _g = useState(null), expandedGroup = _g[0], setExpandedGroup = _g[1];
  var _h = useState('all'), filterStatus = _h[0], setFilterStatus = _h[1];

  var accentColor = (businessInfo && businessInfo.accentColor) || '#17BEBB';
  var borderColor = (businessInfo && businessInfo.borderColor) || '#1F3A93';
  function isLightC(hex) { var c = (hex || '#000').replace('#',''); return (0.299*parseInt(c.substring(0,2),16) + 0.587*parseInt(c.substring(2,4),16) + 0.114*parseInt(c.substring(4,6),16))/255 > 0.6; }
  var panelText = isLightC(borderColor) ? '#1a1a2e' : borderColor;
  var panelAccent = isLightC(accentColor) ? '#1a1a2e' : accentColor;

  useEffect(function() {
    fetch('/api/get-business-info').then(function(r) { return r.json(); }).then(setBusinessInfo).catch(function() {});
    fetch('/api/get-all-clients').then(function(r) { return r.json(); }).then(function(data) { setClients(data.clients || []); }).catch(function() {});
    loadCoupons();
  }, []);

  function loadCoupons() {
    fetch('/api/manage-coupons').then(function(r) { return r.json(); }).then(function(data) { setCoupons(data.coupons || []); }).catch(function() {});
  }

  function addCoupon() {
    if (!newCoupon.text.trim()) { setMessage('❌ Coupon text is required'); return; }
    setSaving(true);
    fetch('/api/manage-coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCoupon),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          setMessage('✅ ' + (data.message || 'Coupon created'));
          setNewCoupon({ clientID: '', type: 'reward', text: '', expiryDate: '', notes: '', birthdayMonth: '' });
          loadCoupons();
        } else {
          setMessage('❌ ' + (data.error || 'Failed'));
        }
      })
      .catch(function() { setMessage('❌ Failed to create coupon'); })
      .finally(function() { setSaving(false); });
  }

  function redeemCoupon(couponID, text) {
    if (!confirm('Mark "' + text + '" as claimed?')) return;
    fetch('/api/manage-coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'redeem', couponID: couponID }),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) { setMessage('✅ Coupon claimed'); loadCoupons(); }
        else setMessage('❌ ' + (data.error || 'Failed'));
      })
      .catch(function() { setMessage('❌ Failed'); });
  }

  function deleteCoupon(rowIndex) {
    if (!confirm('Remove this coupon?')) return;
    fetch('/api/manage-coupons?row=' + rowIndex, { method: 'DELETE' })
      .then(function(r) { return r.json(); })
      .then(function() { loadCoupons(); setMessage('✅ Coupon removed'); })
      .catch(function() { setMessage('❌ Failed'); });
  }

  // Process coupons for display
  var processedCoupons = coupons.map(function(c) {
    var status = 'active';
    if (c.redeemed === 'TRUE') status = 'claimed';
    else if (c.expiryDate && new Date(c.expiryDate) < new Date()) status = 'expired';
    return Object.assign({}, c, {
      displayName: c.clientName || (c.clientID ? c.clientID : '🌐 Global'),
      status: status
    });
  });

  var activeCoupons = processedCoupons.filter(function(c) { return c.status === 'active'; });
  var claimedCoupons = processedCoupons.filter(function(c) { return c.status === 'claimed'; });
  var expiredCoupons = processedCoupons.filter(function(c) { return c.status === 'expired'; });

  var filteredCoupons = filterStatus === 'all' ? processedCoupons :
    filterStatus === 'active' ? activeCoupons :
    filterStatus === 'claimed' ? claimedCoupons : expiredCoupons;

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 tracking-tight" style={{ color: panelText }}>Coupons</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
          <p className="text-2xl font-black text-green-600">{activeCoupons.length}</p>
          <p className="text-xs font-bold text-green-500">Active</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
          <p className="text-2xl font-black text-gray-500">{claimedCoupons.length}</p>
          <p className="text-xs font-bold text-gray-400">Claimed</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
          <p className="text-2xl font-black text-red-500">{expiredCoupons.length}</p>
          <p className="text-xs font-bold text-red-400">Expired</p>
        </div>
      </div>

      {/* Issue New Coupon */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-sm mb-4" style={{ color: panelText }}>Issue New Coupon</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Assign to</label>
            <select value={newCoupon.clientID}
              onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { clientID: e.target.value })); }}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm bg-white">
              <option value="">All clients (global)</option>
              {newCoupon.type.toLowerCase() === 'birthday' && newCoupon.birthdayMonth && (
                <option value={'bday_' + newCoupon.birthdayMonth}>🎂 All {newCoupon.birthdayMonth} Celebrants ({clients.filter(function(c) { return (c.birthdayMonth || '').toLowerCase() === newCoupon.birthdayMonth.toLowerCase(); }).length})</option>
              )}
              {clients.map(function(c) {
                return <option key={c.token} value={c.clientID || c.token}>{c.name} ({c.token})</option>;
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Type</label>
            <input type="text" value={newCoupon.type}
              onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { type: e.target.value, birthdayMonth: '' })); }}
              placeholder="e.g. reward, discount, freebie, birthday"
              list="coupon-types"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm bg-white" />
            <datalist id="coupon-types">
              <option value="reward" />
              <option value="discount" />
              <option value="freebie" />
              <option value="promo" />
              <option value="birthday" />
              <option value="milestone" />
            </datalist>
          </div>
          {newCoupon.type.toLowerCase() === 'birthday' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Birthday Month</label>
              <select value={newCoupon.birthdayMonth}
                onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { birthdayMonth: e.target.value })); }}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm bg-white">
                <option value="">Select month...</option>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map(function(m) {
                  return <option key={m} value={m}>{m}</option>;
                })}
              </select>
            </div>
          )}
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
          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Claim Instructions</label>
          <input type="text" value={newCoupon.notes}
            onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { notes: e.target.value })); }}
            placeholder="e.g. Show this coupon to staff at your next visit"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm" />
        </div>
        <button onClick={addCoupon} disabled={saving}
          className="mt-4 px-6 py-3 text-white rounded-xl font-bold text-sm hover:shadow-lg transition disabled:opacity-50"
          style={{ backgroundColor: accentColor }}>
          {saving ? 'Creating...' : '+ Issue Coupon'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: 'All (' + processedCoupons.length + ')' },
          { key: 'active', label: 'Active (' + activeCoupons.length + ')' },
          { key: 'claimed', label: 'Claimed (' + claimedCoupons.length + ')' },
          { key: 'expired', label: 'Expired (' + expiredCoupons.length + ')' },
        ].map(function(tab) {
          return (
            <button key={tab.key} onClick={function() { setFilterStatus(tab.key); }}
              className="px-4 py-2 rounded-xl text-xs font-bold transition"
              style={{
                backgroundColor: filterStatus === tab.key ? accentColor : '#f3f4f6',
                color: filterStatus === tab.key ? '#fff' : '#6b7280',
              }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Coupon List */}
      {filteredCoupons.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">No coupons found</p>
      ) : (
        <div className="space-y-2">
          {filteredCoupons.map(function(c, idx) {
            return (
              <div key={idx} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm truncate" style={{ color: panelText }}>{c.text || 'Untitled'}</p>
                    <span className="text-xs text-gray-400 capitalize shrink-0">{c.type}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {c.displayName}{c.expiryDate ? ' · Exp: ' + c.expiryDate : ''}{c.redeemedAt ? ' · Claimed: ' + c.redeemedAt : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={'text-xs font-bold px-2.5 py-1 rounded-full ' +
                    (c.status === 'claimed' ? 'bg-gray-100 text-gray-500' :
                     c.status === 'expired' ? 'bg-red-50 text-red-600' :
                     'bg-green-50 text-green-600')}>
                    {c.status === 'claimed' ? 'Claimed' : c.status === 'expired' ? 'Expired' : 'Active'}
                  </span>
                  {c.status === 'active' && c.clientID && (
                    <button onClick={function() { redeemCoupon(c.couponID, c.text); }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: '#10b981' }}>
                      Claim
                    </button>
                  )}
                  {c.status === 'active' && (
                    <button onClick={function() { deleteCoupon(c.rowIndex); }}
                      className="text-red-400 hover:text-red-600 text-xs font-bold px-1.5 py-1 rounded-lg hover:bg-red-50 transition">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={'mt-4 p-3 rounded-xl text-center text-sm font-semibold ' +
          (message.indexOf('✅') > -1 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200')}>
          {message}
        </div>
      )}
    </div>
  );
}

export default CouponsTab;
