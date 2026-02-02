import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { BarChart3, Users, UserPlus, Upload, Copy, ExternalLink, Search, Filter } from 'lucide-react';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [allClients, setAllClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [breeds, setBreeds] = useState([]);
  const [birthdayMonths, setBirthdayMonths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  // Add client form
  const [newClient, setNewClient] = useState({
    name: '',
    mobile: '',
    email: '',
    breed: '',
    birthdayMonth: ''
  });

  // Load all clients
  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'clients') {
      loadAllClients();
    }
  }, [activeTab]);

  // Filter and sort clients
  useEffect(() => {
    let filtered = [...allClients];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.mobile.includes(searchQuery)
      );
    }
    
    // Breed filter
    if (selectedBreed !== 'all') {
      filtered = filtered.filter(c => c.breed === selectedBreed);
    }
    
    // Birthday month filter
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(c => c.birthdayMonth === selectedMonth);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'visits-high':
          return b.visits - a.visits;
        case 'visits-low':
          return a.visits - b.visits;
        case 'breed':
          return (a.breed || '').localeCompare(b.breed || '');
        default:
          return 0;
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
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddClient(e) {
    e.preventDefault();
    
    if (!newClient.name || !newClient.mobile) {
      setMessage('⚠️ Name and mobile are required');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const response = await fetch('/api/add-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessID: 'BIZ_001',
          clientName: newClient.name,
          clientMobile: newClient.mobile,
          clientEmail: newClient.email || '',
          clientBreed: newClient.breed || ''
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`✅ Client added! Token: ${result.token}`);
        setNewClient({ name: '', mobile: '', email: '', breed: '' });
        loadAllClients();
      } else {
        throw new Error(result.error || 'Failed to add client');
      }
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    setMessage(`✅ Copied: ${text}`);
    setTimeout(() => setMessage(''), 2000);
  }

  return (
    <div className="min-h-screen bg-[#17BEBB]">
      <Navigation currentPage="admin" />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-white text-opacity-90">Manage your loyalty system</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-4 font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'dashboard' 
                  ? 'bg-[#1F3A93] text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 size={20} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-6 py-4 font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'clients' 
                  ? 'bg-[#1F3A93] text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users size={20} />
              All Clients
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-6 py-4 font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'add' 
                  ? 'bg-[#1F3A93] text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <UserPlus size={20} />
              Add Client
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-6 py-4 font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'import' 
                  ? 'bg-[#1F3A93] text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Upload size={20} />
              Import CSV
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && analytics && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Analytics Dashboard</h2>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Users size={32} />
                      <p className="text-5xl font-bold">{analytics.totalClients}</p>
                    </div>
                    <p className="text-blue-100 font-semibold">Total Clients</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M12 12v10"/>
                        <path d="M8 16h8"/>
                      </svg>
                      <p className="text-5xl font-bold">{analytics.stampsToday}</p>
                    </div>
                    <p className="text-green-100 font-semibold">Stamps Today</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                      </svg>
                      <p className="text-5xl font-bold">{analytics.rewardsIssued}</p>
                    </div>
                    <p className="text-orange-100 font-semibold">Rewards Issued</p>
                  </div>
                </div>

                {/* Top Customers */}
                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 Top Customers by Visits</h3>
                  <div className="space-y-3">
                    {allClients
                      .sort((a, b) => b.visits - a.visits)
                      .slice(0, 10)
                      .map((client, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-4 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-2xl text-gray-400">{index + 1}</span>
                            <div>
                              <p className="font-bold text-gray-800">{client.name}</p>
                              <p className="text-sm text-gray-500">{client.breed || 'No breed'}</p>
                            </div>
                          </div>
                          <span className="text-2xl font-bold text-[#17BEBB]">
                            {client.visits}/{client.requiredVisits}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Breed Breakdown */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">🐕 Breeds Breakdown</h3>
                  <div className="space-y-3">
                    {analytics.breedBreakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-4 rounded-xl">
                        <span className="font-bold text-gray-800">{item.breed || 'No breed specified'}</span>
                        <span className="text-xl font-bold text-[#FF9F1C]">{item.count} clients</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ALL CLIENTS TAB */}
            {activeTab === 'clients' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">All Clients ({filteredClients.length})</h2>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="bg-[#17BEBB] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#15a8a5] transition flex items-center gap-2"
                  >
                    <UserPlus size={20} />
                    Add New
                  </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      <Search size={16} className="inline mr-1" />
                      Search
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Name, token, or mobile..."
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#17BEBB] focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      <Filter size={16} className="inline mr-1" />
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#17BEBB] focus:outline-none"
                    >
                      <option value="name">Name (A-Z)</option>
                      <option value="visits-high">Visits (High to Low)</option>
                      <option value="visits-low">Visits (Low to High)</option>
                      <option value="breed">Breed (A-Z)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Filter by Breed
                    </label>
                    <select
                      value={selectedBreed}
                      onChange={(e) => setSelectedBreed(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#17BEBB] focus:outline-none"
                    >
                      <option value="all">All Breeds</option>
                      {breeds.map(breed => (
                        <option key={breed} value={breed}>{breed}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      🎂 Birthday Month
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#17BEBB] focus:outline-none"
                    >
                      <option value="all">All Months</option>
                      {['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Clients Table */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#17BEBB] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading clients...</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl overflow-hidden shadow">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Name</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Token</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Visits</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Breed</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Mobile</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Card Link</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredClients.map((client, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <p className="font-bold text-gray-800">{client.name}</p>
                                <p className="text-sm text-gray-500">{client.email || 'No email'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-mono font-bold text-[#17BEBB]">{client.token}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`font-bold ${client.visits >= client.requiredVisits ? 'text-green-600' : 'text-gray-800'}`}>
                                  {client.visits}/{client.requiredVisits}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-600">{client.breed || '-'}</td>
                              <td className="px-6 py-4 text-gray-600">{client.mobile || '-'}</td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => copyToClipboard(client.cardLink)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                    title="Copy link"
                                  >
                                    <Copy size={18} className="text-gray-600" />
                                  </button>
                                  <a
                                    href={client.cardLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                    title="View card"
                                  >
                                    <ExternalLink size={18} className="text-gray-600" />
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

            {/* ADD CLIENT TAB */}
            {activeTab === 'add' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Client</h2>
                
                <form onSubmit={handleAddClient} className="max-w-2xl">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={newClient.name}
                        onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#17BEBB] focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        value={newClient.mobile}
                        onChange={(e) => setNewClient({...newClient, mobile: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#17BEBB] focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={newClient.email}
                        onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#17BEBB] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Pet Breed (Optional)
                      </label>
                      <input
                        type="text"
                        value={newClient.breed}
                        onChange={(e) => setNewClient({...newClient, breed: e.target.value})}
                        placeholder="e.g., Shihtzu, Poodle, Golden Retriever"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#17BEBB] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        🎂 Birthday Month (Optional)
                      </label>
                      <select
                        value={newClient.birthdayMonth}
                        onChange={(e) => setNewClient({...newClient, birthdayMonth: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#17BEBB] focus:outline-none"
                      >
                        <option value="">Select month...</option>
                        {['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#17BEBB] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#15a8a5] transition disabled:bg-gray-300 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <UserPlus size={24} />
                          Add Client
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* IMPORT CSV TAB */}
            {activeTab === 'import' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Import Clients from CSV</h2>
                
                <div className="max-w-2xl">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="font-bold text-blue-900 mb-3">📋 CSV Format Required:</h3>
                    <p className="text-sm text-blue-800 mb-3">Your CSV file should have these columns:</p>
                    <code className="block bg-white p-3 rounded text-sm font-mono text-gray-800">
                      Name, Mobile, Email, Breed
                    </code>
                    <p className="text-sm text-blue-800 mt-3">Example:</p>
                    <code className="block bg-white p-3 rounded text-sm font-mono text-gray-800">
                      Mau Marasigan, 09328683575, mau@email.com, Shihtzu<br/>
                      Juan Reyes, 09171234567, juan@email.com, Poodle
                    </code>
                  </div>

                  <div className="border-4 border-dashed border-gray-300 rounded-2xl p-12 text-center">
                    <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 font-bold mb-4">Coming Soon!</p>
                    <p className="text-sm text-gray-500">CSV import feature will be available in the next update.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mt-6 p-4 rounded-xl text-center font-bold ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-800 border-2 border-green-200'
              : message.includes('⚠️')
              ? 'bg-yellow-50 text-yellow-800 border-2 border-yellow-200'
              : 'bg-red-50 text-red-800 border-2 border-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
