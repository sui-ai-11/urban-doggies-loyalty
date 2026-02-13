import React, { useState, useEffect } from 'react';

function StaffPanel() {
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [clientInfo, setClientInfo] = useState(null);
  const [multipleResults, setMultipleResults] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);

  useEffect(function() {
    fetch('/api/get-business-info')
      .then(function(r) { return r.json(); })
      .then(function(data) { setBusinessInfo(data); })
      .catch(function(err) { console.error('Error loading business info:', err); });
  }, []);

  var bgColor = (businessInfo && businessInfo.backgroundColor) || '#1a1a2e';
  var accentColor = (businessInfo && businessInfo.accentColor) || '#7f5af0';
  var borderColor = (businessInfo && businessInfo.borderColor) || '#2cb67d';

  function isDark(hex) {
    if (!hex) return true;
    var c = hex.replace('#', '');
    var r = parseInt(c.substring(0, 2), 16);
    var g = parseInt(c.substring(2, 4), 16);
    var b = parseInt(c.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
  }

  var bgIsDark = isDark(bgColor);
  var heroText = bgIsDark ? '#ffffff' : borderColor;
  var heroSub = bgIsDark ? 'rgba(255,255,255,0.7)' : borderColor + '90';

  function searchCustomerByToken(token) {
    setLoading(true);
    setMessage('');
    setClientInfo(null);
    fetch('/api/client-dashboard?token=' + token)
      .then(function(r) {
        if (!r.ok) throw new Error('Customer not found');
        return r.json();
      })
      .then(function(result) {
        if (result.client) {
          setClientInfo({
            name: result.client.name,
            token: result.client.token,
            breed: result.client.breed,
            mobile: result.client.mobile,
            currentVisits: (result.loyalty && result.loyalty.totalVisits) || 0,
            requiredVisits: (result.business && result.business.requiredVisits) || 10
          });
          setMultipleResults(null);
          setMessage('Customer found! Review info and confirm to add stamp.');
        }
      })
      .catch(function(error) {
        setMessage('Error: ' + error.message);
        setClientInfo(null);
      })
      .finally(function() { setLoading(false); });
  }

  function searchCustomer(e) {
    e.preventDefault();
    if (!searchInput.trim()) {
      setMessage('Please enter a token or customer name');
      return;
    }
    setLoading(true);
    setMessage('');
    setClientInfo(null);
    var query = searchInput.toUpperCase();

    fetch('/api/client-dashboard?token=' + query)
      .then(function(r) {
        if (r.ok) return r.json();
        return fetch('/api/search-client?name=' + encodeURIComponent(searchInput))
          .then(function(r2) {
            if (!r2.ok) throw new Error('Customer not found');
            return r2.json();
          });
      })
      .then(function(result) {
        if (result.client) {
          setClientInfo({
            name: result.client.name,
            token: result.client.token,
            breed: result.client.breed,
            mobile: result.client.mobile,
            currentVisits: (result.loyalty && result.loyalty.totalVisits) || 0,
            requiredVisits: (result.business && result.business.requiredVisits) || 10
          });
          setMultipleResults(null);
          setMessage('Customer found! Review info and confirm to add stamp.');
        } else if (result.clients && result.clients.length > 1) {
          setMultipleResults(result.clients);
          setClientInfo(null);
          setMessage('Found ' + result.clients.length + ' customers. Please select:');
        } else if (result.clients && result.clients.length === 1) {
          var c = result.clients[0];
          setClientInfo({ name: c.name, token: c.token, breed: c.breed, mobile: c.mobile, currentVisits: 0, requiredVisits: 10 });
          setMultipleResults(null);
          setMessage('Customer found! Review info and confirm to add stamp.');
        } else {
          throw new Error('Customer not found');
        }
      })
      .catch(function(error) {
        setMessage('Error: ' + error.message);
        setClientInfo(null);
      })
      .finally(function() { setLoading(false); });
  }

  function confirmAddStamp() {
    if (!clientInfo) return;
    setLoading(true);
    setMessage('');
    fetch('/api/add-stamp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: clientInfo.token, businessID: 'BIZ_001', addedBy: 'staff' })
    })
      .then(function(r) { return r.json(); })
      .then(function(result) {
        if (result.error) throw new Error(result.error);
        if (result.rewardEarned) {
          setMessage('SUCCESS! ' + result.client.name + ' earned a reward: "' + result.rewardText + '"');
        } else {
          setMessage('Stamp added! ' + result.client.name + ' now has ' + result.totalVisits + ' visits.');
        }
        setTimeout(function() {
          setSearchInput('');
          setClientInfo(null);
          setMessage('');
        }, 4000);
      })
      .catch(function(error) { setMessage('Error: ' + error.message); })
      .finally(function() { setLoading(false); });
  }

  function cancelSearch() {
    setClientInfo(null);
    setSearchInput('');
    setMessage('');
    setMultipleResults(null);
  }

  function selectCustomer(customer) {
    setClientInfo({ name: customer.name, token: customer.token, breed: customer.breed, mobile: customer.mobile, currentVisits: 0, requiredVisits: 10 });
    setMultipleResults(null);
    setMessage('Customer selected! Review info and confirm to add stamp.');
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor }}>
      {/* Nav */}
      <nav style={{ backgroundColor: borderColor, padding: '12px 24px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/#/" style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', textDecoration: 'none' }}>
            {(businessInfo && businessInfo.businessName) || 'Business'}
          </a>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="/#/" style={{ color: 'white', padding: '6px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', backgroundColor: 'rgba(255,255,255,0.1)' }}>Home</a>
            <a href="/#/staff" style={{ color: 'white', padding: '6px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', backgroundColor: accentColor }}>Loyalty Desk</a>
            <a href="/#/admin" style={{ color: 'white', padding: '6px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', backgroundColor: 'rgba(255,255,255,0.1)' }}>Admin</a>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: heroText, fontSize: '36px', fontWeight: '900', marginBottom: '8px' }}>Loyalty Desk</h1>
          <p style={{ color: heroSub, fontSize: '16px' }}>Search by token or customer name</p>
        </div>

        {/* Search Form */}
        {!clientInfo && !multipleResults && (
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: accentColor, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <span style={{ color: 'white', fontSize: '28px' }}>🔍</span>
              </div>
              <h2 style={{ color: borderColor, fontSize: '22px', fontWeight: '700' }}>Customer Check-In</h2>
            </div>

            <form onSubmit={searchCustomer}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
                  Enter Token or Customer Name
                </label>
                <input
                  type="text"
                  value={searchInput}
                  onChange={function(e) { setSearchInput(e.target.value); }}
                  style={{ width: '100%', padding: '16px', fontSize: '18px', textAlign: 'center', border: '3px solid ' + accentColor, borderRadius: '16px', outline: 'none', boxSizing: 'border-box' }}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading || !searchInput.trim()}
                style={{ width: '100%', padding: '16px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', opacity: (loading || !searchInput.trim()) ? 0.5 : 1 }}
              >
                {loading ? 'Searching...' : '🔍 Search Customer'}
              </button>
            </form>
          </div>
        )}

        {/* Multiple Results */}
        {multipleResults && multipleResults.length > 1 && (
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: borderColor, fontSize: '22px', fontWeight: '700', textAlign: 'center', marginBottom: '16px' }}>Select Customer</h2>
            <div>
              {multipleResults.map(function(customer, i) {
                return (
                  <button key={i} onClick={function() { selectCustomer(customer); }}
                    style={{ width: '100%', backgroundColor: '#f9fafb', border: '2px solid ' + accentColor + '40', borderRadius: '16px', padding: '16px', textAlign: 'left', cursor: 'pointer', marginBottom: '8px', display: 'block' }}>
                    <p style={{ fontWeight: '700', color: borderColor, fontSize: '16px', margin: 0 }}>{customer.name}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>Token: {customer.token}</p>
                    {customer.mobile && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>Mobile: {customer.mobile}</p>}
                  </button>
                );
              })}
            </div>
            <button onClick={cancelSearch} style={{ width: '100%', padding: '14px', backgroundColor: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}>Cancel</button>
          </div>
        )}

        {/* Customer Info */}
        {clientInfo && message.indexOf('Stamp added') === -1 && message.indexOf('SUCCESS') === -1 && (
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#22c55e', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <span style={{ color: 'white', fontSize: '28px' }}>✓</span>
              </div>
              <h2 style={{ color: '#22c55e', fontSize: '22px', fontWeight: '700' }}>Customer Found!</h2>
            </div>

            <div style={{ backgroundColor: '#f9fafb', borderRadius: '16px', padding: '20px', marginBottom: '24px', border: '2px solid ' + accentColor + '30' }}>
              <div style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 0', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>Name</span>
                <span style={{ fontWeight: '700', color: borderColor, fontSize: '16px' }}>{clientInfo.name}</span>
              </div>
              <div style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 0', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>Token</span>
                <span style={{ fontWeight: '700', color: accentColor, fontSize: '16px', fontFamily: 'monospace' }}>{clientInfo.token}</span>
              </div>
              {clientInfo.breed && (
                <div style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>Pet</span>
                  <span style={{ color: '#374151' }}>🐕 {clientInfo.breed}</span>
                </div>
              )}
              {clientInfo.mobile && (
                <div style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>Mobile</span>
                  <span style={{ color: '#374151' }}>{clientInfo.mobile}</span>
                </div>
              )}
              <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>Visits</span>
                <span style={{ fontWeight: '700', color: accentColor, fontSize: '20px' }}>{clientInfo.currentVisits}/{clientInfo.requiredVisits}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button onClick={cancelSearch} style={{ padding: '14px', backgroundColor: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmAddStamp} disabled={loading}
                style={{ padding: '14px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
                {loading ? 'Adding...' : '✓ Add Stamp'}
              </button>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            borderRadius: '16px',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '14px',
            backgroundColor: message.indexOf('Error') > -1 ? '#fef2f2' : message.indexOf('SUCCESS') > -1 || message.indexOf('Stamp added') > -1 ? '#f0fdf4' : '#eff6ff',
            color: message.indexOf('Error') > -1 ? '#991b1b' : message.indexOf('SUCCESS') > -1 || message.indexOf('Stamp added') > -1 ? '#166534' : '#1e40af',
            border: '1px solid ' + (message.indexOf('Error') > -1 ? '#fecaca' : message.indexOf('SUCCESS') > -1 || message.indexOf('Stamp added') > -1 ? '#bbf7d0' : '#bfdbfe')
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default StaffPanel;
