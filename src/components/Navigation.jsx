import React, { useState, useEffect } from 'react';
import { Home, Users, Settings, Menu, X } from 'lucide-react';

function Navigation({ currentPage }) {
  const [businessInfo, setBusinessInfo] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch('/api/get-business-info')
      .then(r => r.json())
      .then(data => setBusinessInfo(data))
      .catch(err => console.error('Nav error:', err));
  }, []);

  const accentColor = businessInfo?.accentColor || '#17BEBB';
  const borderColor = businessInfo?.borderColor || '#1F3A93';

  const links = [
    { key: 'home', href: '/#/', label: 'Home', icon: Home },
    { key: 'staff', href: '/#/staff', label: 'Loyalty Desk', icon: Users },
    { key: 'admin', href: '/#/admin', label: 'Client Management', icon: Settings },
  ];

  return (
    <nav className="relative z-20" style={{ backgroundColor: borderColor }}>
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <a href="/#/" className="flex items-center gap-3">
            {businessInfo?.logo ? (
              <img src={businessInfo.logo} alt={businessInfo.businessName}
                className="h-12 w-12 object-contain rounded-xl bg-white bg-opacity-10 p-1.5"
                onError={(e) => (e.target.style.display = 'none')} />
            ) : (
              <div className="h-12 w-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg"
                style={{ backgroundColor: accentColor }}>
                {businessInfo?.businessName?.charAt(0) || 'B'}
              </div>
            )}
            <span className="text-xl font-bold text-white tracking-tight hidden sm:inline">
              {businessInfo?.businessName || 'Business'}
            </span>
          </a>

          <div className="hidden md:flex gap-2">
            {links.map(({ key, href, label, icon: Icon }) => (
              <a key={key} href={href}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 text-white"
                style={{ backgroundColor: currentPage === key ? accentColor : 'rgba(255,255,255,0.1)' }}>
                <Icon className="w-4 h-4" /> {label}
              </a>
            ))}
          </div>

          <button className="md:hidden p-2 rounded-xl text-white"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden mt-3 flex flex-col gap-2 pb-2 animate-slide-up">
            {links.map(({ key, href, label, icon: Icon }) => (
              <a key={key} href={href}
                className="px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-3 text-white"
                style={{ backgroundColor: currentPage === key ? accentColor : 'rgba(255,255,255,0.1)' }}
                onClick={() => setMobileOpen(false)}>
                <Icon className="w-5 h-5" /> {label}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
