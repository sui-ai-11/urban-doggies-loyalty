import React, { useState, useEffect, useRef } from 'react';
import Navigation from '../components/Navigation';
import BrandingTab from '../components/BrandingTab';
import SettingsTab from '../components/SettingsTab';
import CouponsTab from '../components/CouponsTab';
import { BarChart3, Users, UserPlus, Upload, Copy, ExternalLink, Search, Filter, Palette, Settings, Gift, Lock, Trash2, Pencil, Download, X } from 'lucide-react';

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
  const [pinAttempts, setPinAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(null);
  const [sessionToken, setSessionToken] = useState('');
  const sessionRef = useRef('');
  useEffect(() => { sessionRef.current = sessionToken; }, [sessionToken]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activityFilter, setActivityFilter] = useState(null);
  const [allClients, setAllClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const defaultAnalytics = { totalClients: 0, totalVisits: 0, stampsToday: 0, rewardsIssued: 0, repeatRate: 0, repeatClients: 0, avgVisits: '0', avgDaysBetween: 0, active30: 0, active60: 0, active90: 0, inactive: 0, weeklyRegistrations: [0,0,0,0], couponsIssued: 0, couponsRedeemed: 0, couponsVoided: 0, couponsActive: 0, redemptionRate: 0, branchStats: {} };
  const [analytics, setAnalytics] = useState(defaultAnalytics);
  const [breeds, setBreeds] = useState([]);
  const [birthdayMonths, setBirthdayMonths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [businessInfo, setBusinessInfo] = useState(null);
  const [couponsList, setCouponsList] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedBreed, setSelectedBreed] = useState('all');
  const [allBreeds, setAllBreeds] = useState([]);
  const [sortBy, setSortBy] = useState('name');

  const [newClient, setNewClient] = useState({
    firstName: '', lastName: '', mobile: '', email: '', birthday: '', birthdayMonth: ''
  });

  const [editingClient, setEditingClient] = useState(null);
  const [expandedPetsClient, setExpandedPetsClient] = useState(null);
  const [clientPets, setClientPets] = useState([]);
  const [petForm, setPetForm] = useState({ name: '', type: 'dog', breed: '', birthdayMonth: '', instructions: '', profileImage: '' });
  const [editingPet, setEditingPet] = useState(null);
  const [petLoading, setPetLoading] = useState(false);
  const hasPetsFeature = businessInfo?.features?.pets === true;
  const [editForm, setEditForm] = useState({ name: '', mobile: '', email: '', birthday: '', notes: '' });
  const [importStatus, setImportStatus] = useState(null);

  // Load business info for dynamic colors
  useEffect(() => {
    fetch('/api/get-business-info')
      .then(r => r.json())
      .then(data => setBusinessInfo(data))
      .catch(err => console.error('Error loading business info:', err));
  }, []);

  // Load protected data only after auth
  useEffect(() => {
    if (!sessionToken) return;
    authFetch('/api/manage-coupons')
      .then(r => r.json())
      .then(data => setCouponsList(data.coupons || []))
      .catch(err => console.error('Error loading coupons:', err));
    loadAllClients();
  }, [sessionToken]);

  useEffect(() => {
    if (!sessionToken) return;
    if (activeTab === 'dashboard' || activeTab === 'clients') loadAllClients();
  }, [activeTab]);

  useEffect(() => {
    let filtered = [...allClients];
    if (activityFilter && analytics) {
      var ids = analytics[activityFilter + 'Ids'] || [];
      filtered = filtered.filter(c => ids.includes(c.clientID));
    }
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
    if (selectedBreed !== 'all') filtered = filtered.filter(c => (c.breeds || []).some(b => b === selectedBreed));
    if (selectedBreed !== 'all') filtered = filtered.filter(c => c.breeds && c.breeds.includes(selectedBreed));
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'visits-high': return b.visits - a.visits;
        case 'visits-low': return a.visits - b.visits;
        default: return 0;
      }
    });
    setFilteredClients(filtered);
  }, [allClients, searchQuery, selectedMonth, selectedBreed, sortBy, activityFilter, analytics]);

  async function loadAllClients() {
    try {
      setLoading(true);
      const response = await authFetch('/api/get-all-clients');
      const data = await response.json();
      if (response.ok) {
        setAllClients(data.clients || []);
        setBreeds(data.breeds || []);
        setBirthdayMonths(data.birthdayMonths || []);
        setAllBreeds(data.breeds || []);
        setAllBreeds(data.breeds || []);
        setAnalytics(Object.assign({}, defaultAnalytics, data.analytics || {}));
      }
    } catch (error) { console.error('Error loading clients:', error); }
    finally { setLoading(false); }
  }

  // === PET MANAGEMENT ===
  async function loadPets(clientID) {
    setPetLoading(true);
    try {
      var r = await authFetch('/api/manage-pets?clientID=' + clientID);
      var data = await r.json();
      setClientPets(data.pets || []);
    } catch (e) { console.error('Load pets error:', e); }
    finally { setPetLoading(false); }
  }

  function togglePets(clientID) {
    if (expandedPetsClient === clientID) {
      setExpandedPetsClient(null);
      setClientPets([]);
      setEditingPet(null);
    } else {
      setExpandedPetsClient(clientID);
      loadPets(clientID);
      setEditingPet(null);
      setPetForm({ name: '', type: 'dog', breed: '', birthdayMonth: '', instructions: '', profileImage: '' });
    }
  }

  async function addPet(clientID) {
    if (!petForm.name.trim()) return;
    try {
      await authFetch('/api/manage-pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientID, ...petForm }),
      });
      setPetForm({ name: '', type: 'dog', breed: '', birthdayMonth: '', instructions: '', profileImage: '' });
      loadPets(clientID);
    } catch (e) { console.error('Add pet error:', e); }
  }

  async function updatePet(petID, clientID) {
    try {
      await authFetch('/api/manage-pets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petID, ...petForm }),
      });
      setEditingPet(null);
      loadPets(clientID);
    } catch (e) { console.error('Update pet error:', e); }
  }

  async function deletePet(petID, petName, clientID) {
    if (!confirm('Delete pet "' + petName + '"?')) return;
    try {
      await authFetch('/api/manage-pets?petID=' + petID, { method: 'DELETE' });
      loadPets(clientID);
    } catch (e) { console.error('Delete pet error:', e); }
  }

  async function uploadPetImage(file) {
    return new Promise(function(resolve) {
      var reader = new FileReader();
      reader.onload = async function() {
        try {
          var r = await authFetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageData: reader.result, fileName: file.name }),
          });
          var data = await r.json();
          resolve(data.url || '');
        } catch (e) { resolve(''); }
      };
      reader.readAsDataURL(file);
    });
  }

  async function deleteClient(clientID, name) {
    if (!confirm('Delete "' + name + '" and all their stamps and coupons? This cannot be undone.')) return;
    try {
      var r = await authFetch('/api/manage-client?clientID=' + clientID, { method: 'DELETE' });
      var data = await r.json();
      if (data.success) { setMessage('✅ ' + name + ' deleted'); loadAllClients(); }
      else setMessage('❌ ' + (data.error || 'Failed'));
    } catch (e) { setMessage('❌ Failed to delete'); }
  }

  function startEdit(client) {
    setEditingClient(client.clientID);
    setEditForm({
      name: client.name || '',
      mobile: client.mobile || '',
      email: client.email || '',
      birthday: client.birthday || '',
      notes: client.notes || '',
    });
  }

  async function saveEdit() {
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var bdayMonth = '';
    if (editForm.birthday) {
      var d = new Date(editForm.birthday);
      if (!isNaN(d.getTime())) bdayMonth = months[d.getMonth()];
    }
    try {
      var r = await authFetch('/api/manage-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          clientID: editingClient,
          name: editForm.name,
          mobile: editForm.mobile,
          email: editForm.email,
          birthday: editForm.birthday,
          birthdayMonth: bdayMonth,
          notes: editForm.notes,
        }),
      });
      var data = await r.json();
      if (data.success) { setMessage('✅ Client updated'); setEditingClient(null); loadAllClients(); }
      else setMessage('❌ ' + (data.error || 'Failed'));
    } catch (e) { setMessage('❌ Failed to update'); }
  }

  function exportCSV() {
    var headers = ['Name','Token','Mobile','Email','Birthday','Birthday Month','Visits','Status','Date Added'];
    var rows = allClients.map(function(c) {
      return [c.name, c.token, c.mobile, c.email, c.birthday, c.birthdayMonth, c.visits, c.status, c.dateAdded].map(function(v) {
        var s = String(v || '');
        return s.indexOf(',') > -1 || s.indexOf('"') > -1 ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',');
    });
    var csv = headers.join(',') + '\n' + rows.join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'clients_export_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    setMessage('✅ CSV exported');
  }

  function handleImportCSV(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = async function(ev) {
      var text = ev.target.result;
      var lines = text.split('\n').filter(function(l) { return l.trim(); });
      if (lines.length < 2) { setMessage('❌ CSV is empty'); return; }

      // Parse header - strip BOM and clean
      var headerLine = lines[0].replace(/^\uFEFF/, '').replace(/\r/g, '').toLowerCase();
      var headers = headerLine.split(',').map(function(h) { return h.trim().replace(/"/g, '').replace(/[^\w\s]/g, '').trim(); });
      var nameIdx = headers.findIndex(function(h) { return h === 'name' || h === 'client name' || h === 'fullname' || h === 'full name'; });
      var mobileIdx = headers.findIndex(function(h) { return h === 'mobile' || h === 'phone' || h === 'mobile number'; });
      var emailIdx = headers.findIndex(function(h) { return h === 'email' || h === 'email address'; });
      var bdayIdx = headers.findIndex(function(h) { return h === 'birthday' || h === 'birthdate' || h === 'date of birth'; });
      var notesIdx = headers.findIndex(function(h) { return h === 'notes' || h === 'note'; });

      if (nameIdx === -1) { setMessage('❌ CSV must have a "Name" column'); return; }

      var clients = [];
      for (var i = 1; i < lines.length; i++) {
        var cols = lines[i].split(',').map(function(c) { return c.trim().replace(/"/g, ''); });
        var name = cols[nameIdx] || '';
        if (!name) continue;
        clients.push({
          name: name,
          mobile: mobileIdx > -1 ? cols[mobileIdx] || '' : '',
          email: emailIdx > -1 ? cols[emailIdx] || '' : '',
          birthday: bdayIdx > -1 ? cols[bdayIdx] || '' : '',
          notes: notesIdx > -1 ? cols[notesIdx] || '' : '',
        });
      }

      if (clients.length === 0) { setMessage('❌ No valid rows found'); return; }

      setImportStatus('Importing ' + clients.length + ' clients...');
      try {
        var r = await authFetch('/api/manage-client', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'import', clients: clients }),
        });
        var data = await r.json();
        setImportStatus(null);
        setMessage('✅ ' + data.message);
        if (data.errors && data.errors.length > 0) {
          console.log('Import errors:', data.errors);
        }
        loadAllClients();
      } catch (err) { setImportStatus(null); setMessage('❌ Import failed'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleAddClient(e) {
    e.preventDefault();
    if (!newClient.firstName.trim() || !newClient.lastName.trim()) { setMessage('⚠️ First name and last name are required'); return; }
    if (!newClient.mobile.trim()) { setMessage('⚠️ Mobile number is required'); return; }
    if (!newClient.birthday) { setMessage('⚠️ Birthday is required'); return; }
    var fullName = newClient.firstName.trim() + ' ' + newClient.lastName.trim();
    try {
      setLoading(true); setMessage('');
      const response = await authFetch('/api/add-client', {
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
  // Authenticated fetch helper
  function authFetch(url, options) {
    var opts = options || {};
    opts.headers = Object.assign({}, opts.headers || {}, {
      'Authorization': 'Bearer ' + sessionRef.current,
    });
    return fetch(url, opts);
  }

  const bgColor = businessInfo?.backgroundColor || '#f9fafb';
  const accentColor = businessInfo?.accentColor || '#6b7280';
  const borderColor = businessInfo?.borderColor || '#374151';
  const cardBg = businessInfo?.cardBackground || '#f8f8f8';

  // Smart text colors for admin panels (white/light card backgrounds)
  function isLight(hex) {
    const c = (hex || '#000').replace('#','');
    return (0.299*parseInt(c.substring(0,2),16) + 0.587*parseInt(c.substring(2,4),16) + 0.114*parseInt(c.substring(4,6),16))/255 > 0.6;
  }
  // For text on white panels: use borderColor if dark enough, otherwise use dark fallback
  const panelText = isLight(borderColor) ? '#1a1a2e' : borderColor;
  // For accent on white panels: use accentColor if dark enough, otherwise use dark fallback
  const panelAccent = isLight(accentColor) ? '#1a1a2e' : accentColor;
  const btnOnAccent = isLight(accentColor) ? '#1a1a2e' : '#ffffff';
  const btnOnBorder = isLight(borderColor) ? '#1a1a2e' : '#ffffff';

  // Don't render until we have business colors
  if (!businessInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gray-400"></div>
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
  var adminPin = (businessInfo && businessInfo.adminPin) || '123456';

  function checkPin() {
    if (lockUntil && new Date() < lockUntil) {
      var mins = Math.ceil((lockUntil - new Date()) / 60000);
      setPinError('Too many attempts. Try again in ' + mins + ' min');
      return;
    }
    if (lockUntil && new Date() >= lockUntil) {
      setLockUntil(null);
      setPinAttempts(0);
    }
    fetch('/api/auth-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pinInput, role: 'admin' })
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.sessionToken) {
          setSessionToken(data.sessionToken);
          setIsLocked(false);
          setPinError('');
          setPinAttempts(0);
        } else {
          var newAttempts = pinAttempts + 1;
          setPinAttempts(newAttempts);
          if (newAttempts >= 5) {
            setLockUntil(new Date(Date.now() + 15 * 60 * 1000));
            setPinError('Too many attempts. Locked for 15 minutes');
            setPinInput('');
          } else {
            setPinError('Incorrect PIN (' + (5 - newAttempts) + ' attempts left)');
            setPinInput('');
          }
        }
      })
      .catch(function() { setPinError('Connection error'); });
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
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ backgroundColor: accentColor + '15' }}>
            <Lock size={24} color={accentColor} />
          </div>
          <h2 className="text-lg font-bold mb-1" style={{ color: panelText }}>Client Management</h2>
          <p className="text-gray-400 text-xs mb-5">Enter PIN to access</p>
          <input type="password" value={pinInput}
            onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') checkPin(); }}
            placeholder="Enter 6-digit PIN"
            maxLength={6}
            disabled={lockUntil && new Date() < lockUntil}
            className="w-full px-5 py-3 text-center text-lg tracking-[0.25em] rounded-xl border-2 focus:outline-none mb-4 disabled:opacity-50"
            style={{ borderColor: pinError ? '#ef4444' : accentColor + '50', fontFamily: 'system-ui, -apple-system, sans-serif' }}
            autoFocus
            inputMode="numeric"
          />
          {pinError && <p className="text-red-500 text-xs font-semibold mb-3">{pinError}</p>}
          <button onClick={checkPin}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:shadow-lg"
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
            {activeTab === 'dashboard' && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6 tracking-tight" style={{ color: panelText }}>Analytics Dashboard</h2>

                {/* Top Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Total Clients', value: (analytics && analytics.totalClients) || 0, icon: '👥', bg: borderColor, text: btnOnBorder },
                    { label: 'Total Visits', value: (analytics && analytics.totalVisits) || 0, icon: '📊', bg: accentColor, text: btnOnAccent },
                    { label: 'Stamps Today', value: (analytics && analytics.stampsToday) || 0, icon: '🏷️', bg: borderColor + 'CC', text: btnOnBorder },
                    { label: 'Rewards Issued', value: (analytics && analytics.rewardsIssued) || 0, icon: '🎁', bg: accentColor + 'CC', text: btnOnAccent },
                  ].map((card, i) => (
                    <div key={i} className="rounded-xl p-4 shadow-sm transition-all hover:scale-105" style={{ backgroundColor: card.bg }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xl">{card.icon}</span>
                        <span className="text-2xl font-black" style={{ color: card.text }}>{card.value}</span>
                      </div>
                      <p className="text-xs font-medium" style={{ color: card.text, opacity: 0.7 }}>{card.label}</p>
                    </div>
                  ))}
                </div>

                {/* Retention & Frequency */}
                <div className="rounded-xl p-5 shadow-sm mb-6" style={{ backgroundColor: accentColor + '10', border: '1px solid ' + accentColor + '20' }}>
                  <h3 className="text-sm font-bold mb-4" style={{ color: panelText }}>📈 Retention & Frequency</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-black" style={{ color: accentColor }}>{analytics.repeatRate}%</p>
                      <p className="text-xs text-gray-400 mt-1">Repeat Visit Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black" style={{ color: accentColor }}>{analytics.avgVisits}</p>
                      <p className="text-xs text-gray-400 mt-1">Avg Visits / Client</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black" style={{ color: accentColor }}>{analytics.avgDaysBetween || '—'}</p>
                      <p className="text-xs text-gray-400 mt-1">Avg Days Between</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black" style={{ color: accentColor }}>{analytics.repeatClients}</p>
                      <p className="text-xs text-gray-400 mt-1">Repeat Clients</p>
                    </div>
                  </div>
                </div>

                {/* Active vs Inactive + New Registrations */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Active/Inactive */}
                  <div className="rounded-xl p-5 bg-white border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold mb-4" style={{ color: panelText }}>🟢 Client Activity</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Active (30 days)', value: analytics.active30, color: '#22c55e', key: 'active30' },
                        { label: 'Slowing (31-60 days)', value: analytics.active60, color: '#f59e0b', key: 'active60' },
                        { label: 'At Risk (61-90 days)', value: analytics.active90, color: '#f97316', key: 'active90' },
                        { label: 'Inactive (90+ days)', value: analytics.inactive, color: '#ef4444', key: 'inactive' },
                      ].map((row, i) => (
                        <button key={i} className="flex items-center justify-between w-full hover:bg-gray-50 rounded-lg px-2 py-1 transition"
                          onClick={() => { setActivityFilter(row.key); setActiveTab('clients'); }}>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }}></div>
                            <span className="text-xs text-gray-600">{row.label}</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: panelText }}>{row.value}</span>
                        </button>
                      ))}
                    </div>
                    {analytics.totalClients > 0 && (
                      <div className="mt-4 h-3 rounded-full overflow-hidden flex bg-gray-100">
                        {analytics.active30 > 0 && <div style={{ width: `${(analytics.active30/analytics.totalClients)*100}%`, backgroundColor: '#22c55e' }}></div>}
                        {analytics.active60 > 0 && <div style={{ width: `${(analytics.active60/analytics.totalClients)*100}%`, backgroundColor: '#f59e0b' }}></div>}
                        {analytics.active90 > 0 && <div style={{ width: `${(analytics.active90/analytics.totalClients)*100}%`, backgroundColor: '#f97316' }}></div>}
                        {analytics.inactive > 0 && <div style={{ width: `${(analytics.inactive/analytics.totalClients)*100}%`, backgroundColor: '#ef4444' }}></div>}
                      </div>
                    )}
                  </div>

                  {/* New Registrations */}
                  <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: borderColor + '08', border: '1px solid ' + borderColor + '15' }}>
                    <h3 className="text-sm font-bold mb-4" style={{ color: panelText }}>📅 New Registrations (Last 4 Weeks)</h3>
                    <div className="flex items-end gap-3 h-32">
                      {(analytics.weeklyRegistrations || [0,0,0,0]).map((count, i) => {
                        var max = Math.max(...(analytics.weeklyRegistrations || [1]));
                        var height = max > 0 ? Math.max((count / max) * 100, 8) : 8;
                        var labels = ['4 wks ago', '3 wks ago', '2 wks ago', 'This week'];
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                            <span className="text-xs font-bold mb-1" style={{ color: panelText }}>{count}</span>
                            <div className="w-full rounded-t-lg transition-all" style={{ height: `${height}%`, backgroundColor: i === 3 ? accentColor : accentColor + '40' }}></div>
                            <span className="text-[9px] text-gray-400 mt-1.5">{labels[i]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Coupon Breakdown */}
                <div className="rounded-xl p-5 shadow-sm mb-6" style={{ backgroundColor: borderColor + '10', border: '1px solid ' + borderColor + '20' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold" style={{ color: panelText }}>🎫 Coupon Performance</h3>
                    <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: accentColor + '15', color: accentColor }}>
                      {analytics.redemptionRate}% redemption rate
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Issued', value: analytics.couponsIssued, color: '#6b7280' },
                      { label: 'Active', value: analytics.couponsActive, color: '#3b82f6' },
                      { label: 'Redeemed', value: analytics.couponsRedeemed, color: '#22c55e' },
                      { label: 'Voided', value: analytics.couponsVoided, color: '#ef4444' },
                    ].map((item, i) => (
                      <div key={i} className="text-center py-3 rounded-lg" style={{ backgroundColor: item.color + '10' }}>
                        <p className="text-xl font-black" style={{ color: item.color }}>{item.value}</p>
                        <p className="text-[10px] font-medium text-gray-400 mt-1">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Branch Comparison */}
                {Object.keys(analytics.branchStats || {}).length > 1 && (
                  <div className="rounded-xl p-5 bg-white border border-gray-100 shadow-sm mb-6">
                    <h3 className="text-sm font-bold mb-4" style={{ color: panelText }}>🏢 Branch Comparison</h3>
                    <div className="space-y-3">
                      {Object.entries(analytics.branchStats).sort(function(a, b) { return b[1].visits - a[1].visits; }).map(function([branch, data], i) {
                        var maxVisits = Math.max(...Object.values(analytics.branchStats).map(function(b) { return b.visits; }));
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-gray-700">{branch}</span>
                              <span className="text-xs text-gray-400">{data.visits} visits · {data.coupons || 0} coupons</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${maxVisits > 0 ? (data.visits/maxVisits)*100 : 0}%`, backgroundColor: accentColor }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Top Customers */}
                <div className="rounded-xl p-5 shadow-sm mb-6" style={{ backgroundColor: accentColor + '08', border: '1px solid ' + accentColor + '15' }}>
                  <h3 className="text-sm font-bold mb-4" style={{ color: panelText }}>🏆 Top Customers</h3>
                  <div className="space-y-2">
                    {allClients.sort((a, b) => b.visits - a.visits).slice(0, 10).map((client, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50 transition">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-gray-300 w-6">{i + 1}</span>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{client.name}</p>
                            <p className="text-[10px] text-gray-400">Cards: {Math.floor(client.visits / (client.requiredVisits || 10))}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold" style={{ color: accentColor }}>{client.visits}</span>
                          <p className="text-[10px] text-gray-400">visits</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coupons Quick Link */}
                <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: accentColor, border: 'none' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: btnOnAccent }}>🎁 Manage Coupons</h3>
                      <p className="text-xs mt-1" style={{ color: btnOnAccent, opacity: 0.7 }}>{couponsList ? couponsList.length : 0} total coupons</p>
                    </div>
                    <button onClick={() => setActiveTab('coupons')}
                      className="text-xs font-bold px-4 py-2 rounded-lg transition hover:opacity-90"
                      style={{ color: accentColor, backgroundColor: btnOnAccent }}>
                      View All →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ ALL CLIENTS ═══ */}
            {activeTab === 'clients' && (
              <div className="animate-fade-in">
                {activityFilter && (
                  <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4">
                    <span className="text-xs font-medium text-amber-700">
                      Filtered: {activityFilter === 'active30' ? 'Active (30 days)' : activityFilter === 'active60' ? 'Slowing (31-60 days)' : activityFilter === 'active90' ? 'At Risk (61-90 days)' : 'Inactive (90+ days)'}
                    </span>
                    <button onClick={() => setActivityFilter(null)} className="text-xs font-bold text-amber-600 hover:text-amber-800 transition">✕ Clear</button>
                  </div>
                )}
                <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: panelText }}>
                    All Clients ({filteredClients.length})
                  </h2>
                  <div className="flex gap-2 flex-wrap">
                    <label className="px-4 py-2.5 rounded-xl font-semibold text-sm cursor-pointer hover:shadow-lg transition-all duration-200 flex items-center gap-2 border-2"
                      style={{ borderColor: accentColor, color: panelAccent }}>
                      <Upload size={16} /> Import CSV
                      <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                    </label>
                    <button onClick={exportCSV}
                      className="px-4 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-200 flex items-center gap-2 border-2"
                      style={{ borderColor: accentColor, color: panelAccent }}>
                      <Download size={16} /> Export CSV
                    </button>
                    <button onClick={() => setActiveTab('add')}
                      className="px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                      style={{ backgroundColor: accentColor, color: btnOnAccent }}>
                      <UserPlus size={18} /> Add New
                    </button>
                  </div>
                </div>
                {importStatus && (
                  <div className="mb-4 p-3 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold text-center border border-blue-200">
                    {importStatus}
                  </div>
                )}

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
                  {hasPetsFeature && allBreeds.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Breed</label>
                      <select value={selectedBreed} onChange={(e) => setSelectedBreed(e.target.value)}
                        className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-sm"
                        style={{ borderColor: `${accentColor}60`, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }}>
                        <option value="all">All Breeds</option>
                        {allBreeds.map(b =>
                          <option key={b} value={b}>{b}</option>
                        )}
                      </select>
                    </div>
                  )}
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
                            {['Name', 'Token', 'Mobile', 'Birthday', 'Visits', 'Actions'].map(h => (
                              <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredClients.map((client, i) => (
                            <React.Fragment key={i}>
                            <tr className="hover:bg-gray-50 transition-colors duration-150">
                              {editingClient === client.clientID ? (
                                <>
                                  <td className="px-5 py-3">
                                    <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                      className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                                  </td>
                                  <td className="px-5 py-3">
                                    <span className="font-mono font-bold text-sm" style={{ color: panelAccent }}>{client.token}</span>
                                  </td>
                                  <td className="px-5 py-3">
                                    <input type="tel" value={editForm.mobile} onChange={(e) => setEditForm({...editForm, mobile: e.target.value})}
                                      className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                                  </td>
                                  <td className="px-5 py-3">
                                    <input type="date" value={editForm.birthday} onChange={(e) => setEditForm({...editForm, birthday: e.target.value})}
                                      className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                                  </td>
                                  <td className="px-5 py-3">
                                    <span className="font-bold text-sm" style={{ color: panelAccent }}>{client.visits}</span>
                                  </td>
                                  <td className="px-5 py-3">
                                    <div className="flex gap-1">
                                      <button onClick={saveEdit} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-green-500 hover:bg-green-600 transition">Save</button>
                                      <button onClick={() => setEditingClient(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition">Cancel</button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
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
                                <span className="text-sm text-gray-600">{client.birthday || '—'}</span>
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
                                  <button onClick={() => startEdit(client)}
                                    className="p-1.5 hover:bg-blue-50 rounded-lg transition" title="Edit">
                                    <Pencil size={16} className="text-blue-400" />
                                  </button>
                                  {hasPetsFeature && (
                                    <button onClick={() => togglePets(client.clientID)}
                                      className="p-1.5 hover:bg-purple-50 rounded-lg transition" title="Pets"
                                      style={{ backgroundColor: expandedPetsClient === client.clientID ? accentColor + '20' : 'transparent' }}>
                                      <span style={{ fontSize: "14px" }}>🐾</span>
                                    </button>
                                  )}
                                  <button onClick={() => deleteClient(client.clientID, client.name)}
                                    className="p-1.5 hover:bg-red-50 rounded-lg transition" title="Delete">
                                    <Trash2 size={16} className="text-red-400" />
                                  </button>
                                </div>
                              </td>
                                </>
                              )}
                            </tr>
                            {/* Expandable Pets Row */}
                            {hasPetsFeature && expandedPetsClient === client.clientID && (
                              <tr>
                                <td colSpan="6" className="px-5 py-4" style={{ backgroundColor: accentColor + '08' }}>
                                  <div className="rounded-xl p-4" style={{ border: '1px solid ' + accentColor + '20' }}>
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: panelText }}>
                                        <span style={{ fontSize: "14px" }}>🐾</span> Pets for {client.name}
                                      </h4>
                                    </div>

                                    {petLoading ? (
                                      <p className="text-xs text-gray-400">Loading...</p>
                                    ) : (
                                      <>
                                        {/* Existing Pets */}
                                        <div className="space-y-3 mb-4">
                                          {clientPets.map(function(pet) {
                                            var isEditing = editingPet === pet.id;
                                            return (
                                              <div key={pet.id} className="bg-white rounded-lg p-3 flex gap-3 items-start" style={{ border: '1px solid ' + accentColor + '15' }}>
                                                {/* Profile Image */}
                                                <div className="flex-shrink-0">
                                                  {pet.profile_image ? (
                                                    <img src={pet.profile_image} alt={pet.name} className="w-14 h-14 rounded-lg object-cover" />
                                                  ) : (
                                                    <div className="w-14 h-14 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: accentColor + '15' }}>
                                                      {pet.type === 'cat' ? '🐱' : pet.type === 'other' ? '🐾' : '🐶'}
                                                    </div>
                                                  )}
                                                </div>

                                                {isEditing ? (
                                                  <div className="flex-1 space-y-2">
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                      <input type="text" value={petForm.name} onChange={(e) => setPetForm({...petForm, name: e.target.value})}
                                                        placeholder="Pet name" className="px-2 py-1.5 border rounded text-xs" />
                                                      <select value={petForm.type} onChange={(e) => setPetForm({...petForm, type: e.target.value})}
                                                        className="px-2 py-1.5 border rounded text-xs">
                                                        <option value="dog">Dog</option>
                                                        <option value="cat">Cat</option>
                                                        <option value="other">Other</option>
                                                      </select>
                                                      <input type="text" value={petForm.breed} onChange={(e) => setPetForm({...petForm, breed: e.target.value})}
                                                        placeholder="Breed" className="px-2 py-1.5 border rounded text-xs" />
                                                      <select value={petForm.birthdayMonth} onChange={(e) => setPetForm({...petForm, birthdayMonth: e.target.value})}
                                                        className="px-2 py-1.5 border rounded text-xs">
                                                        <option value="">Birthday Month</option>
                                                        {['January','February','March','April','May','June','July','August','September','October','November','December'].map(function(m) { return <option key={m} value={m}>{m}</option>; })}
                                                      </select>
                                                    </div>
                                                    <textarea value={petForm.instructions} onChange={(e) => setPetForm({...petForm, instructions: e.target.value})}
                                                      placeholder="Special instructions..." className="w-full px-2 py-1.5 border rounded text-xs" rows={2} />
                                                    <div className="flex items-center gap-2">
                                                      <label className="px-2 py-1 bg-gray-100 rounded text-xs cursor-pointer hover:bg-gray-200 transition">
                                                        📷 Photo
                                                        <input type="file" accept="image/*" className="hidden" onChange={async function(e) {
                                                          if (e.target.files[0]) { var url = await uploadPetImage(e.target.files[0]); if (url) setPetForm({...petForm, profileImage: url}); }
                                                        }} />
                                                      </label>
                                                      {petForm.profileImage && <span className="text-[10px] text-green-500">✓ Photo set</span>}
                                                    </div>
                                                    <div className="flex gap-1">
                                                      <button onClick={() => updatePet(pet.id, client.clientID)}
                                                        className="px-3 py-1 rounded text-xs font-bold text-white bg-green-500 hover:bg-green-600 transition">Save</button>
                                                      <button onClick={() => setEditingPet(null)}
                                                        className="px-3 py-1 rounded text-xs font-bold text-gray-500 hover:bg-gray-100 transition">Cancel</button>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <span className="font-bold text-sm" style={{ color: panelText }}>{pet.name}</span>
                                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: accentColor + '15', color: accentColor }}>
                                                        {pet.type || 'dog'}
                                                      </span>
                                                    </div>
                                                    {pet.breed && <p className="text-xs text-gray-500">{pet.breed}</p>}
                                                    {pet.birthday_month && <p className="text-[10px] text-gray-400">🎂 {pet.birthday_month}</p>}
                                                    {pet.instructions && <p className="text-xs text-gray-500 mt-1 italic">"{pet.instructions}"</p>}
                                                    <div className="flex gap-1 mt-2">
                                                      <button onClick={() => { setEditingPet(pet.id); setPetForm({ name: pet.name, type: pet.type || 'dog', breed: pet.breed || '', birthdayMonth: pet.birthday_month || '', instructions: pet.instructions || '', profileImage: pet.profile_image || '' }); }}
                                                        className="text-[10px] font-bold px-2 py-1 rounded hover:bg-blue-50 text-blue-500 transition">Edit</button>
                                                      <button onClick={() => deletePet(pet.id, pet.name, client.clientID)}
                                                        className="text-[10px] font-bold px-2 py-1 rounded hover:bg-red-50 text-red-400 transition">Delete</button>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                          {clientPets.length === 0 && <p className="text-xs text-gray-400">No pets registered yet</p>}
                                        </div>

                                        {/* Add New Pet Form */}
                                        {!editingPet && (
                                          <div className="bg-white rounded-lg p-3" style={{ border: '1px dashed ' + accentColor + '30' }}>
                                            <p className="text-xs font-bold mb-2" style={{ color: panelText }}>Add New Pet</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                                              <input type="text" value={petForm.name} onChange={(e) => setPetForm({...petForm, name: e.target.value})}
                                                placeholder="Pet name *" className="px-2 py-1.5 border rounded text-xs" />
                                              <select value={petForm.type} onChange={(e) => setPetForm({...petForm, type: e.target.value})}
                                                className="px-2 py-1.5 border rounded text-xs">
                                                <option value="dog">Dog</option>
                                                <option value="cat">Cat</option>
                                                <option value="other">Other</option>
                                              </select>
                                              <input type="text" value={petForm.breed} onChange={(e) => setPetForm({...petForm, breed: e.target.value})}
                                                placeholder="Breed" className="px-2 py-1.5 border rounded text-xs" />
                                              <select value={petForm.birthdayMonth} onChange={(e) => setPetForm({...petForm, birthdayMonth: e.target.value})}
                                                className="px-2 py-1.5 border rounded text-xs">
                                                <option value="">Birthday Month</option>
                                                {['January','February','March','April','May','June','July','August','September','October','November','December'].map(function(m) { return <option key={m} value={m}>{m}</option>; })}
                                              </select>
                                            </div>
                                            <textarea value={petForm.instructions} onChange={(e) => setPetForm({...petForm, instructions: e.target.value})}
                                              placeholder="Special instructions (e.g. 'sensitive skin, use gentle shampoo')" className="w-full px-2 py-1.5 border rounded text-xs mb-2" rows={2} />
                                            <div className="flex items-center gap-2">
                                              <label className="px-2 py-1 bg-gray-100 rounded text-xs cursor-pointer hover:bg-gray-200 transition">
                                                📷 Photo
                                                <input type="file" accept="image/*" className="hidden" onChange={async function(e) {
                                                  if (e.target.files[0]) { var url = await uploadPetImage(e.target.files[0]); if (url) setPetForm({...petForm, profileImage: url}); }
                                                }} />
                                              </label>
                                              {petForm.profileImage && <span className="text-[10px] text-green-500">✓ Photo uploaded</span>}
                                              <div className="flex-1"></div>
                                              <button onClick={() => addPet(client.clientID)}
                                                disabled={!petForm.name.trim()}
                                                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white transition disabled:opacity-50"
                                                style={{ backgroundColor: accentColor }}>
                                                + Add Pet
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                            </React.Fragment>
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
            {activeTab === 'branding' && <BrandingTab businessInfo={businessInfo} onUpdate={(data) => setBusinessInfo(data)} sessionToken={sessionToken} />}

            {activeTab === 'settings' && <SettingsTab businessInfo={businessInfo} onUpdate={(data) => setBusinessInfo(data)} sessionToken={sessionToken} />}

            {/* ═══ COUPONS ═══ */}
            {activeTab === 'coupons' && <CouponsTab businessInfo={businessInfo} sessionToken={sessionToken} />}
          </div>
        </div>

        {/* Toast */}
        {message && (
          <div className={`mt-4 px-4 py-3 rounded-xl text-center text-xs font-medium animate-slide-up ${
            message.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : message.includes('⚠️') ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {message.includes('Token:') ? (
              <div>
                <p className="mb-1">{message.split('Token:')[0]}</p>
                <p className="font-mono text-base tracking-widest font-bold" style={{ color: accentColor }}>
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
