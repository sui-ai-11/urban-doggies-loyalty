import React, { useState, useEffect, useCallback } from 'react';
import HomePage from './pages/HomePage';
import CustomerCard from './pages/CustomerCard';
import AdminPanel from './pages/AdminPanel';
import StaffPanel from './pages/StaffPanel';

function getRoute() {
  const hash = window.location.hash || '';
  const path = window.location.pathname || '/';
  const search = window.location.search || '';

  // Extract path from hash: "#/staff" -> "/staff", "#/card?token=X" -> "/card"
  if (hash && hash.length > 1) {
    const hashPath = hash.replace(/^#/, '').split('?')[0].toLowerCase();
    if (hashPath === '/admin') return 'admin';
    if (hashPath === '/staff') return 'staff';
    if (hashPath === '/card') return 'customer';
    return 'home';
  }

  // Fallback: pathname (for Vercel rewrites)
  const lowerPath = path.toLowerCase();
  if (lowerPath === '/admin') return 'admin';
  if (lowerPath === '/staff') return 'staff';
  if (lowerPath === '/card') return 'customer';

  // Fallback: token in query
  if (search.includes('token=')) return 'customer';

  return 'home';
}

function App() {
  const [currentView, setCurrentView] = useState(() => getRoute());

  useEffect(() => {
    const handleChange = () => {
      const newView = getRoute();
      setCurrentView(newView);
    };

    window.addEventListener('hashchange', handleChange);
    window.addEventListener('popstate', handleChange);

    // Also re-check on mount in case hash changed before listener was attached
    handleChange();

    return () => {
      window.removeEventListener('hashchange', handleChange);
      window.removeEventListener('popstate', handleChange);
    };
  }, []);

  switch (currentView) {
    case 'admin': return <AdminPanel />;
    case 'staff': return <StaffPanel />;
    case 'customer': return <CustomerCard />;
    default: return <HomePage />;
  }
}

export default App;
