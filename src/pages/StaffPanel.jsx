import React, { useState } from 'react';
import { Scan, CheckCircle, ArrowLeft } from 'lucide-react';

function StaffPanel() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [clientInfo, setClientInfo] = useState(null);

  async function handleCheckIn(e) {
    e.preventDefault();
    
    if (!token.trim()) {
      setMessage('⚠️ Please enter a token');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      setClientInfo(null);

      const response = await fetch('/api/add-stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token.toUpperCase(),
          businessID: 'BIZ_001',
          addedBy: 'staff'
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add stamp');
      }

      setClientInfo(result.client);

      if (result.rewardEarned) {
        setMessage(`🎉 SUCCESS! ${result.client.name} earned a reward: "${result.rewardText}"`);
      } else {
        setMessage(`✅ Stamp added! ${result.client.name} now has ${result.totalVisits} visit${result.totalVisits > 1 ? 's' : ''}.`);
      }

      setTimeout(() => {
        setToken('');
        setClientInfo(null);
        setMessage('');
      }, 4000);

    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#17BEBB]">
      {/* Header */}
      <div className="bg-[#1F3A93] text-white px-6 py-6 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <a 
              href="/" 
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            >
              <ArrowLeft size={24} />
            </a>
            <div>
              <h1 className="text-3xl font-bold">Staff Check-In</h1>
              <p className="text-blue-200 text-sm">Scan customer QR codes to add stamps</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        
        {/* Instructions */}
        <div className="bg-blue-50 border-4 border-[#1F3A93] rounded-3xl p-6 mb-6">
          <h3 className="font-bold text-[#1F3A93] text-lg mb-3">📱 How to use:</h3>
          <ol className="space-y-2 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="font-bold text-[#17BEBB] text-xl">1.</span>
              <span>Ask customer to show their QR code</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-[#17BEBB] text-xl">2.</span>
              <span>Enter their token code below</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-[#17BEBB] text-xl">3.</span>
              <span>Click "Add Stamp" to record their visit</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-[#FF9F1C] text-xl">🎁</span>
              <span>System automatically issues rewards at milestones!</span>
            </li>
          </ol>
        </div>

        {/* Check-In Form */}
        <div className="bg-[#F5F1E8] rounded-3xl border-8 border-[#1F3A93] shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#17BEBB] rounded-full mb-4 shadow-lg">
              <Scan size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-[#1F3A93]">Customer Check-In</h2>
          </div>

          <form onSubmit={handleCheckIn}>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3 text-center">
                Enter Customer Token
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="w-full px-6 py-5 text-3xl font-mono font-bold text-center border-4 border-[#17BEBB] rounded-2xl focus:ring-4 focus:ring-[#17BEBB] focus:ring-opacity-30 focus:border-[#1F3A93] uppercase bg-white shadow-inner"
                maxLength={10}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-3 text-center font-semibold">
                Usually a 6-8 character code
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full bg-[#17BEBB] text-white py-5 rounded-2xl font-bold text-xl hover:bg-[#15a8a5] transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl disabled:shadow-none"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-3 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={28} />
                  Add Stamp
                </>
              )}
            </button>
          </form>

          {/* Message Display */}
          {message && (
            <div className={`mt-6 p-6 rounded-2xl text-center font-bold text-lg border-4 ${
              message.includes('🎉') 
                ? 'bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-800 border-[#FF9F1C] shadow-lg' 
                : message.includes('✅')
                ? 'bg-green-50 text-green-800 border-green-400'
                : 'bg-red-50 text-red-800 border-red-400'
            }`}>
              <div className="text-4xl mb-3">
                {message.includes('🎉') ? '🎉' : message.includes('✅') ? '✅' : '❌'}
              </div>
              {message}
            </div>
          )}

          {/* Client Info Display */}
          {clientInfo && (
            <div className="mt-6 bg-white rounded-2xl p-6 border-4 border-[#17BEBB]">
              <h3 className="font-bold text-[#1F3A93] mb-4 flex items-center gap-2 text-lg">
                <CheckCircle size={24} className="text-[#17BEBB]" />
                Customer Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600 font-semibold">Name:</span>
                  <span className="font-bold text-[#1F3A93] text-lg">{clientInfo.name}</span>
                </div>
                {clientInfo.breed && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 font-semibold">Pet:</span>
                    <span className="font-bold text-gray-800">🐕 {clientInfo.breed}</span>
                  </div>
                )}
                {clientInfo.mobile && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-semibold">Mobile:</span>
                    <span className="font-bold text-gray-800">{clientInfo.mobile}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-[#F5F1E8] border-4 border-[#1F3A93] rounded-2xl p-6 text-center">
            <p className="text-4xl font-bold text-[#17BEBB] mb-2">-</p>
            <p className="text-sm text-gray-600 font-bold">Stamps Today</p>
          </div>
          <div className="bg-[#F5F1E8] border-4 border-[#FF9F1C] rounded-2xl p-6 text-center">
            <p className="text-4xl font-bold text-[#FF9F1C] mb-2">-</p>
            <p className="text-sm text-gray-600 font-bold">Rewards Issued</p>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-white border-4 border-[#1F3A93] rounded-2xl p-6">
          <h3 className="font-bold text-[#1F3A93] mb-4 text-lg">💡 Need Help?</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-[#17BEBB] font-bold">•</span>
              <span><strong>Token not working?</strong> Ask customer to refresh their card</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#17BEBB] font-bold">•</span>
              <span><strong>Wrong customer?</strong> Double-check the token carefully</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#17BEBB] font-bold">•</span>
              <span><strong>Technical issues?</strong> Contact the admin panel</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default StaffPanel;
