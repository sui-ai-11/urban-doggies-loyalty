import React, { useState } from 'react';
import { Star, Gift, MessageCircle, Phone, Users, Plus, Search, QrCode, Home, CheckCircle, ArrowLeft, ChevronDown, X } from 'lucide-react';

// MOCK DATABASE - Will be replaced with Google Sheets later
const mockDatabase = {
  business: {
    id: 'UD001',
    name: 'Urban Doggies',
    tagline: 'UD GROOMING LOYALTY CARD',
    color: '#06B6D4',
    requiredVisits: 10,
    phone: '+63 922 853 1533',
    viber: '+63 922 823 4849',
    logoUrl: '',
    adImageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800'
  },
  clients: [
    { id: '1', name: 'Maria Santos', phone: '+63 922 123 4567', token: 'maria123', stamps: 7, birthday: '1995-02-15', breed: 'Golden Retriever' },
    { id: '2', name: 'Juan Dela Cruz', phone: '+63 922 234 5678', token: 'juan456', stamps: 3, birthday: '1988-01-20', breed: 'Labrador' },
    { id: '3', name: 'Ana Garcia', phone: '+63 922 345 6789', token: 'ana789', stamps: 9, birthday: '1992-12-05', breed: 'Shih Tzu' },
  ],
  coupons: [
    { 
      id: '1', 
      clientId: '1', 
      type: 'birthday', 
      title: '🎂 Birthday Special',
      description: '50% off grooming on your birthday month',
      validUntil: 'Feb 28, 2026',
      isActive: true,
      qrCode: 'BDAY-001'
    },
    { 
      id: '2', 
      clientId: '1', 
      type: 'breed', 
      title: 'Breed of the Month',
      description: 'Free nail trim for Golden Retrievers',
      validUntil: 'Jan 31, 2026',
      isActive: true,
      qrCode: 'BREED-002'
    }
  ]
};

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState(mockDatabase.clients);
  const [coupons] = useState(mockDatabase.coupons);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [cardTab, setCardTab] = useState('stamps');
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const showNotification = (message) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // CLIENT CARD VIEW
  const ClientCardView = ({ client }) => {
    const business = mockDatabase.business;
    const stamps = client.stamps;
    const required = business.requiredVisits;
    const clientCoupons = coupons.filter(c => c.clientId === client.id);
    const activeCoupons = clientCoupons.filter(c => c.isActive);
    const [showHistory] = useState(false);

    const StampsTab = () => (
      <div className="space-y-6">
        <div className="text-center py-4">
          <h2 className="text-gray-800 text-3xl font-bold mb-2">Hey, {client.name.split(' ')[0]}!</h2>
          <p className="text-gray-600 text-sm">See your grooming progress and rewards.</p>
        </div>

        {business.adImageUrl && (
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img 
              src={business.adImageUrl} 
              alt="Featured product"
              className="w-full h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => showNotification('💡 Product showcase space!')}
            />
          </div>
        )}

        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: required }, (_, i) => {
            const stampNum = i + 1;
            const isFilled = stampNum <= stamps;
            const isReward = stampNum === 5 || stampNum === 10;
            
            return (
              <div key={stampNum} className="flex flex-col items-center">
                {isReward ? (
                  <>
                    <div className={`w-16 h-16 rounded-full ${
                      isFilled
                        ? stampNum === 5 ? 'bg-orange-400' : 'bg-cyan-500'
                        : stampNum === 5 ? 'border-4 border-orange-200 bg-orange-50' : 'border-4 border-cyan-200 bg-cyan-50'
                    } flex items-center justify-center text-white text-2xl font-bold shadow-md`}>
                      {stampNum === 5 ? '%' : <Gift className="w-8 h-8" />}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className={`w-3 h-3 ${stampNum === 5 ? 'text-orange-400' : 'text-cyan-500'}`} fill="currentColor" />
                      <span className={`${stampNum === 5 ? 'text-orange-400' : 'text-cyan-500'} text-xs font-bold`}>
                        {stampNum === 5 ? '10% OFF' : 'TREATS!'}
                      </span>
                    </div>
                  </>
                ) : isFilled ? (
                  <div className="w-16 h-16 rounded-full bg-cyan-500 flex flex-col items-center justify-center text-white shadow-md">
                    <span className="text-xs font-semibold">Jan {stampNum}</span>
                    <span className="text-xs font-semibold">2026</span>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full border-4 border-gray-300 flex items-center justify-center text-gray-400 text-xl font-bold">
                    {stampNum}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <h3 className="text-gray-800 font-bold text-lg mb-3">Rewards:</h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Star className="w-4 h-4 text-orange-400 mt-0.5" fill="currentColor" />
              <p className="text-gray-700 text-sm"><span className="font-semibold">5th grooming:</span> 10% off</p>
            </div>
            <div className="flex items-start gap-2">
              <Star className="w-4 h-4 text-cyan-500 mt-0.5" fill="currentColor" />
              <p className="text-gray-700 text-sm"><span className="font-semibold">10th grooming:</span> Premium dog treats</p>
            </div>
          </div>
        </div>
      </div>
    );

    const RewardsTab = () => (
      <div className="space-y-4">
        <div className="text-center py-2">
          <h2 className="text-gray-800 text-2xl font-bold mb-1">Your Rewards</h2>
          <p className="text-gray-600 text-sm">Tap any coupon to show QR code</p>
        </div>

        {activeCoupons.length > 0 ? (
          <div className="space-y-4">
            {activeCoupons.map((coupon, idx) => (
              <div 
                key={coupon.id} 
                onClick={() => {
                  setSelectedCoupon(coupon);
                  setShowQRModal(true);
                }}
                className={`${idx === 0 ? 'bg-cyan-400' : 'bg-blue-600'} rounded-2xl p-6 relative overflow-hidden shadow-lg cursor-pointer hover:scale-105 transition-transform`}
              >
                <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-xs font-semibold text-cyan-600">
                  EXCLUSIVE
                </div>
                <Star className="w-8 h-8 text-white mb-3" fill="white" />
                <h3 className="text-white text-2xl font-bold mb-2">{coupon.title}</h3>
                <p className="text-white text-sm mb-4 leading-relaxed">{coupon.description}</p>
                <div className="flex justify-between items-center">
                  <p className="text-white/90 text-xs">Valid until: {coupon.validUntil}</p>
                  <QrCode className="w-5 h-5 text-white" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">No active rewards yet</p>
          </div>
        )}
      </div>
    );

    const MessageTab = () => (
      <div className="space-y-4">
        <div className="text-center py-2">
          <h2 className="text-gray-800 text-2xl font-bold mb-1">Contact Us</h2>
          <p className="text-gray-600 text-sm">Get in touch with our team</p>
        </div>

        <button 
          onClick={() => showNotification('Opening Viber...')}
          className="w-full bg-purple-500 hover:bg-purple-600 rounded-2xl p-6 text-left shadow-lg transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white text-xl font-bold mb-1">Message via Viber</h3>
              <p className="text-white/90 text-sm">{business.viber}</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => showNotification('Opening phone dialer...')}
          className="w-full bg-cyan-400 hover:bg-cyan-500 rounded-2xl p-6 text-left shadow-lg transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <Phone className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white text-xl font-bold mb-1">Call Us</h3>
              <p className="text-white/90 text-sm">{business.phone}</p>
            </div>
          </div>
        </button>
      </div>
    );

    return (
      <div className="min-h-screen bg-cyan-400 p-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <button 
            onClick={() => setCurrentView('home')}
            className="text-white mb-4 flex items-center gap-2 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>

          <div className="text-center mb-6">
            <h1 className="text-gray-800 text-lg font-semibold tracking-wide">{business.tagline}</h1>
          </div>

          <div className="bg-gray-100 rounded-3xl border-4 border-blue-600 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex flex-col">
                <div className="w-16 h-8 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-orange-400 relative">
                  <div className="absolute inset-0 bg-gray-100 rounded-full" style={{ clipPath: 'inset(50% 0 0 0)' }}></div>
                </div>
              </div>
              <div className="flex-1">
                <span className="text-blue-800 text-3xl font-bold">urban</span>
                <span className="text-cyan-400 text-3xl font-bold">doggies</span>
              </div>
            </div>

            <div className="mb-6">
              {cardTab === 'stamps' && <StampsTab />}
              {cardTab === 'rewards' && <RewardsTab />}
              {cardTab === 'message' && <MessageTab />}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setCardTab('stamps')}
                className={`rounded-xl py-4 px-3 font-semibold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                  cardTab === 'stamps' ? 'bg-blue-900 text-white shadow-lg scale-105' : 'bg-blue-800 text-white hover:bg-blue-900'
                }`}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
                <span>Stamps</span>
              </button>
              
              <button 
                onClick={() => setCardTab('rewards')}
                className={`rounded-xl py-4 px-3 font-semibold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                  cardTab === 'rewards' ? 'bg-cyan-500 text-white shadow-lg scale-105' : 'bg-cyan-400 text-white hover:bg-cyan-500'
                }`}
              >
                <Gift className="w-6 h-6" />
                <span>Rewards</span>
              </button>
              
              <button 
                onClick={() => setCardTab('message')}
                className={`rounded-xl py-4 px-3 font-semibold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                  cardTab === 'message' ? 'bg-orange-500 text-white shadow-lg scale-105' : 'bg-orange-400 text-white hover:bg-orange-500'
                }`}
              >
                <MessageCircle className="w-6 h-6" />
                <span>Message</span>
              </button>
            </div>
          </div>
        </div>

        {showQRModal && selectedCoupon && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowQRModal(false)}>
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedCoupon.title}</h3>
              <p className="text-sm text-gray-600 mb-6">{selectedCoupon.description}</p>
              
              <div className="bg-white border-4 border-gray-200 rounded-2xl p-6 mb-6">
                <div className="w-48 h-48 mx-auto bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="w-24 h-24 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs font-mono text-gray-600">{selectedCoupon.qrCode}</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ADMIN VIEW
  const AdminView = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const business = mockDatabase.business;
    const filteredClients = clients.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
    );

    const handleAddStamp = (clientId) => {
      setClients(clients.map(c => c.id === clientId ? { ...c, stamps: c.stamps + 1 } : c));
      showNotification('✅ Stamp added successfully!');
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
                ) : (
                  <span className="text-blue-600 font-bold text-xl">{business.name.substring(0, 2)}</span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold">{business.name}</h1>
                <p className="text-xs text-blue-100">Admin Dashboard</p>
              </div>
            </div>
            <button onClick={() => setCurrentView('home')} className="bg-blue-700 px-4 py-2 rounded-lg text-sm hover:bg-blue-800">
              <Home className="w-4 h-4 inline mr-2" />Home
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow">
              <div className="text-3xl font-bold text-blue-600">{clients.length}</div>
              <div className="text-sm text-gray-600">Total Clients</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow">
              <div className="text-3xl font-bold text-green-600">{clients.reduce((sum, c) => sum + c.stamps, 0)}</div>
              <div className="text-sm text-gray-600">Total Stamps</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow">
              <div className="text-3xl font-bold text-orange-600">{coupons.filter(c => c.isActive).length}</div>
              <div className="text-sm text-gray-600">Active Coupons</div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-3">
            {filteredClients.map(client => (
              <div key={client.id} className="bg-white rounded-xl p-4 shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800">{client.name}</h3>
                    <p className="text-sm text-gray-600">📱 {client.phone} • 🐕 {client.breed}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-gray-600">Stamps: <span className="font-bold">{client.stamps}/10</span></span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleAddStamp(client.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />Add Stamp
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClient(client);
                        setCardTab('stamps');
                        setCurrentView('card');
                      }}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200"
                    >
                      <QrCode className="w-4 h-4 inline mr-1" />View Card
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // HOME VIEW
  const HomeView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-600 p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="text-center text-white mb-12">
          <h1 className="text-4xl font-bold mb-3">Urban Doggies</h1>
          <p className="text-xl text-blue-100">Digital Loyalty System</p>
          <p className="text-sm text-blue-200 mt-2">Professional White Label Solution</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => {
              setSelectedClient(clients[0]);
              setCardTab('stamps');
              setCurrentView('card');
            }}
            className="bg-white rounded-2xl p-6 hover:shadow-2xl transition-all hover:scale-105"
          >
            <div className="bg-cyan-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-cyan-600" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-800">Client Card</h3>
            <p className="text-sm text-gray-600">View loyalty card demo</p>
          </button>

          <button
            onClick={() => setCurrentView('admin')}
            className="bg-white rounded-2xl p-6 hover:shadow-2xl transition-all hover:scale-105"
          >
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-800">Admin Dashboard</h3>
            <p className="text-sm text-gray-600">Manage clients</p>
          </button>
        </div>

        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
          <h4 className="font-bold mb-3 text-lg">✨ White Label Features:</h4>
          <ul className="space-y-2 text-sm">
            <li>✅ Custom branding per client</li>
            <li>✅ Logo & color customization</li>
            <li>✅ Product showcase space</li>
            <li>✅ QR code coupons</li>
            <li>✅ Auto birthday coupons</li>
            <li>✅ Viber & phone integration</li>
            <li>✅ Google Sheets backend</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {currentView === 'home' && <HomeView />}
      {currentView === 'card' && selectedClient && <ClientCardView client={selectedClient} />}
      {currentView === 'admin' && <AdminView />}
      
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}
    </>
  );
}

export default App;
```

4. Click **"Commit new file"**

---

## **FILE 9 of 9: `.gitignore`**

1. Click **"Add file" → "Create new file"**
2. Name: `.gitignore`
3. Paste this:
```
# Dependencies
node_modules

# Production
dist
build

# Local env files
.env
.env.local
.env.production.local

# IDE
.vscode
.idea

# OS
.DS_Store
Thumbs.db
