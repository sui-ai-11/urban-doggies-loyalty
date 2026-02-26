import React, { useState, useEffect } from 'react';
import { Ticket, User, Plus, Filter, Check, X, Search } from 'lucide-react';

function CouponsTab({ businessInfo: parentBiz }) {
  var _a = useState([]), coupons = _a[0], setCoupons = _a[1];
  var _b = useState([]), clients = _b[0], setClients = _b[1];
  var _c = useState(parentBiz || null), businessInfo = _c[0], setBusinessInfo = _c[1];
  var _d = useState(false), saving = _d[0], setSaving = _d[1];
  var _e = useState(''), message = _e[0], setMessage = _e[1];
  var _f = useState({ clientID: '', type: 'reward', text: '', expiryDate: '', notes: '', birthdayMonth: '' }),
    newCoupon = _f[0], setNewCoupon = _f[1];
  var _v = useState('active'), view = _v[0], setView = _v[1];
  var _sc = useState(''), selectedClient = _sc[0], setSelectedClient = _sc[1];
  var _fs = useState('all'), filterStatus = _fs[0], setFilterStatus = _fs[1];
  var _ft = useState('all'), filterType = _ft[0], setFilterType = _ft[1];
  var _cs = useState(''), clientSearch = _cs[0], setClientSearch = _cs[1];

  var accentColor = (businessInfo && businessInfo.accentColor) || '#17BEBB';
  var borderColor = (businessInfo && businessInfo.borderColor) || '#1F3A93';
  function isLightC(hex) { var c = (hex || '#000').replace('#',''); return (0.299*parseInt(c.substring(0,2),16) + 0.587*parseInt(c.substring(2,4),16) + 0.114*parseInt(c.substring(4,6),16))/255 > 0.6; }
  var panelText = isLightC(borderColor) ? '#1a1a2e' : borderColor;
  var panelAccent = isLightC(accentColor) ? '#1a1a2e' : accentColor;
  var btnOnAccent = isLightC(accentColor) ? '#1a1a2e' : '#ffffff';

  useEffect(function() {
    if (!parentBiz) fetch('/api/get-business-info').then(function(r) { return r.json(); }).then(setBusinessInfo).catch(function() {});
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

  function voidCoupon(couponID, text) {
    if (!confirm('Void "' + text + '"? This cannot be undone.')) return;
    fetch('/api/manage-coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'void', couponID: couponID }),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) { setMessage('✅ Coupon voided'); loadCoupons(); }
        else setMessage('❌ ' + (data.error || 'Failed'));
      })
      .catch(function() { setMessage('❌ Failed'); });
  }

  // Process coupons
  var processedCoupons = coupons.map(function(c) {
    var status = 'active';
    if (c.redeemed === 'VOIDED') status = 'voided';
    else if (c.redeemed === 'TRUE') status = 'claimed';
    else if (c.expiryDate && new Date(c.expiryDate) < new Date()) status = 'expired';
    return Object.assign({}, c, { status: status });
  });

  var activeCoupons = processedCoupons.filter(function(c) { return c.status === 'active'; });
  var claimedCoupons = processedCoupons.filter(function(c) { return c.status === 'claimed'; });
  var voidedCoupons = processedCoupons.filter(function(c) { return c.status === 'voided'; });

  // Get unique types
  var types = [];
  processedCoupons.forEach(function(c) { if (c.type && types.indexOf(c.type) === -1) types.push(c.type); });

  // Client lookup
  var clientMap = {};
  clients.forEach(function(c) { clientMap[c.clientID] = c; });

  // Get coupons for selected client
  var clientCoupons = selectedClient
    ? processedCoupons.filter(function(c) { return c.clientID === selectedClient; })
    : [];
  var clientActiveCoupons = clientCoupons.filter(function(c) { return c.status === 'active'; });
  var clientClaimedCoupons = clientCoupons.filter(function(c) { return c.status === 'claimed'; });

  // Filtered all-view coupons
  var allFiltered = processedCoupons;
  if (filterStatus !== 'all') allFiltered = allFiltered.filter(function(c) { return c.status === filterStatus; });
  if (filterType !== 'all') allFiltered = allFiltered.filter(function(c) { return c.type === filterType; });

  // Clients with coupons count
  var clientCouponCounts = {};
  processedCoupons.forEach(function(c) {
    if (!c.clientID) return;
    if (!clientCouponCounts[c.clientID]) clientCouponCounts[c.clientID] = { total: 0, active: 0 };
    clientCouponCounts[c.clientID].total++;
    if (c.status === 'active') clientCouponCounts[c.clientID].active++;
  });

  // Filter clients by search
  var filteredClients = clients.filter(function(c) {
    if (!clientSearch.trim()) return true;
    var q = clientSearch.toLowerCase();
    return (c.name || '').toLowerCase().indexOf(q) > -1 || (c.token || '').toLowerCase().indexOf(q) > -1;
  });

  function renderCouponRow(c) {
    var statusBadge = c.status === 'claimed' ? 'bg-gray-100 text-gray-500' :
      c.status === 'voided' ? 'bg-red-50 text-red-500' :
      c.status === 'expired' ? 'bg-orange-50 text-orange-600' :
      'bg-green-50 text-green-600';
    var statusLabel = c.status === 'claimed' ? 'Claimed' : c.status === 'voided' ? 'Voided' : c.status === 'expired' ? 'Expired' : 'Active';

    return (
      <div key={c.couponID} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="font-bold text-sm truncate" style={{ color: panelText }}>{c.text || 'Untitled'}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 capitalize shrink-0">{c.type}</span>
          </div>
          <p className="text-xs text-gray-400">
            {c.clientName || '—'}
            {c.issuedDate ? ' · ' + c.issuedDate : ''}
            {c.expiryDate ? ' · Exp: ' + c.expiryDate : ''}
            {c.notes ? ' · ' + c.notes : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={'text-xs font-bold px-2.5 py-1 rounded-full ' + statusBadge}>{statusLabel}</span>
          {c.status === 'active' && (
            <>
              <button onClick={function() { redeemCoupon(c.couponID, c.text); }}
                className="p-1.5 rounded-lg hover:bg-green-50 transition" title="Claim">
                <Check size={14} className="text-green-600" />
              </button>
              <button onClick={function() { voidCoupon(c.couponID, c.text); }}
                className="p-1.5 rounded-lg hover:bg-red-50 transition" title="Void">
                <X size={14} className="text-red-400" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-4 tracking-tight" style={{ color: panelText }}>Coupons & Rewards</h2>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
          <p className="text-xl font-black text-green-600">{activeCoupons.length}</p>
          <p className="text-xs font-bold text-green-500">Active</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
          <p className="text-xl font-black text-gray-500">{claimedCoupons.length}</p>
          <p className="text-xs font-bold text-gray-400">Claimed</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
          <p className="text-xl font-black text-red-500">{voidedCoupons.length}</p>
          <p className="text-xs font-bold text-red-400">Voided</p>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-5 border-b border-gray-200 pb-3">
        {[
          { key: 'active', label: 'All Coupons', icon: Ticket },
          { key: 'client', label: 'By Client', icon: User },
          { key: 'issue', label: 'Issue New', icon: Plus },
        ].map(function(tab) {
          var Icon = tab.icon;
          return (
            <button key={tab.key} onClick={function() { setView(tab.key); setMessage(''); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition"
              style={{
                backgroundColor: view === tab.key ? accentColor : '#f3f4f6',
                color: view === tab.key ? btnOnAccent : '#6b7280',
              }}>
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ===== ALL COUPONS VIEW ===== */}
      {view === 'active' && (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'claimed', label: 'Claimed' },
              { key: 'voided', label: 'Voided' },
            ].map(function(f) {
              return (
                <button key={f.key} onClick={function() { setFilterStatus(f.key); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  style={{
                    backgroundColor: filterStatus === f.key ? panelAccent + '15' : '#f9fafb',
                    color: filterStatus === f.key ? panelAccent : '#9ca3af',
                    border: filterStatus === f.key ? '1px solid ' + panelAccent + '30' : '1px solid #e5e7eb',
                  }}>
                  {f.label}
                </button>
              );
            })}
            <select value={filterType} onChange={function(e) { setFilterType(e.target.value); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200">
              <option value="all">All Types</option>
              {types.map(function(t) { return <option key={t} value={t}>{t}</option>; })}
            </select>
          </div>

          {allFiltered.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No coupons found</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allFiltered.map(function(c) { return renderCouponRow(c); })}
            </div>
          )}
        </div>
      )}

      {/* ===== BY CLIENT VIEW ===== */}
      {view === 'client' && (
        <div>
          {!selectedClient ? (
            <div>
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input type="text" value={clientSearch}
                  onChange={function(e) { setClientSearch(e.target.value); }}
                  placeholder="Search clients..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm" />
              </div>
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {filteredClients.map(function(c) {
                  var counts = clientCouponCounts[c.clientID] || { total: 0, active: 0 };
                  return (
                    <button key={c.clientID} onClick={function() { setSelectedClient(c.clientID); }}
                      className="w-full flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100 hover:border-gray-300 transition text-left">
                      <div>
                        <p className="font-bold text-sm" style={{ color: panelText }}>{c.name}</p>
                        <p className="text-xs text-gray-400">{c.token}{c.mobile ? ' · ' + c.mobile : ''}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {counts.active > 0 && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600">{counts.active} active</span>
                        )}
                        {counts.total > 0 && counts.active === 0 && (
                          <span className="text-xs text-gray-400">{counts.total} total</span>
                        )}
                        {counts.total === 0 && (
                          <span className="text-xs text-gray-300">No coupons</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <button onClick={function() { setSelectedClient(''); }}
                className="flex items-center gap-1.5 text-sm font-semibold mb-4 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
                style={{ color: panelAccent }}>
                ← All Clients
              </button>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
                <h3 className="font-bold text-lg" style={{ color: panelText }}>
                  {(clientMap[selectedClient] || {}).name || selectedClient}
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                  {(clientMap[selectedClient] || {}).token || ''}
                  {(clientMap[selectedClient] || {}).mobile ? ' · ' + (clientMap[selectedClient] || {}).mobile : ''}
                </p>
                <div className="flex gap-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-600">{clientActiveCoupons.length} active</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">{clientClaimedCoupons.length} claimed</span>
                  <span className="text-xs text-gray-400">{clientCoupons.length} total</span>
                </div>
              </div>
              {clientCoupons.length === 0 ? (
                <p className="text-gray-400 text-sm py-6 text-center">No coupons for this client</p>
              ) : (
                <div className="space-y-2">
                  {clientCoupons.map(function(c) { return renderCouponRow(c); })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== ISSUE NEW VIEW ===== */}
      {view === 'issue' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Assign to</label>
              <select value={newCoupon.clientID}
                onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { clientID: e.target.value })); }}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm bg-white">
                <option value="">All clients (individual coupon each)</option>
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
              <select value={newCoupon.type}
                onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { type: e.target.value, birthdayMonth: '' })); }}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm bg-white">
                <option value="reward">Reward</option>
                <option value="discount">Discount</option>
                <option value="freebie">Freebie</option>
                <option value="promo">Promo</option>
                <option value="birthday">Birthday</option>
                <option value="milestone">Milestone</option>
              </select>
            </div>
            {newCoupon.type.toLowerCase() === 'birthday' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Birthday Month</label>
                <select value={newCoupon.birthdayMonth}
                  onChange={function(e) {
                    var month = e.target.value;
                    setNewCoupon(Object.assign({}, newCoupon, {
                      birthdayMonth: month,
                      clientID: month ? 'bday_' + month : ''
                    }));
                  }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm bg-white">
                  <option value="">Select month...</option>
                  {['January','February','March','April','May','June','July','August','September','October','November','December'].map(function(m) {
                    var count = clients.filter(function(c) { return (c.birthdayMonth || '').toLowerCase() === m.toLowerCase(); }).length;
                    return <option key={m} value={m}>{m} ({count} celebrant{count !== 1 ? 's' : ''})</option>;
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
          {!newCoupon.clientID && newCoupon.type !== 'birthday' && (
            <p className="mt-3 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
              This will create an individual coupon for each approved client ({clients.filter(function(c) { return (c.status || '').toLowerCase() !== 'rejected' && (c.status || '').toLowerCase() !== 'pending'; }).length} clients).
            </p>
          )}
          <button onClick={addCoupon} disabled={saving}
            className="mt-4 px-6 py-3 rounded-xl font-bold text-sm hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: accentColor, color: btnOnAccent }}>
            <Plus size={16} /> {saving ? 'Creating...' : 'Issue Coupon'}
          </button>
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
