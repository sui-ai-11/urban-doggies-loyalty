import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, Search, Camera, X } from 'lucide-react';
import Navigation from '../components/Navigation';

function StaffPanel() {
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [clientInfo, setClientInfo] = useState(null);
  const [multipleResults, setMultipleResults] = useState(null); // For when multiple customers found
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Load jsQR library
  useEffect(() => {
    if (showScanner && !window.jsQR) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [showScanner]);

  // Start QR Scanner
  async function startScanner() {
    setShowScanner(true);
    setMessage('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
        scanQRCode();
      }
    } catch (err) {
      setMessage('❌ Camera access denied or not available');
      setShowScanner(false);
    }
  }

  // Scan QR Code from video
  function scanQRCode() {
    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && window.jsQR) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = window.jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            // Found QR code!
            stopScanner();
            setSearchInput(code.data.toUpperCase());
            searchCustomerByToken(code.data.toUpperCase());
          }
        }
      }
    }, 300); // Scan every 300ms
  }

  // Stop Scanner
  function stopScanner() {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    
    setShowScanner(false);
    setScanning(false);
  }

  // Search by token (for QR scanner)
  async function searchCustomerByToken(token) {
    try {
      setLoading(true);
      setMessage('');
      setClientInfo(null);

      const response = await fetch(`/api/client-dashboard?token=${token}`);
      
      if (!response.ok) {
        throw new Error('Customer not found');
      }

      const result = await response.json();
      
      if (result.client) {
        setClientInfo({
          ...result.client,
          currentVisits: result.loyalty?.totalVisits || 0,
          requiredVisits: result.business?.requiredVisits || 10
        });
        setMultipleResults(null);
        setMessage('✅ Customer found! Review info and confirm to add stamp.');
      }
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      setClientInfo(null);
    } finally {
      setLoading(false);
    }
  }

  // Search for customer by token or name
  async function searchCustomer(e) {
    e.preventDefault();
    
    if (!searchInput.trim()) {
      setMessage('⚠️ Please enter a token or customer name');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      setClientInfo(null);

      const query = searchInput.toUpperCase();

      // Try to find by token first
      let response = await fetch(`/api/client-dashboard?token=${query}`);
      
      if (!response.ok) {
        // If token fails, try searching by name
        response = await fetch(`/api/search-client?name=${encodeURIComponent(searchInput)}`);
      }

      if (!response.ok) {
        throw new Error('Customer not found');
      }

      const result = await response.json();
      
      // Handle different response formats
      if (result.client) {
        // Single result from token search
        setClientInfo({
          ...result.client,
          currentVisits: result.loyalty?.totalVisits || 0,
          requiredVisits: result.business?.requiredVisits || 10
        });
        setMultipleResults(null);
        setMessage('✅ Customer found! Review info and confirm to add stamp.');
      } else if (result.clients && result.clients.length > 1) {
        // Multiple results - show selection
        setMultipleResults(result.clients);
        setClientInfo(null);
        setMessage(`✅ Found ${result.clients.length} customers with that name. Please select:`);
      } else if (result.clients && result.clients.length === 1) {
        // Only one result
        setClientInfo({
          ...result.clients[0],
          currentVisits: 0,
          requiredVisits: 10
        });
        setMultipleResults(null);
        setMessage('✅ Customer found! Review info and confirm to add stamp.');
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
    setMultipleResults(null);
  }

  function selectCustomer(customer) {
    setClientInfo({
      ...customer,
      currentVisits: 0,
      requiredVisits: 10
    });
    setMultipleResults(null);
    setMessage('✅ Customer selected! Review info and confirm to add stamp.');
  }

  return (
    <div className="min-h-screen bg-[#17BEBB]">
      <Navigation currentPage="staff" />

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Client Management</h1>
          <p className="text-white text-opacity-90">Search by token or customer name</p>
        </div>

        {/* QR Scanner Modal */}
        {showScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#1F3A93]">Scan QR Code</h2>
                <button
                  onClick={stopScanner}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>
              
              <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: '1' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-4 border-[#17BEBB] rounded-2xl" style={{ width: '70%', height: '70%' }}>
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
                  </div>
                </div>
              </div>
              
              <p className="text-center text-gray-600 mt-4 font-semibold">
                {scanning ? 'Position QR code within frame...' : 'Starting camera...'}
              </p>
            </div>
          </div>
        )}

        {/* Search Form */}
        {!clientInfo && !showScanner && (
          <div className="bg-[#F5F1E8] rounded-3xl border-8 border-[#1F3A93] shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#17BEBB] rounded-full mb-4 shadow-lg">
                <Search size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-[#1F3A93]">Customer Check-In</h2>
            </div>

            {/* Scan QR Code Button */}
            <button
              type="button"
              onClick={startScanner}
              className="w-full bg-[#1F3A93] text-white py-5 rounded-2xl font-bold text-xl hover:bg-[#152959] transition flex items-center justify-center gap-3 shadow-xl mb-4"
            >
              <Camera size={28} />
              Scan QR Code
            </button>

            <div className="text-center text-gray-500 font-bold my-4">OR</div>

            {/* Manual Search */}
            <form onSubmit={searchCustomer}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3 text-center">
                  Enter Token or Customer Name
                </label>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder=""
                  className="w-full px-6 py-5 text-xl text-center border-4 border-[#17BEBB] rounded-2xl focus:ring-4 focus:ring-[#17BEBB] focus:ring-opacity-30 focus:border-[#1F3A93] bg-white shadow-inner"
                  autoFocus
                />
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

        {/* Multiple Results - Customer Selection */}
        {multipleResults && multipleResults.length > 1 && (
          <div className="bg-[#F5F1E8] rounded-3xl border-8 border-[#1F3A93] shadow-2xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#1F3A93]">Select Customer</h2>
              <p className="text-gray-600 mt-2">Found {multipleResults.length} customers. Click to select:</p>
            </div>

            <div className="space-y-3 mb-6">
              {multipleResults.map((customer, index) => (
                <button
                  key={index}
                  onClick={() => selectCustomer(customer)}
                  className="w-full bg-white hover:bg-blue-50 border-4 border-[#17BEBB] rounded-2xl p-5 text-left transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xl text-[#1F3A93]">{customer.name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Token: <span className="font-mono font-bold text-[#17BEBB]">{customer.token}</span>
                      </p>
                      {customer.mobile && (
                        <p className="text-sm text-gray-600">Mobile: {customer.mobile}</p>
                      )}
                      {customer.breed && (
                        <p className="text-sm text-gray-600">Pet: 🐕 {customer.breed}</p>
                      )}
                    </div>
                    <div className="text-[#17BEBB]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={cancelSearch}
              className="w-full bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold text-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
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
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-semibold whitespace-nowrap self-start">Name:</span>
                  <span className="font-bold text-[#1F3A93] text-xl break-words">{clientInfo.name}</span>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-semibold whitespace-nowrap self-start">Token:</span>
                  <span className="font-bold text-[#17BEBB] text-xl font-mono break-all">{clientInfo.token}</span>
                </div>
                {clientInfo.breed && (
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 py-3 border-b border-gray-200">
                    <span className="text-gray-600 font-semibold whitespace-nowrap self-start">Pet:</span>
                    <span className="font-bold text-gray-800">🐕 {clientInfo.breed}</span>
                  </div>
                )}
                {clientInfo.mobile && (
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 py-3 border-b border-gray-200">
                    <span className="text-gray-600 font-semibold whitespace-nowrap self-start">Mobile:</span>
                    <span className="font-bold text-gray-800">{clientInfo.mobile}</span>
                  </div>
                )}
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 py-3">
                  <span className="text-gray-600 font-semibold whitespace-nowrap self-start">Current Visits:</span>
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
                className="bg-[#17BEBB] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#15a8a5] transition disabled:bg-gray-300"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Adding...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1">
                    <CheckCircle size={24} />
                    <span>Add Stamp</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success/Error Message */}
        {message && (
          <div className={`mt-6 p-4 rounded-2xl text-center font-bold text-base border-4 ${
            message.includes('🎉') 
              ? 'bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-800 border-[#FF9F1C] shadow-lg' 
              : message.includes('✅') && (message.includes('Stamp added') || message.includes('SUCCESS'))
              ? 'bg-green-50 text-green-800 border-green-400'
              : message.includes('✅')
              ? 'bg-blue-50 text-blue-800 border-blue-400'
              : 'bg-red-50 text-red-800 border-red-400'
          }`}>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">
                {message.includes('🎉') ? '🎉' : 
                 message.includes('✅') && (message.includes('Stamp added') || message.includes('SUCCESS')) ? '✅' :
                 message.includes('✅') ? 'ℹ️' : '❌'}
              </span>
              <span className="text-sm sm:text-base">{message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StaffPanel;
