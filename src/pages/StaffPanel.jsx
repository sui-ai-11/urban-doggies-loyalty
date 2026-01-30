import React, { useState, useEffect, useRef } from 'react';
import { Scan, CheckCircle, ArrowLeft, Search, X, Camera } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

function StaffPanel() {
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [clientInfo, setClientInfo] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Start QR Scanner
  async function startScanner() {
    setShowScanner(true);
    setScanning(true);
    setMessage('');
    
    try {
      // Get list of cameras
      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length) {
        const html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = html5QrCode;
        
        // Start scanning - prefer back camera
        const cameraId = devices.length > 1 ? devices[1].id : devices[0].id;
        
        await html5QrCode.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            // Successfully scanned!
            setSearchInput(decodedText.toUpperCase());
            stopScanner();
            searchCustomer(decodedText.toUpperCase());
          },
          (errorMessage) => {
            // Scanning... (ignore errors)
          }
        );
      } else {
        setMessage('❌ No camera found on this device');
        setShowScanner(false);
        setScanning(false);
      }
    } catch (err) {
      setMessage('❌ Camera access denied or not available');
      setShowScanner(false);
      setScanning(false);
    }
  }

  // Stop QR Scanner
  function stopScanner() {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current.clear();
        setShowScanner(false);
        setScanning(false);
      }).catch((err) => {
        console.error('Error stopping scanner:', err);
      });
    }
  }

  // Search for customer by token or name
  async function searchCustomer(query = searchInput) {
    if (!query.trim()) {
      setMessage('⚠️ Please enter a token or customer name');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      setClientInfo(null);

      // Try to find by token first
      let response = await fetch(`/api/client-dashboard?token=${query.toUpperCase()}`);
      
      if (!response.ok) {
        // If token fails, try searching by name
        response = await fetch(`/api/search-client?name=${encodeURIComponent(query)}`);
      }

      if (!response.ok) {
        throw new Error('Customer not found');
      }

      const result = await response.json();
      
      // Handle different response formats
      if (result.client) {
        setClientInfo({
          ...result.client,
          currentVisits: result.loyalty?.totalVisits || 0,
          requiredVisits: result.business?.requiredVisits || 10
        });
        setMessage('✅ Customer found! Review info and confirm to add stamp.');
      } else if (result.clients && result.clients.length > 0) {
        // Multiple results from name search
        setClientInfo(result.clients[0]); // Show first result
        setMessage(`✅ Found ${result.clients.length} customer(s). Showing: ${result.clients[0].name}`);
      } else {
        throw new Error('Customer not found');
      }

    } catch (error) {
      setMessage(`❌ ${error.message}`);
      setClientInfo(null);
    } finally {
      setLoading(false);
    }
  }

  // Actually add the stamp
  async function confirmAddStamp() {
    if (!clientInfo) return;

    try {
      setLoading(true);
      setMessage('');

      const response = await fetch('/api/add-stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: clientInfo.token,
          businessID: 'BIZ_001',
          addedBy: 'staff'
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add stamp');
      }

      if (result.rewardEarned) {
        setMessage(`🎉 SUCCESS! ${result.client.name} earned a reward: "${result.rewardText}"`);
      } else {
        setMessage(`✅ Stamp added! ${result.client.name} now has ${result.totalVisits} visit${result.totalVisits > 1 ? 's' : ''}.`);
      }

      // Clear after 4 seconds
      setTimeout(() => {
        setSearchInput('');
        setClientInfo(null);
        setMessage('');
      }, 4000);

    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function cancelSearch() {
    setClientInfo(null);
    setSearchInput('');
    setMessage('');
  }

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

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
              <p className="text-blue-200 text-sm">Scan QR code or search customer</p>
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
              <span>Scan customer's QR code with camera</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-[#17BEBB] text-xl">2.</span>
              <span>Or manually enter token or customer name</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-[#17BEBB] text-xl">3.</span>
              <span>Verify customer info and confirm</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-[#FF9F1C] text-xl">🎁</span>
              <span>System automatically issues rewards at milestones!</span>
            </li>
          </ol>
        </div>

        {/* QR Scanner Modal */}
        {showScanner && (
          <div className="bg-[#F5F1E8] rounded-3xl border-8 border-[#1F3A93] shadow-2xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#1F3A93]">Scan QR Code</h2>
              <button
                onClick={stopScanner}
                className="p-2 hover:bg-red-100 rounded-lg transition"
              >
                <X size={24} className="text-red-600" />
              </button>
            </div>
            <div id="qr-reader" className="rounded-2xl overflow-hidden"></div>
            <p className="text-center text-gray-600 mt-4">
              {scanning ? 'Position QR code within frame...' : 'Starting camera...'}
            </p>
          </div>
        )}

        {/* Search Form */}
        {!showScanner && !clientInfo && (
          <div className="bg-[#F5F1E8] rounded-3xl border-8 border-[#1F3A93] shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#17BEBB] rounded-full mb-4 shadow-lg">
                <Scan size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-[#1F3A93]">Customer Check-In</h2>
            </div>

            {/* QR Scan Button */}
            <button
              onClick={startScanner}
              className="w-full bg-[#1F3A93] text-white py-5 rounded-2xl font-bold text-xl hover:bg-[#152959] transition flex items-center justify-center gap-3 shadow-xl mb-4"
            >
              <Camera size={28} />
              Scan QR Code
            </button>

            <div className="text-center text-gray-500 font-bold my-4">OR</div>

            {/* Manual Search */}
            <form onSubmit={(e) => { e.preventDefault(); searchCustomer(); }}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3 text-center">
                  Enter Token or Customer Name
                </label>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="DOG789 or Mau Marasigan"
                  className="w-full px-6 py-5 text-xl text-center border-4 border-[#17BEBB] rounded-2xl focus:ring-4 focus:ring-[#17BEBB] focus:ring-opacity-30 focus:border-[#1F3A93] bg-white shadow-inner"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-3 text-center font-semibold">
                  Enter customer token or full name
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !searchInput.trim()}
                className="w-full bg-[#17BEBB] text-white py-5 rounded-2xl font-bold text-xl hover:bg-[#15a8a5] transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-3 border-white"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={28} />
                    Search Customer
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Customer Info Display - BEFORE adding stamp */}
        {clientInfo && !message.includes('Stamp added') && !message.includes('SUCCESS') && (
          <div className="bg-[#F5F1E8] rounded-3xl border-8 border-[#1F3A93] shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4 shadow-lg">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-600">Customer Found!</h2>
            </div>

            <div className="bg-white rounded-2xl p-6 mb-6 border-4 border-[#17BEBB]">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-semibold">Name:</span>
                  <span className="font-bold text-[#1F3A93] text-xl">{clientInfo.name}</span>
                </div>
                {clientInfo.breed && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600 font-semibold">Pet:</span>
                    <span className="font-bold text-gray-800">🐕 {clientInfo.breed}</span>
                  </div>
                )}
                {clientInfo.mobile && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600 font-semibold">Mobile:</span>
                    <span className="font-bold text-gray-800">{clientInfo.mobile}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600 font-semibold">Current Visits:</span>
                  <span className="font-bold text-[#17BEBB] text-2xl">
                    {clientInfo.currentVisits || 0}/{clientInfo.requiredVisits || 10}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={cancelSearch}
                className="bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold text-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddStamp}
                disabled={loading}
                className="bg-[#17BEBB] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#15a8a5] transition disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <CheckCircle size={24} />
                    Add Stamp
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success/Error Message */}
        {message && (
          <div className={`mt-6 p-6 rounded-2xl text-center font-bold text-lg border-4 ${
            message.includes('🎉') 
              ? 'bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-800 border-[#FF9F1C] shadow-lg' 
              : message.includes('✅') && (message.includes('Stamp added') || message.includes('SUCCESS'))
              ? 'bg-green-50 text-green-800 border-green-400'
              : message.includes('✅')
              ? 'bg-blue-50 text-blue-800 border-blue-400'
              : 'bg-red-50 text-red-800 border-red-400'
          }`}>
            <div className="text-4xl mb-3">
              {message.includes('🎉') ? '🎉' : 
               message.includes('✅') && (message.includes('Stamp added') || message.includes('SUCCESS')) ? '✅' :
               message.includes('✅') ? 'ℹ️' : '❌'}
            </div>
            {message}
          </div>
        )}

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
              <span><strong>QR not scanning?</strong> Use manual token entry</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#17BEBB] font-bold">•</span>
              <span><strong>Can't find customer?</strong> Try entering full name</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#17BEBB] font-bold">•</span>
              <span><strong>Wrong customer?</strong> Click Cancel and search again</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default StaffPanel;
