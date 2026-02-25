import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import BrandingTab from '../components/BrandingTab';
import SettingsTab from '../components/SettingsTab';
import CouponsTab from '../components/CouponsTab';
import { BarChart3, Users, UserPlus, Upload, Copy, ExternalLink, Search, Filter, Palette, Settings, Gift, Lock } from 'lucide-react';

function CouponsOverview({ couponsList, allClients }) {
  var _s = React.useState(null), expandedGroup = _s[0], setExpandedGroup = _s[1];
  var grouped = {};
  couponsList.forEach(function(c) {
    var key = c.text || 'Untitled';
    if (!grouped[key]) grouped[key] = { text: key, type: c.type, items: [] };
    var clientName = '';
    for (var i = 0; i < (allClients || []).length; i++) {
      if ((allClients[i].clientID === c.clientID) || (allClients[i].token === c.clientID)) {
        clientName = allClients[i].name; break;
      }
    }
    var status = 'active';
    if (c.redeemed === 'TRUE') status = 'claimed';
    else if (c.expiryDate && new Date(c.expiryDate) < new Date()) status = 'expired';
    grouped[key].items.push({ clientName: clientName || c.clientID || 'All clients', status: status, expiryDate: c.expiryDate, redeemedAt: c.redeemedAt });
  });
  return (
    <div className="space-y-2">
      {Object.values(grouped).map(function(g) {
        var isExpanded = expandedGroup === g.text;
        var activeCount = g.items.filter(function(x) { return x.status === 'active'; }).length;
        var claimedCount = g.items.filter(function(x) { return x.status === 'claimed'; }).length;
        var expiredCount = g.items.filter(function(x) { return x.status === 'expired'; }).length;
        return (
          <div key={g.text} className="bg-white rounded-xl overflow-hidden">
            <button onClick={function() { setExpandedGroup(isExpanded ? null : g.text); }}
              className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition">
              <div>
                <p className="font-bold text-sm text-gray-800">{g.text}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs font-bold text-green-600">{activeCount} active</span>
                  <span className="text-xs font-bold text-gray-400">{claimedCount} claimed</span>
                  {expiredCount > 0 && <span className="text-xs font-bold text-red-500">{expiredCount} expired</span>}
                </div>
              </div>
              <span style={{ fontSize: '16px', color: '#9ca3af', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>›</span>
            </button>
            {isExpanded && (
              <div className="border-t border-gray-100 p-3 space-y-1 bg-gray-50">
                {g.items.map(function(item, j) {
                  return (
                    <div key={j} className="flex items-center justify-between bg-white rounded-lg p-2.5 text-sm">
                      <div>
                        <p className="font-semibold text-gray-800 text-xs">{item.clientName}</p>
                        <p className="text-xs text-gray-400">{item.expiryDate ? 'Exp: ' + item.expiryDate : 'No expiry'}{item.redeemedAt ? ' · Claimed ' + item.redeemedAt : ''}</p>
                      </div>
                      <span className={'text-xs font-bold px-2 py-0.5 rounded-full ' +
                        (item.status === 'claimed' ? 'bg-gray-100 text-gray-500' :
                         item.status === 'expired' ? 'bg-red-50 text-red-600' :
                         'bg-green-50 text-green-600')}>
                        {item.status === 'claimed' ? 'Claimed' : item.status === 'expired' ? 'Expired' : 'Active'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AdminPanel() {
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [allClients, setAllClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [breeds, setBreeds] = useState([]);
  const [birthdayMonths, setBirthdayMonths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [businessInfo, setBusinessInfo] = useState(null);
  const [couponsList, setCouponsList] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const [newClient, setNewClient] = useState({
    firstName: '', lastName: '', mobile: '', email: '', birthday: '', birthdayMonth: ''
  });

  // Load business info for dynamic colors
  useEffect(() => {
    fetch('/api/get-business-info')
      .then(r => r.json())
      .then(data => setBusinessInfo(data))
      .catch(err => console.error('Error loading business info:', err));
    fetch('/api/manage-coupons')
      .then(r => r.json())
      .then(data => setCouponsList(data.coupons || []))
      .catch(err => console.error('Error loading coupons:', err));
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'clients') loadAllClients();
  }, [activeTab]);

  useEffect(() => {
    let filtered = [...allClients];
    if (searchQuery) {
      var q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.token || '').toLowerCase().includes(q) ||
        (c.mobile || '').includes(searchQuery) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.birthday || '').includes(searchQuery)
      );
    }
    if (selectedMonth !== 'all') filtered = filtered.filter(c => c.birthdayMonth === selectedMonth);
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'visits-high': return b.visits - a.visits;
        case 'visits-low': return a.visits - b.visits;
        default: return 0;
      }
    });
    setFilteredClients(filtered);
  }, [allClients, searchQuery, selectedMonth, sortBy]);

  async function loadAllClients() {
    try {
      setLoading(true);
      const response = await fetch('/api/get-all-clients');
      const data = await response.json();
      if (response.ok) {
        setAllClients(data.clients || []);
        setBreeds(data.breeds || []);
        setBirthdayMonths(data.birthdayMonths || []);
        setAnalytics(data.analytics || {});
      }
    } catch (error) { console.error('Error loading clients:', error); }
    finally { setLoading(false); }
  }

  async function handleAddClient(e) {
    e.preventDefault();
    if (!newClient.firstName.trim() || !newClient.lastName.trim()) { setMessage('⚠️ First name and last name are required'); return; }
    if (!newClient.mobile.trim()) { setMessage('⚠️ Mobile number is required'); return; }
    if (!newClient.birthday) { setMessage('⚠️ Birthday is required'); return; }
    var fullName = newClient.firstName.trim() + ' ' + newClient.lastName.trim();
    try {
      setLoading(true); setMessage('');
      const response = await fetch('/api/add-client', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessID: 'BIZ_001', clientName: fullName, mobile: newClient.mobile.trim(), email: newClient.email || '', birthday: newClient.birthday || '', birthdayMonth: newClient.birthdayMonth || '' })
      });
      const result = await response.json();
      if (response.ok) {
        setMessage(`✅ Client added! Token: ${result.token}`);
        setNewClient({ firstName: '', lastName: '', mobile: '', email: '', birthday: '', birthdayMonth: '' });
        loadAllClients();
      } else throw new Error(result.error || 'Failed to add client');
    } catch (error) { setMessage(`❌ ${error.message}`); }
    finally { setLoading(false); }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    setMessage(`✅ Copied: ${text}`);
    setTimeout(() => setMessage(''), 2000);
  }

  // Dynamic colors
  const bgColor = businessInfo?.backgroundColor || '#1a1a2e';
  const accentColor = businessInfo?.accentColor || '#4a4a5a';
  const borderColor = businessInfo?.borderColor || '#2a2a3a';
  const cardBg = businessInfo?.cardBackground || '#f8f8f8';

  // Smart text colors for admin panels (white/light card backgrounds)
  function isLight(hex) {
    const c = (hex || '#000').replace('#','');
    return (0.299*parseInt(c.substring(0,2),16) + 0.587*parseInt(c.substring(2,4),16) + 0.114*parseInt(c.substring(4,6),16))/255 > 0.6;
  }
  // For text on white panels: use borderColor if dark enough, otherwise use a dark fallback
  const panelText = isLight(borderColor) ? '#1a1a2e' : borderColor;
  // For accent on white panels: use accentColor if dark enough, otherwise darken it
  const panelAccent = isLight(accentColor) ? '#1a1a2e' : accentColor;
  const btnOnAccent = isLight(accentColor) ? '#1a1a2e' : '#ffffff';
  const btnOnBorder = isLight(borderColor) ? '#1a1a2e' : '#ffffff';

  // Don't render until we have business colors
  if (!businessInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gray-600"></div>
      </div>
    );
  }

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'clients', label: 'All Clients', icon: Users },
    { key: 'add', label: 'Add Client', icon: UserPlus },
    { key: 'coupons', label: 'Coupons', icon: Gift },
    { key: 'branding', label: 'Branding', icon: Palette },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  // Default PIN — can be changed via settings later
  var adminPin = (businessInfo && businessInfo.adminPin) || '1234';

  function checkPin() {
    if (pinInput === adminPin) {
      setIsLocked(false);
      setPinError('');
    } else {
      setPinError('Incorrect PIN');
      setPinInput('');
    }
  }

  if (isLocked) {
    var bgIsDark = true;
    try {
      var c = bgColor.replace('#','');
      bgIsDark = (0.299*parseInt(c.substring(0,2),16) + 0.587*parseInt(c.substring(2,4),16) + 0.114*parseInt(c.substring(4,6),16))/255 < 0.5;
    } catch(e) {}
    var navText = bgIsDark ? '#ffffff' : (isLight(borderColor) ? '#1a1a2e' : borderColor);
    return (
      <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
        <Navigation currentPage="admin" />
        <div className="flex items-center justify-center p-6" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="glass-card rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ backgroundColor: accentColor }}>
            <Lock size={28} color="#ffffff" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: panelText }}>Client Management</h2>
          <p className="text-gray-500 text-sm mb-6">Enter PIN to access</p>
          <input type="password" value={pinInput}
            onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') checkPin(); }}
            placeholder="Enter PIN"
            className="w-full px-6 py-3.5 text-base text-center tracking-[0.3em] rounded-2xl border-3 focus:outline-none mb-4 font-mono"
            style={{ borderColor: pinError ? '#ef4444' : accentColor, borderWidth: '3px' }}
            autoFocus
            inputMode="numeric"
          />
          {pinError && <p className="text-red-500 text-sm font-semibold mb-4">{pinError}</p>}
          <button onClick={checkPin}
            className="w-full py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-lg"
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
      <Navigation currentPage="admin" />

      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: accentColor }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: borderColor }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-2xl sm:text-4xl font-black mb-2 tracking-tight" style={{ color: bgIsDark ? '#ffffff' : borderColor }}>Client Management</h1>
          <p className="font-light text-lg" style={{ color: bgIsDark ? 'rgba(255,255,255,0.8)' : `${borderColor}99` }}>Manage your loyalty system</p>
        </div>

        {/* Glass Tab Container */}
        <div className="glass-card rounded-3xl shadow-xl mb-6 overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* Tab Bar */}
          <div className="flex border-b overflow-x-auto" style={{ borderColor: `${borderColor}20` }}>
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className="px-3 sm:px-5 py-3 sm:py-4 font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap text-xs sm:text-sm"
                style={{
                  backgroundColor: activeTab === key ? panelText : 'transparent',
                  color: activeTab === key ? (isLight(panelText) ? '#1a1a2e' : '#FFFFFF') : '#6B7280',
                }}>
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">

            {/* ═══ DASHBOARD ═══ */}
            {activeTab === 'dashboard' && analytics && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6 tracking-tight" style={{ color: panelText }}>Analytics Dashboard</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                  {[
                    { label: 'Total Clients', value: analytics.totalClients, icon: <Users size={28} />, color: panelText },
                    { label: 'Stamps Today', value: analytics.stampsToday, icon: '🏷️', color: accentColor },
                    { label: 'Rewards Issued', value: analytics.rewardsIssued, icon: '⭐', color: '#F59E0B' },
                  ].map((card, i) => (
                    <div key={i} className="rounded-2xl p-6 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}CC)` }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl">{typeof card.icon === 'string' ? card.icon : card.icon}</span>
                        <p className="text-4xl font-black">{card.value}</p>
                      </div>
                      <p className="text-white text-opacity-90 font-semibold text-sm">{card.label}</p>
                    </div>
                  ))}
                </div>

                {/* Top Customers */}
                <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: `${bgColor}10` }}>
                  <h3 className="text-lg font-bold mb-4" style={{ color: panelText }}>🏆 Top Customers</h3>
                  <div className="space-y-2">
                    {allClients.sort((a, b) => b.visits - a.visits).slice(0, 10).map((client, i) => (
                      <div key={i} className="flex items-center justify-between bg-white rounded-xl p-4 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-xl text-gray-300 w-8">{i + 1}</span>
                          <div>
                            <p className="font-bold text-gray-800">{client.name}</p>
                            <p className="text-xs text-gray-500">Cards completed: {Math.floor(client.visits / (client.requiredVisits || 10))}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold" style={{ color: panelAccent }}>{client.visits}</span>
                          <p className="text-xs text-gray-400">total visits</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coupons Summary */}
                <div className="rounded-2xl p-6" style={{ backgroundColor: `${bgColor}10` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: panelText }}>🎁 Coupons</h3>
                      <p className="text-sm text-gray-400 mt-1">{couponsList ? couponsList.length : 0} total coupons issued</p>
                    </div>
                    <button onClick={() => setActiveTab('coupons')}
                      className="text-sm font-bold px-4 py-2 rounded-xl transition"
                      style={{ color: '#fff', backgroundColor: accentColor }}>
                      Manage →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ ALL CLIENTS ═══ */}
            {activeTab === 'clients' && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: panelText }}>
                    All Clients ({filteredClients.length})
                  </h2>
                  <button onClick={() => setActiveTab('add')}
                    className="px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    style={{ backgroundColor: accentColor, color: btnOnAccent }}>
                    <UserPlus size={18} /> Add New
                  </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Search</label>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Name, token, or mobile..."
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 text-sm"
                      style={{ borderColor: `${accentColor}60`, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Sort By</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-sm"
                      style={{ borderColor: `${accentColor}60`, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }}>
                      <option value="name">Name (A-Z)</option>
                      <option value="visits-high">Visits (High → Low)</option>
                      <option value="visits-low">Visits (Low → High)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Birthday</label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-sm"
                      style={{ borderColor: `${accentColor}60`, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }}>
                      <option value="all">All Months</option>
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m =>
                        <option key={m} value={m}>{m}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Clients Table */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-4 mx-auto mb-3" style={{ borderColor: accentColor }} />
                    <p className="text-gray-500 text-sm">Loading clients…</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr style={{ backgroundColor: `${borderColor}08` }}>
                            {['Name', 'Token', 'Mobile', 'Birthday', 'Visits', 'Card'].map(h => (
                              <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredClients.map((client, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-5 py-4">
                                <p className="font-semibold text-gray-800 text-sm">{client.name}</p>
                                <p className="text-xs text-gray-400">{client.email || 'No email'}</p>
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-mono font-bold text-sm" style={{ color: panelAccent }}>{client.token}</span>
                              </td>
                              <td className="px-5 py-4">
                                <span className="text-sm text-gray-600">{client.mobile || '—'}</span>
                              </td>
                              <td className="px-5 py-4">
                                <span className="text-sm text-gray-600" title={client.birthday || ''}>{client.birthdayMonth || client.birthday || '—'}</span>
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-bold text-sm" style={{ color: panelAccent }}>
                                  {client.visits}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex gap-1">
                                  <button onClick={() => copyToClipboard(`${window.location.origin}/#/card?token=${client.token}`)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition" title="Copy link">
                                    <Copy size={16} className="text-gray-400" />
                                  </button>
                                  <a href={`/#/card?token=${client.token}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition" title="View card">
                                    <ExternalLink size={16} className="text-gray-400" />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ ADD CLIENT ═══ */}
            {activeTab === 'add' && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6 tracking-tight" style={{ color: panelText }}>Add New Client</h2>
                <form onSubmit={handleAddClient} className="max-w-2xl space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">First Name *</label>
                      <input type="text" value={newClient.firstName}
                        onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                        required className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all text-sm"
                        style={{ borderColor: `${accentColor}60`, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Last Name *</label>
                      <input type="text" value={newClient.lastName}
                        onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                        required className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all text-sm"
                        style={{ borderColor: `${accentColor}60`, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }} />
                    </div>
                  </div>
                  {[
                    { label: 'Mobile Number *', key: 'mobile', type: 'tel', required: true },
                    { label: 'Email', key: 'email', type: 'email' },
                  ].map(({ label, key, type, required, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
                      <input type={type} value={newClient[key]}
                        onChange={(e) => setNewClient({ ...newClient, [key]: e.target.value })}
                        placeholder={placeholder || ''} required={required}
                        className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all text-sm"
                        style={{ borderColor: `${accentColor}60`, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Birthday *</label>
                    <input type="date" value={newClient.birthday}
                      onChange={(e) => {
                        var val = e.target.value;
                        var month = '';
                        if (val) {
                          var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                          month = months[parseInt(val.split('-')[1]) - 1] || '';
                        }
                        setNewClient({ ...newClient, birthday: val, birthdayMonth: month });
                      }}
                      required className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all text-sm"
                      style={{ borderColor: `${accentColor}60`, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }} />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-4 rounded-xl font-bold text-base transition-all duration-200 hover:shadow-lg hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    style={{ backgroundColor: accentColor, color: btnOnAccent }}>
                    {loading ? (
                      <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Adding…</>
                    ) : (
                      <><UserPlus size={20} /> Add Client</>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ═══ BRANDING ═══ */}
            {activeTab === 'branding' && <BrandingTab />}

            {activeTab === 'settings' && <SettingsTab />}

            {/* ═══ COUPONS ═══ */}
            {activeTab === 'coupons' && <CouponsTab />}
          </div>
        </div>

        {/* Toast */}
        {message && (
          <div className={`mt-6 p-4 rounded-2xl text-center font-semibold text-sm animate-slide-up ${
            message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200'
            : message.includes('⚠️') ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.includes('Token:') ? (
              <div>
                <p className="mb-1">{message.split('Token:')[0]}</p>
                <p className="font-mono text-lg tracking-widest font-black" style={{ color: accentColor }}>
                  {message.split('Token:')[1].trim()}
                </p>
              </div>
            ) : message}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
