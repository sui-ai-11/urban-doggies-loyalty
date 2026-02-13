import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, Search, Camera, X } from 'lucide-react';
import Navigation from '../components/Navigation';

function StaffPanel() {
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [clientInfo, setClientInfo] = useState(null);
  const [multipleResults, setMultipleResults] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Load business info for dynamic colors
  useEffect(() => {
    fetch('/api/get-business-info')
      .then(r => r.json())
      .then(data => setBusinessInfo(data))
      .catch(err => console.error('Error loading business info:', err));
  }, []);

  useEffect(() => {
    if (showScanner && !window.jsQR) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [showScanner]);

  async function startScanner() {
    setShowScanner(true); setMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); setScanning(true); scanQRCode(); }
    } catch { setMessage('❌ Camera access denied or not available'); setShowScanner(false); }
  }

  function scanQRCode() {
    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && window.jsQR) {
        const video = videoRef.current, canvas = canvasRef.current, ctx = canvas.getContext('2d');
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.height = video.videoHeight; canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = window.jsQR(imageData.data, imageData.width, imageData.height);
          if (code) { stopScanner(); setSearchInput(code.data.toUpperCase()); searchCustomerByToken(code.data.toUpperCase()); }
        }
      }
    }, 300);
  }

  function stopScanner() {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    setShowScanner(false); setScanning(false);
  }

  async function searchCustomerByToken(token) {
    try {
      setLoading(true); setMessage(''); setClientInfo(null);
      const response = await fetch(`/api/client-dashboard?token=${token}`);
      if (!response.ok) throw new Error('Customer not found');
      const result = await response.json();
      if (result.client) {
        setClientInfo({ ...result.client, currentVisits: result.loyalty?.totalVisits || 0, requiredVisits: result.business?.requiredVisits || 10 });
        setMultipleResults(null);
        setMessage('✅ Customer found! Review info and confirm to add stamp.');
      }
    } catch (error) { setMessage(`❌ ${error.message}`); setClientInfo(null); }
    finally { setLoading(false); }
  }

  async function searchCustomer(e) {
    e.preventDefault();
    if (!searchInput.trim()) { setMessage('⚠️ Please enter a token or customer name'); return; }
    try {
      setLoading(true); setMessage(''); setClientInfo(null);
      const query = searchInput.toUpperCase();
      let response = await fetch(`/api/client-dashboard?token=${query}`);
      if (!response.ok) response = await fetch(`/api/search-client?name=${encodeURIComponent(searchInput)}`);
      if (!response.ok) throw new Error('Customer not found');
      const result = await response.json();
      if (result.client) {
        setClientInfo({ ...result.client, currentVisits: result.loyalty?.totalVisits || 0, requiredVisits: result.business?.requiredVisits || 10 });
        setMultipleResults(null); setMessage('✅ Customer found! Review info and confirm to add stamp.');
      } else if (result.clients?.length > 1) {
        setMultipleResults(result.clients); setClientInfo(null); setMessage(`✅ Found ${result.clients.length} customers. Please select:`);
      } else if (result.clients?.length === 1) {
        setClientInfo({ ...result.clients[0], currentVisits: 0, requiredVisits: 10 });
        setMultipleResults(null); setMessage('✅ Customer found! Review info and confirm to add stamp.');
      } else throw new Error('Customer not found');
    } catch (error) { setMessage(`❌ ${error.message}`); setClientInfo(null); }
    finally { setLoading(false); }
  }

  async function confirmAddStamp() {
    if (!clientInfo) return;
    try {
      setLoading(true); setMessage('');
      const response = await fetch('/api/add-stamp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: clientInfo.token, businessID: 'BIZ_001', addedBy: 'staff' })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to add stamp');
      if (result.rewardEarned) setMessage(`🎉 SUCCESS! ${result.client.name} earned a reward: "${result.rewardText}"`);
      else setMessage(`✅ Stamp added! ${result.client.name} now has ${result.totalVisits} visit${result.totalVisits > 1 ? 's' : ''}.`);
      setTimeout(() => { setSearchInput(''); setClientInfo(null); setMessage(''); }, 4000);
    } catch (error) { setMessage(`❌ Error: ${error.message}`); }
    finally { setLoading(false); }
  }

  function cancelSearch() { setClientInfo(null); setSearchInput(''); setMessage(''); setMultipleResults(null); }
  function selectCustomer(customer) {
    setClientInfo({ ...customer, currentVisits: 0, requiredVisits: 10 });
    setMultipleResults(null); setMessage('✅ Customer selected! Review info and confirm to add stamp.');
  }

  // Dynamic colors
  const bgColor = businessInfo?.backgroundColor || '#1a1a2e';
  const accentColor = businessInfo?.accentColor || '#4a4a5a';
  const borderColor = businessInfo?.borderColor || '#2a2a3a';
  const cardBg = businessInfo?.cardBackground || '#f8f8f8';

  if (!businessInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <Navigation currentPage="staff" />

      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-40 right-20 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: accentColor }} />
        <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: borderColor }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-8">
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Loyalty Desk</h1>
          <p className="text-white text-opacity-80 font-light text-lg">Search by token or customer name</p>
        </div>

        {/* QR Scanner Modal */}
        {showScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="glass-card rounded-3xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold" style={{ color: borderColor }}>Scan QR Code</h2>
                <button onClick={stopScanner} className="p-2 hover:bg-gray-100 rounded-xl transition">
                  <X size={24} className="text-gray-600" />
                </button>
              </div>
              <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: '1' }}>
                <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-4 rounded-2xl" style={{ width: '70%', height: '70%', borderColor: accentColor }} />
                </div>
              </div>
              <p className="text-center text-gray-500 mt-4 font-semibold text-sm">
                {scanning ? 'Position QR code within frame…' : 'Starting camera…'}
              </p>
            </div>
          </div>
        )}

        {/* Search Form */}
        {!clientInfo && !showScanner && !multipleResults && (
          <div className="glass-card rounded-3xl shadow-xl p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-18 h-18 rounded-2xl mb-4 shadow-lg p-4"
                style={{ backgroundColor: accentColor }}>
                <Search size={36} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: borderColor }}>Customer Check-In</h2>
            </div>

            <button type="button" onClick={startScanner}
              className="w-full text-white py-5 rounded-2xl font-bold text-lg transition-all duration-200 hover:shadow-lg hover:scale-[1.01] flex items-center justify-center gap-3 mb-4"
              style={{ backgroundColor: borderColor }}>
              <Camera size={24} /> Scan QR Code
            </button>

            <div className="text-center text-gray-400 font-semibold text-sm my-4">OR</div>

            <form onSubmit={searchCustomer}>
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider text-center">
                  Enter Token or Customer Name
                </label>
                <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-6 py-5 text-xl text-center border-3 rounded-2xl focus:outline-none shadow-inner bg-white"
                  style={{ borderColor: accentColor, borderWidth: '3px' }} autoFocus />
              </div>
              <button type="submit" disabled={loading || !searchInput.trim()}
                className="w-full text-white py-5 rounded-2xl font-bold text-lg transition-all duration-200 hover:shadow-lg hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                style={{ backgroundColor: accentColor }}>
                {loading ? (
                  <><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" /> Searching…</>
                ) : (
                  <><Search size={24} /> Search Customer</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Multiple Results */}
        {multipleResults && multipleResults.length > 1 && (
          <div className="glass-card rounded-3xl shadow-xl p-8 animate-slide-up">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: borderColor }}>Select Customer</h2>
              <p className="text-gray-500 mt-2 text-sm">Found {multipleResults.length} customers. Click to select:</p>
            </div>
            <div className="space-y-3 mb-6">
              {multipleResults.map((customer, i) => (
                <button key={i} onClick={() => selectCustomer(customer)}
                  className="w-full bg-white hover:shadow-md rounded-2xl p-5 text-left transition-all duration-200 border-2"
                  style={{ borderColor: `${accentColor}40` }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg" style={{ color: borderColor }}>{customer.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Token: <span className="font-mono font-bold" style={{ color: accentColor }}>{customer.token}</span></p>
                      {customer.mobile && <p className="text-xs text-gray-500">Mobile: {customer.mobile}</p>}
                      {customer.breed && <p className="text-xs text-gray-500">Pet: 🐕 {customer.breed}</p>}
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={cancelSearch} className="w-full bg-gray-100 text-gray-600 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition">Cancel</button>
          </div>
        )}

        {/* Customer Info */}
        {clientInfo && !message.includes('Stamp added') && !message.includes('SUCCESS') && (
          <div className="glass-card rounded-3xl shadow-xl p-8 animate-slide-up">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl mb-4 shadow-lg">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-600">Customer Found!</h2>
            </div>

            <div className="bg-white rounded-2xl p-6 mb-6 border-2" style={{ borderColor: `${accentColor}40` }}>
              <div className="space-y-4">
                {[
                  { label: 'Name', value: clientInfo.name, color: borderColor, size: 'text-xl' },
                  { label: 'Token', value: clientInfo.token, color: accentColor, size: 'text-lg font-mono' },
                  clientInfo.breed && { label: 'Pet', value: `🐕 ${clientInfo.breed}` },
                  clientInfo.mobile && { label: 'Mobile', value: clientInfo.mobile },
                  { label: 'Visits', value: `${clientInfo.currentVisits || 0}/${clientInfo.requiredVisits || 10}`, color: accentColor, size: 'text-2xl' },
                ].filter(Boolean).map(({ label, value, color, size }, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                    <span className={`font-bold ${size || 'text-sm'}`} style={color ? { color } : { color: '#374151' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={cancelSearch}
                className="bg-gray-100 text-gray-600 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition">Cancel</button>
              <button onClick={confirmAddStamp} disabled={loading}
                className="text-white py-4 rounded-2xl font-bold transition-all duration-200 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: accentColor }}>
                {loading ? (
                  <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Adding…</>
                ) : (
                  <><CheckCircle size={20} /> Add Stamp</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Toast */}
        {message && (
          <div className={`mt-6 p-4 rounded-2xl text-center font-semibold text-sm animate-slide-up ${
            message.includes('🎉') ? 'bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-800 border border-orange-200'
            : message.includes('✅') && (message.includes('Stamp added') || message.includes('SUCCESS')) ? 'bg-green-50 text-green-800 border border-green-200'
            : message.includes('✅') ? 'bg-blue-50 text-blue-800 border border-blue-200'
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

export default StaffPanel;
