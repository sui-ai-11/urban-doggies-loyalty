import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import BrandingTab from '../components/BrandingTab';
import { BarChart3, Users, UserPlus, Upload, Copy, ExternalLink, Search, Filter, Palette } from 'lucide-react';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [allClients, setAllClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [breeds, setBreeds] = useState([]);
  const [birthdayMonths, setBirthdayMonths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [businessInfo, setBusinessInfo] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const [newClient, setNewClient] = useState({
    name: '', mobile: '', email: '', breed: '', birthdayMonth: ''
  });

  // Load business info for dynamic colors
  useEffect(() => {
    fetch('/api/get-business-info')
      .then(r => r.json())
      .then(data => setBusinessInfo(data))
      .catch(err => console.error('Error loading business info:', err));
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'clients') loadAllClients();
  }, [activeTab]);

  useEffect(() => {
    let filtered = [...allClients];
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.mobile.includes(searchQuery)
      );
    }
    if (selectedBreed !== 'all') filtered = filtered.filter(c => c.breed === selectedBreed);
    if (selectedMonth !== 'all') filtered = filtered.filter(c => c.birthdayMonth === selectedMonth);
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'visits-high': return b.visits - a.visits;
        case 'visits-low': return a.visits - b.visits;
        case 'breed': return (a.breed || '').localeCompare(b.breed || '');
        default: return 0;
      }
    });
    setFilteredClients(filtered);
  }, [allClients, searchQuery, selectedBreed, selectedMonth, sortBy]);

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
    if (!newClient.name || !newClient.mobile) { setMessage('⚠️ Name and mobile are required'); return; }
    try {
      setLoading(true); setMessage('');
      const response = await fetch('/api/add-client', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessID: 'BIZ_001', clientName: newClient.name, mobile: newClient.mobile, email: newClient.email || '', breed: newClient.breed || '', birthdayMonth: newClient.birthdayMonth || '' })
      });
      const result = await response.json();
      if (response.ok) {
        setMessage(`✅ Client added! Token: ${result.token}`);
        setNewClient({ name: '', mobile: '', email: '', breed: '', birthdayMonth: '' });
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
  const bgColor = businessInfo?.backgroundColor || '#17BEBB';
  const accentColor = businessInfo?.accentColor || '#17BEBB';
  const borderColor = businessInfo?.borderColor || '#1F3A93';
  const cardBg = businessInfo?.cardBackground || '#f8f8f8';

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'clients', label: 'All Clients', icon: Users },
    { key: 'add', label: 'Add Client', icon: UserPlus },
    { key: 'branding', label: 'Branding', icon: Palette },
    { key: 'import', label: 'Import CSV', icon: Upload },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <Navigation currentPage="admin" />

      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: accentColor }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: borderColor }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Client Management</h1>
          <p className="text-white text-opacity-80 font-light text-lg">Manage your loyalty system</p>
        </div>

        {/* Glass Tab Container */}
        <div className="glass-card rounded-3xl shadow-xl mb-6 overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* Tab Bar */}
          <div className="flex border-b overflow-x-auto" style={{ borderColor: `${borderColor}20` }}>
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className="px-5 py-4 font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap text-sm"
                style={{
                  backgroundColor: activeTab === key ? borderColor : 'transparent',
                  color: activeTab === key ? '#FFFFFF' : '#6B7280',
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
                <h2 className="text-2xl font-bold mb-6 tracking-tight" style={{ color: borderColor }}>Analytics Dashboard</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                  {[
                    { label: 'Total Clients', value: analytics.totalClients, icon: <Users size={28} />, color: borderColor },
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
                  <h3 className="text-lg font-bold mb-4" style={{ color: borderColor }}>🏆 Top Customers</h3>
                  <div className="space-y-2">
                    {allClients.sort((a, b) => b.visits - a.visits).slice(0, 10).map((client, i) => (
                      <div key={i} className="flex items-center justify-between bg-white rounded-xl p-4 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-xl text-gray-300 w-8">{i + 1}</span>
                          <div>
                            <p className="font-bold text-gray-800">{client.name}</p>
                            <p className="text-xs text-gray-500">{client.breed || 'No breed'}</p>
                          </div>
                        </div>
                        <span className="text-xl font-bold" style={{ color: accentColor }}>{client.visits}/{client.requiredVisits}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Breed Breakdown */}
                {analytics.breedBreakdown && (
                  <div className="rounded-2xl p-6" style={{ backgroundColor: `${bgColor}10` }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: borderColor }}>🐕 Breeds Breakdown</h3>
                    <div className="space-y-2">
                      {analytics.breedBreakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-white rounded-xl p-4">
                          <span className="font-semibold text-gray-800">{item.breed || 'Not specified'}</span>
                          <span className="font-bold" style={{ color: accentColor }}>{item.count} clients</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ ALL CLIENTS ═══ */}
            {activeTab === 'clients' && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: borderColor }}>
                    All Clients ({filteredClients.length})
                  </h2>
                  <button onClick={() => setActiveTab('add')}
                    className="text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    style={{ backgroundColor: accentColor }}>
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
                      style={{ borderColor: `${accentColor}40`, focusBorderColor: accentColor }} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Sort By</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-sm"
                      style={{ borderColor: `${accentColor}40` }}>
                      <option value="name">Name (A-Z)</option>
                      <option value="visits-high">Visits (High → Low)</option>
                      <option value="visits-low">Visits (Low → High)</option>
                      <option value="breed">Breed (A-Z)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Breed</label>
                    <select value={selectedBreed} onChange={(e) => setSelectedBreed(e.target.value)}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-sm"
                      style={{ borderColor: `${accentColor}40` }}>
                      <option value="all">All Breeds</option>
                      {breeds.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Birthday</label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-sm"
                      style={{ borderColor: `${accentColor}40` }}>
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
                            {['Name', 'Token', 'Visits', 'Breed', 'Mobile', 'Card'].map(h => (
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
                                <span className="font-mono font-bold text-sm" style={{ color: accentColor }}>{client.token}</span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`font-bold text-sm ${client.visits >= client.requiredVisits ? 'text-green-600' : 'text-gray-700'}`}>
                                  {client.visits}/{client.requiredVisits}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-sm text-gray-500">{client.breed || '-'}</td>
                              <td className="px-5 py-4 text-sm text-gray-500">{client.mobile || '-'}</td>
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
                <h2 className="text-2xl font-bold mb-6 tracking-tight" style={{ color: borderColor }}>Add New Client</h2>
                <form onSubmit={handleAddClient} className="max-w-2xl space-y-5">
                  {[
                    { label: 'Customer Name *', key: 'name', type: 'text', required: true },
                    { label: 'Mobile Number *', key: 'mobile', type: 'tel', required: true },
                    { label: 'Email', key: 'email', type: 'email' },
                    { label: 'Pet Breed', key: 'breed', type: 'text', placeholder: 'e.g., Shihtzu, Poodle, Golden Retriever' },
                  ].map(({ label, key, type, required, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
                      <input type={type} value={newClient[key]}
                        onChange={(e) => setNewClient({ ...newClient, [key]: e.target.value })}
                        placeholder={placeholder || ''} required={required}
                        className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all text-sm"
                        style={{ borderColor: `${accentColor}40` }} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Birthday Month</label>
                    <select value={newClient.birthdayMonth}
                      onChange={(e) => setNewClient({ ...newClient, birthdayMonth: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-sm"
                      style={{ borderColor: `${accentColor}40` }}>
                      <option value="">Select month…</option>
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m =>
                        <option key={m} value={m}>{m}</option>
                      )}
                    </select>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full text-white py-4 rounded-xl font-bold text-base transition-all duration-200 hover:shadow-lg hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    style={{ backgroundColor: accentColor }}>
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

            {/* ═══ IMPORT CSV ═══ */}
            {activeTab === 'import' && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6 tracking-tight" style={{ color: borderColor }}>Import Clients from CSV</h2>
                <div className="max-w-2xl">
                  <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: `${accentColor}10`, border: `2px solid ${accentColor}30` }}>
                    <h3 className="font-bold mb-3" style={{ color: borderColor }}>📋 CSV Format Required:</h3>
                    <p className="text-sm text-gray-600 mb-3">Your CSV file should have these columns:</p>
                    <code className="block bg-white p-3 rounded-lg text-sm font-mono text-gray-800">Name, Mobile, Email, Breed</code>
                    <p className="text-sm text-gray-600 mt-3">Example:</p>
                    <code className="block bg-white p-3 rounded-lg text-sm font-mono text-gray-800">
                      Mau Marasigan, 09328683575, mau@email.com, Shihtzu<br/>
                      Juan Reyes, 09171234567, juan@email.com, Poodle
                    </code>
                  </div>
                  <div className="border-4 border-dashed rounded-2xl p-12 text-center" style={{ borderColor: `${accentColor}40` }}>
                    <Upload size={44} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-bold mb-2">Coming Soon!</p>
                    <p className="text-sm text-gray-400">CSV import feature will be available in the next update.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Toast */}
        {message && (
          <div className={`mt-6 p-4 rounded-2xl text-center font-semibold text-sm animate-slide-up ${
            message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200'
            : message.includes('⚠️') ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
