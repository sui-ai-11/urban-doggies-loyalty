import React, { useState, useEffect } from 'react';

function SettingsTab() {
  var _a = useState(null), businessInfo = _a[0], setBusinessInfo = _a[1];
  var _b = useState([]), coupons = _b[0], setCoupons = _b[1];
  var _c = useState(false), saving = _c[0], setSaving = _c[1];
  var _d = useState(''), toast = _d[0], setToast = _d[1];
  var _e = useState('rewards'), activeSection = _e[0], setActiveSection = _e[1];

  // Editable fields
  var _f = useState({}), fields = _f[0], setFields = _f[1];

  // New coupon form
  var _g = useState({ clientID: '', type: 'reward', text: '', expiryDate: '', notes: '', birthdayMonth: '' }),
    newCoupon = _g[0], setNewCoupon = _g[1];

  // Expanded coupon group in manage view
  var _i = useState(null), expandedGroup = _i[0], setExpandedGroup = _i[1];

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
          termsURL: data.termsURL || '',
          contactEmail: data.contactEmail || '',
          navButton1Contact: data.navButton1Contact || '',
          callLabel: data.callLabel || '',
          feedbackLabel: data.feedbackLabel || '',
          milestones: (function() {
            try { return JSON.parse(data.milestonesJson || '[]'); } catch(e) { return []; }
          })(),
          milestoneTiers: (function() {
            try {
              var parsed = JSON.parse(data.milestonesJson || '{}');
              // If it's an array (old format), convert to tiered
              if (Array.isArray(parsed)) return { '1': parsed };
              // If it's an object with numbered keys, it's tiered
              if (typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
              return { '1': [] };
            } catch(e) { return { '1': [] }; }
          })(),
          activeTierKey: '1',
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
          setNewCoupon({ clientID: '', type: 'reward', text: '', expiryDate: '', notes: '', birthdayMonth: '' });
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
  function isLightC(hex) { var c = (hex || '#000').replace('#',''); return (0.299*parseInt(c.substring(0,2),16) + 0.587*parseInt(c.substring(2,4),16) + 0.114*parseInt(c.substring(4,6),16))/255 > 0.6; }
  var panelText = isLightC(borderColor) ? '#1a1a2e' : borderColor;
  var panelAccent = isLightC(accentColor) ? '#1a1a2e' : accentColor;

  var sections = [
    { key: 'rewards', label: '⭐ Date Stamp' },
    { key: 'contact', label: '💬 Contact' },
    { key: 'business', label: '🏢 Business' },
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
      {/* ═══ REWARDS SECTION ═══ */}
      {activeSection === 'rewards' && (
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ color: panelText }}>Stamp Card Settings</h3>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {renderInput('Required Visits for Reward', 'stampsRequired', '10', 'number')}
            {renderInput('Reward Text (auto-issued after completing card)', 'rewardDescription', 'Free service on your next visit!')}
            {renderInput('Progress Message', 'progressText', 'Track your visits and earn rewards!')}

            <h4 className="font-bold text-sm mt-6 mb-3" style={{ color: panelText }}>Stamp Icon (filled)</h4>
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

            <h4 className="font-bold text-sm mt-6 mb-2" style={{ color: panelText }}>
              Reward Milestones — Tiered Card System
            </h4>
            <p className="text-xs text-gray-400 mb-4">Set different milestones for each card cycle. Returning customers get new rewards each time they complete a card.</p>

            {/* Card Tier Selector */}
            {(function() {
              // Parse milestones: support old array format and new tiered object
              var allTiers = fields.milestoneTiers || {};
              if (!fields.milestoneTiers) {
                // Migrate old format
                var oldMs = fields.milestones || [];
                if (oldMs.length > 0) {
                  allTiers = { '1': oldMs };
                } else {
                  allTiers = { '1': [] };
                }
              }
              var tierKeys = Object.keys(allTiers).sort(function(a, b) { return parseInt(a) - parseInt(b); });
              var activeTier = fields.activeTierKey || tierKeys[0] || '1';
              var currentTierMs = allTiers[activeTier] || [];

              function updateTiers(newTiers, newActiveKey) {
                var updated = Object.assign({}, fields);
                updated.milestoneTiers = newTiers;
                if (newActiveKey) updated.activeTierKey = newActiveKey;
                setFields(updated);
              }

              return (
                <div>
                  {/* Tier tabs */}
                  <div className="flex gap-2 mb-4 flex-wrap items-center">
                    {tierKeys.map(function(key) {
                      var isDefault = allTiers[key + '_default'];
                      var label = key === '1' ? 'Card 1 (New)' : isDefault ? 'Card ' + key + '+' : 'Card ' + key;
                      return (
                        <button key={key} onClick={function() { updateTiers(allTiers, key); }}
                          className="px-4 py-2 rounded-xl text-xs font-bold transition"
                          style={{
                            backgroundColor: activeTier === key ? panelText : '#f3f4f6',
                            color: activeTier === key ? '#fff' : '#6b7280',
                          }}>
                          {label}
                        </button>
                      );
                    })}
                    <button onClick={function() {
                      var nextKey = String(tierKeys.length + 1);
                      var newTiers = Object.assign({}, allTiers);
                      newTiers[nextKey] = [];
                      updateTiers(newTiers, nextKey);
                    }}
                      className="px-3 py-2 rounded-xl text-xs font-bold border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition">
                      + Add Card Tier
                    </button>
                  </div>

                  {/* Repeat checkbox for last tier */}
                  {tierKeys.length > 1 && activeTier === tierKeys[tierKeys.length - 1] && (
                    <label className="flex items-center gap-2 mb-4 text-xs text-gray-500 cursor-pointer">
                      <input type="checkbox" checked={!!allTiers[activeTier + '_default']}
                        onChange={function(e) {
                          var newTiers = Object.assign({}, allTiers);
                          if (e.target.checked) {
                            newTiers[activeTier + '_default'] = true;
                          } else {
                            delete newTiers[activeTier + '_default'];
                          }
                          updateTiers(newTiers);
                        }}
                        className="rounded" />
                      Repeat this tier for all future cards (Card {activeTier}+)
                    </label>
                  )}

                  {/* Remove tier button */}
                  {tierKeys.length > 1 && (
                    <button onClick={function() {
                      if (!confirm('Remove Card ' + activeTier + ' tier?')) return;
                      var newTiers = Object.assign({}, allTiers);
                      delete newTiers[activeTier];
                      delete newTiers[activeTier + '_default'];
                      var remaining = Object.keys(newTiers).filter(function(k) { return !k.includes('_'); }).sort(function(a,b) { return parseInt(a)-parseInt(b); });
                      updateTiers(newTiers, remaining[0] || '1');
                    }}
                      className="mb-4 text-xs text-red-400 hover:text-red-600 font-bold">
                      Remove Card {activeTier} Tier
                    </button>
                  )}

                  {/* Milestone editor for active tier */}
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                    Milestones for Card {activeTier} (stamps 1 to {fields.stampsRequired || 10})
                  </p>

                  <button onClick={function() {
                    var newTiers = Object.assign({}, allTiers);
                    var ms = (newTiers[activeTier] || []).slice();
                    ms.push({ position: 1, icon: '🎁', label: '', description: '' });
                    newTiers[activeTier] = ms;
                    updateTiers(newTiers);
                  }}
                    className="mb-4 px-4 py-2 rounded-xl text-sm font-bold transition"
                    style={{ backgroundColor: accentColor + '15', color: panelAccent, border: '1px dashed ' + accentColor }}>
                    + Add Milestone
                  </button>

                  {currentTierMs.map(function(ms, idx) {
                    var emojiOptions = ['🎁', '⭐', '🎉', '🔥', '💎', '🌟', '🎯', '🏅', '🏆', '👑', '🐾', '🦴', '❤️', '✨', '☕', '🍕'];
                    return (
                      <div key={idx} className="rounded-xl p-4 mb-3" style={{ backgroundColor: accentColor + '08', border: '1px solid ' + accentColor + '20' }}>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-bold text-sm" style={{ color: panelText }}>Milestone {idx + 1}</h5>
                          <button onClick={function() {
                            var newTiers = Object.assign({}, allTiers);
                            var ms2 = (newTiers[activeTier] || []).slice();
                            ms2.splice(idx, 1);
                            newTiers[activeTier] = ms2;
                            updateTiers(newTiers);
                          }} className="text-red-400 hover:text-red-600 text-xs font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition">Remove</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Stamp Position</label>
                            <select value={ms.position || 1}
                              onChange={function(e) {
                                var newTiers = Object.assign({}, allTiers);
                                var ms2 = (newTiers[activeTier] || []).slice();
                                ms2[idx] = Object.assign({}, ms2[idx], { position: parseInt(e.target.value) });
                                newTiers[activeTier] = ms2;
                                updateTiers(newTiers);
                              }}
                              className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm bg-white">
                              {Array.from({length: parseInt(fields.stampsRequired) || 10}, function(_, i) {
                                return <option key={i+1} value={i+1}>Stamp #{i+1}</option>;
                              })}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Icon</label>
                            <div className="flex gap-1 flex-wrap">
                              {emojiOptions.map(function(emoji) {
                                return (
                                  <button key={emoji} onClick={function() {
                                    var newTiers = Object.assign({}, allTiers);
                                    var ms2 = (newTiers[activeTier] || []).slice();
                                    ms2[idx] = Object.assign({}, ms2[idx], { icon: emoji });
                                    newTiers[activeTier] = ms2;
                                    updateTiers(newTiers);
                                  }}
                                    className="w-7 h-7 rounded-md text-sm flex items-center justify-center"
                                    style={{
                                      backgroundColor: ms.icon === emoji ? accentColor + '20' : '#f3f4f6',
                                      border: ms.icon === emoji ? '2px solid ' + accentColor : '1px solid transparent'
                                    }}>
                                    {emoji}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Reward Label</label>
                            <input type="text" value={ms.label || ''} placeholder="e.g. 10% OFF"
                              onChange={function(e) {
                                var newTiers = Object.assign({}, allTiers);
                                var ms2 = (newTiers[activeTier] || []).slice();
                                ms2[idx] = Object.assign({}, ms2[idx], { label: e.target.value });
                                newTiers[activeTier] = ms2;
                                updateTiers(newTiers);
                              }}
                              className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Description</label>
                            <input type="text" value={ms.description || ''} placeholder="e.g. Get 10% off"
                              onChange={function(e) {
                                var newTiers = Object.assign({}, allTiers);
                                var ms2 = (newTiers[activeTier] || []).slice();
                                ms2[idx] = Object.assign({}, ms2[idx], { description: e.target.value });
                                newTiers[activeTier] = ms2;
                                updateTiers(newTiers);
                              }}
                              className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <button onClick={function() {
              // Save milestones as JSON (tiered format)
              var tiers = fields.milestoneTiers || {};
              // If no tiers, use legacy milestones as card 1
              if (Object.keys(tiers).length === 0 && fields.milestones && fields.milestones.length > 0) {
                tiers = { '1': fields.milestones };
              }
              var toSave = {
                stampsRequired: fields.stampsRequired,
                rewardDescription: fields.rewardDescription,
                progressText: fields.progressText,
                stampFilledIcon: fields.stampFilledIcon,
                milestonesJson: JSON.stringify(tiers),
              };
              // Also save first 2 milestones from Card 1 to legacy columns
              var card1Ms = tiers['1'] || [];
              if (card1Ms[0]) {
                toSave.milestone1Position = card1Ms[0].position || 0;
                toSave.milestone1Icon = card1Ms[0].icon || '🎁';
                toSave.milestone1Label = card1Ms[0].label || '';
                toSave.milestone1Description = card1Ms[0].description || '';
              }
              if (card1Ms[1]) {
                toSave.milestone2Position = card1Ms[1].position || 0;
                toSave.milestone2Icon = card1Ms[1].icon || '🏆';
                toSave.milestone2Label = card1Ms[1].label || '';
                toSave.milestone2Description = card1Ms[1].description || '';
              }
              setSaving(true);
              fetch('/api/update-business-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(toSave),
              })
                .then(function(r) { return r.json(); })
                .then(function(data) {
                  if (data.success) showToast('Settings saved!');
                  else showToast('Error: ' + (data.error || 'Unknown'));
                })
                .catch(function(err) { showToast('Error: ' + err.message); })
                .finally(function() { setSaving(false); });
            }}
              disabled={saving}
              className="mt-2 px-6 py-3 text-white rounded-xl font-bold text-sm hover:shadow-lg transition disabled:opacity-50"
              style={{ backgroundColor: accentColor }}>
              {saving ? 'Saving...' : 'Save Stamp Card Settings'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ BUSINESS SECTION ═══ */}
      {activeSection === 'business' && (
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ color: panelText }}>Business Profile</h3>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {renderInput('Business Name', 'businessName', 'Urban Doggies')}
            {renderInput('Tagline', 'tagline', 'Digital Loyalty System')}
            {renderInput('Logo URL', 'logo', 'https://...')}
            {renderInput('Ad/Promo Image URL', 'adImageUrl', 'https://...')}
            <h4 className="font-bold text-sm mt-6 mb-3" style={{ color: panelText }}>Card Navigation Labels</h4>
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

          {/* Registration QR */}
          <h3 className="text-lg font-bold mt-8 mb-4" style={{ color: panelText }}>Customer Registration</h3>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500 text-sm mb-4">Print this QR code so customers can self-register and get their loyalty card instantly.</p>
            <div className="inline-block bg-white rounded-2xl p-4 border-2 shadow-sm mb-4" style={{ borderColor: accentColor + '30' }}>
              <img
                src={'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(window.location.origin + '/#/portal')}
                alt="Registration QR"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-xs text-gray-400 mb-3">{window.location.origin + '/#/portal'}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={function() {
                navigator.clipboard.writeText(window.location.origin + '/#/portal');
                showToast('Link copied!');
              }}
                className="px-4 py-2 rounded-xl text-sm font-bold transition"
                style={{ backgroundColor: accentColor + '15', color: panelAccent }}>
                📋 Copy Link
              </button>
              <button onClick={function() {
                var win = window.open('', '_blank');
                win.document.write('<html><head><title>Registration QR</title><style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;margin:0;}h1{font-size:28px;margin-bottom:8px;}p{color:#888;margin-bottom:24px;}</style></head><body>');
                win.document.write('<h1>' + ((businessInfo && businessInfo.businessName) || 'Business') + '</h1>');
                win.document.write('<p>Scan to join our loyalty program!</p>');
                win.document.write('<img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + encodeURIComponent(window.location.origin + '/#/portal') + '" width="300" height="300" />');
                win.document.write('<p style="margin-top:24px;font-size:12px;color:#aaa;">' + window.location.origin + '/#/portal</p>');
                win.document.write('</body></html>');
                win.document.close();
                win.print();
              }}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white transition"
                style={{ backgroundColor: accentColor }}>
                🖨️ Print Poster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CONTACT SECTION ═══ */}
      {activeSection === 'contact' && (
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ color: panelText }}>Contact Page Settings</h3>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {renderInput('Page Title', 'chatLabel', 'Get in Touch')}
            {renderInput('Subtitle', 'supportText', "We'd love to hear from you")}

            <h4 className="font-bold text-sm mt-6 mb-3" style={{ color: panelText }}>Chat Button</h4>
            <p className="text-xs text-gray-400 mb-3">Leave empty to hide this button from customers</p>
            {renderInput('Button Label', 'navButton1Contact', 'Message us via Viber')}
            {renderInput('Chat Link', 'chatLink', 'viber://chat?number=%2B6312345678')}

            <h4 className="font-bold text-sm mt-6 mb-3" style={{ color: panelText }}>Call Button</h4>
            <p className="text-xs text-gray-400 mb-3">Leave empty to hide this button from customers</p>
            {renderInput('Button Label', 'callLabel', 'Call Us')}
            {renderInput('Phone Number', 'termsURL', '+63 2 1234 5678')}

            <h4 className="font-bold text-sm mt-6 mb-3" style={{ color: panelText }}>Feedback Button</h4>
            <p className="text-xs text-gray-400 mb-3">Leave empty to hide this button from customers</p>
            {renderInput('Button Label', 'feedbackLabel', 'Send Feedback')}
            {renderInput('Email Address', 'contactEmail', 'info@yourbusiness.com')}

            <button onClick={function() { saveSettings(['chatLabel', 'chatLink', 'supportText', 'termsURL', 'contactEmail', 'navButton1Contact', 'callLabel', 'feedbackLabel']); }}
              disabled={saving}
              className="mt-4 px-6 py-3 text-white rounded-xl font-bold text-sm hover:shadow-lg transition disabled:opacity-50"
              style={{ backgroundColor: accentColor }}>
              {saving ? 'Saving...' : 'Save Contact Settings'}
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
