import React, { useState, useEffect, useCallback } from 'react';
import HomePage from './pages/HomePage';
import CustomerCard from './pages/CustomerCard';
import AdminPanel from './pages/AdminPanel';
import StaffPanel from './pages/StaffPanel';

function getRoute(hash) {
  // Extract the path part from hash: "#/staff" -> "/staff", "#/card?token=X" -> "/card"
  const stripped = hash.replace(/^#/, '');
  const path = stripped.split('?')[0].toLowerCase();
  
  if (path === '/admin') return 'admin';
  if (path === '/staff') return 'staff';
  if (path === '/card') return 'customer';
  if (path === '/' || path === '') return 'home';
  return 'home';
}

function App() {
  const getView = useCallback(() => {
    const hash = window.location.hash || '';
    const path = window.location.pathname || '/';
    const search = window.location.search || '';

    // If hash routing is present, use it
    if (hash && hash.length > 1) {
      return getRoute(hash);
    }

    // Fallback: check pathname (for Vercel rewrites)
    if (path === '/admin') return 'admin';
    if (path === '/staff') return 'staff';
    if (path === '/card') return 'customer';

    // Fallback: check for token in query string
    if (search.includes('token=')) return 'customer';

    return 'home';
  }, []);

  const [currentView, setCurrentView] = useState(getView);

  useEffect(() => {
    const handleChange = () => setCurrentView(getView());
    window.addEventListener('hashchange', handleChange);
    window.addEventListener('popstate', handleChange);
    return () => {
      window.removeEventListener('hashchange', handleChange);
      window.removeEventListener('popstate', handleChange);
    };
  }, [getView]);

  switch (currentView) {
    case 'admin': return <AdminPanel />;
    case 'staff': return <StaffPanel />;
    case 'customer': return <CustomerCard />;
    default: return <HomePage />;
  }
}

export default App;
