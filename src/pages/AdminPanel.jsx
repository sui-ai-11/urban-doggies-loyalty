import React, { useState } from 'react';
import { Plus, Users, Settings, ArrowLeft, Copy, Check } from 'lucide-react';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('clients');
  const [showAddClient, setShowAddClient] = useState(false);
  const [message, setMessage] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [lastGeneratedToken, setLastGeneratedToken] = useState('');
  
  const [newClient, setNewClient] = useState({
    businessID: 'BIZ_001',
    clientName: '',
    mobile: '',
    email: '',
    breed: '',
    birthday: ''
  });

  async function handleAddClient(e) {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/add-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });

      const result = await response.json();
      
      if (response.ok) {
        setLastGeneratedToken(result.token);
        setMessage(`✅ Client added successfully!`);
        setNewClient({
          businessID: 'BIZ_001',
          clientName: '',
          mobile: '',
          email: '',
          breed: '',
          birthday: ''
        });
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  }

  const cardURL = lastGeneratedToken 
    ? `${window.location.origin}/card?token=${lastGeneratedToken}`
    : '';

  return (
    <div className="min-h-screen bg-[#17BEBB]">
      {/* Header */}
      <div className="bg-[#1F3A93] text-white px-6 py-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <a 
              href="/" 
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            >
              <ArrowLeft size={24} />
            </a>
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-blue-200 text-sm">Manage your loyalty system</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b-4 border-[#1F3A93] shadow">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-4 px-2 border-b-4 transition font-bold ${
                activeTab === 'clients'
                  ? 'border-[#FF9F1C] text-[#1F3A93]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users size={20} className="inline mr-2" />
              Clients
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-2 border-b-4 transition font-bold ${
                activeTab === 'settings'
                  ? 'border-[#FF9F1C] text-[#1F3A93]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings size={20} className="inline mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div>
            <div className="bg-[#F5F1E8] rounded-3xl border-4 border-[#1F3A93] shadow-xl p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#1F3A93]">Client Management</h2>
                <button
                  onClick={() => setShowAddClient(!showAddClient)}
                  className="bg-[#FF9F1C] text-white px-6 py-3 rounded-2xl hover:bg-[#e68d10] transition flex items-center gap-2 font-bold shadow-lg"
                >
                  <Plus size={20} />
                  Add Client
                </button>
              </div>

              {showAddClient && (
                <form onSubmit={handleAddClient} className="bg-white rounded-2xl p-6 mb-6 border-2 border-[#17BEBB]">
                  <h3 className="font-bold text-xl text-[#1F3A93] mb-6">Add New Client</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Client Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newClient.clientName}
                        onChange={(e) => setNewClient({...newClient, clientName: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#17BEBB] focus:border-[#17BEBB] font-semibold"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={newClient.mobile}
                        onChange={(e) => setNewClient({...newClient, mobile: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#17BEBB] focus:border-[#17BEBB]"
                        placeholder="+63 912 345 6789"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newClient.email}
                        onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#17BEBB] focus:border-[#17BEBB]"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Pet Breed
                      </label>
                      <input
                        type="text"
                        value={newClient.breed}
                        onChange={(e) => setNewClient({...newClient, breed: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#17BEBB] focus:border-[#17BEBB]"
                        placeholder="Golden Retriever"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Birthday (Optional)
                      </label>
                      <input
                        type="date"
                        value={newClient.birthday}
                        onChange={(e) => setNewClient({...newClient, birthday: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#17BEBB] focus:border-[#17BEBB]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="bg-[#17BEBB] text-white px-8 py-3 rounded-2xl hover:bg-[#15a8a5] transition font-bold shadow-lg"
                    >
                      Create Client
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddClient(false)}
                      className="bg-gray-200 text-gray-700 px-8 py-3 rounded-2xl hover:bg-gray-300 transition font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Success Message with Token */}
              {message && lastGeneratedToken && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🎉</div>
                    <div className="flex-1">
                      <p className="font-bold text-green-800 text-lg mb-3">{message}</p>
                      
                      <div className="bg-white rounded-xl p-4 mb-3">
                        <p className="text-sm font-bold text-gray-700 mb-2">Client Token:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-2xl font-mono font-bold text-[#1F3A93] flex-1">
                            {lastGeneratedToken}
                          </code>
                          <button
                            onClick={() => copyToClipboard(lastGeneratedToken)}
                            className="bg-[#17BEBB] text-white p-2 rounded-lg hover:bg-[#15a8a5] transition"
                          >
                            {copiedToken ? <Check size={20} /> : <Copy size={20} />}
                          </button>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4">
                        <p className="text-sm font-bold text-gray-700 mb-2">Share this link:</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={cardURL}
                            readOnly
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                          />
                          <button
                            onClick={() => copyToClipboard(cardURL)}
                            className="bg-[#FF9F1C] text-white px-4 py-2 rounded-lg hover:bg-[#e68d10] transition font-bold"
                          >
                            {copiedToken ? <Check size={18} /> : <Copy size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {message && !lastGeneratedToken && (
                <div className={`p-6 rounded-2xl mb-6 font-bold ${
                  message.includes('✅') 
                    ? 'bg-green-50 text-green-800 border-2 border-green-300' 
                    : 'bg-red-50 text-red-800 border-2 border-red-300'
                }`}>
                  {message}
                </div>
              )}

              <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6">
                <p className="font-bold text-blue-900 mb-2">📊 View All Clients</p>
                <p className="text-sm text-blue-800">
                  Open your Google Sheet <strong>"Clients"</strong> tab to see all registered customers, their tokens, and visit history.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <div className="bg-[#F5F1E8] rounded-3xl border-4 border-[#1F3A93] shadow-xl p-8">
              <h2 className="text-2xl font-bold text-[#1F3A93] mb-6">Business Configuration</h2>
              
              <div className="bg-white rounded-2xl p-6 mb-6">
                <p className="text-gray-700 mb-4">
                  Customize your loyalty system by editing the <strong>Businesses</strong> tab in your Google Sheet.
                </p>
                
                <div className="bg-[#17BEBB] bg-opacity-10 border-2 border-[#17BEBB] rounded-xl p-5">
                  <p className="font-bold text-[#1F3A93] mb-3">💡 What you can customize:</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-[#17BEBB] font-bold">✓</span>
                      <span><strong>Business Name & Logo:</strong> Your brand identity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#17BEBB] font-bold">✓</span>
                      <span><strong>Accent Colors:</strong> Match your brand colors (hex codes)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#17BEBB] font-bold">✓</span>
                      <span><strong>Required Visits:</strong> How many stamps to earn rewards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#17BEBB] font-bold">✓</span>
                      <span><strong>Reward Text:</strong> What customers earn</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#17BEBB] font-bold">✓</span>
                      <span><strong>Contact Info:</strong> Viber, phone, support links</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#17BEBB] font-bold">✓</span>
                      <span><strong>Ad Space:</strong> Upload images for promotions</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border-2 border-[#17BEBB]">
                  <p className="text-3xl font-bold text-[#1F3A93] mb-2">-</p>
                  <p className="text-sm text-gray-600 font-semibold">Total Clients</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-400">
                  <p className="text-3xl font-bold text-green-600 mb-2">-</p>
                  <p className="text-sm text-gray-600 font-semibold">Visits Today</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-2xl border-2 border-[#FF9F1C]">
                  <p className="text-3xl font-bold text-[#FF9F1C] mb-2">-</p>
                  <p className="text-sm text-gray-600 font-semibold">Rewards Issued</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
