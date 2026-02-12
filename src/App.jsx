import React, { useState, useEffect, useCallback } from 'react';
import HomePage from './pages/HomePage';
import CustomerCard from './pages/CustomerCard';
import AdminPanel from './pages/AdminPanel';
import StaffPanel from './pages/StaffPanel';

function App() {
  const getView = useCallback(() => {
    // Get all parts of the URL
    const hash = window.location.hash || '';
    const path = window.location.pathname || '/';
    const search = window.location.search || '';
    const fullHash = hash.toLowerCase();
    const fullPath = path.toLowerCase();

    // CARD: check hash, path, and query string for token
    if (fullHash.includes('card') || fullPath.includes('card') || search.includes('token=')) {
      return 'customer';
    }
    // ADMIN: check hash and path
    if (fullHash.includes('admin') || fullPath.includes('admin')) {
      return 'admin';
    }
    // STAFF: check hash and path
    if (fullHash.includes('staff') || fullPath.includes('staff')) {
      return 'staff';
    }
    // Default: home
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
