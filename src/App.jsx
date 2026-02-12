import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import CustomerCard from './pages/CustomerCard';
import AdminPanel from './pages/AdminPanel';
import StaffPanel from './pages/StaffPanel';

function App() {
  const [currentView, setCurrentView] = useState('home');
  
  // Update view based on hash
  const updateView = () => {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    
    console.log('Current hash:', hash);
    
    if (hash.startsWith('#/admin')) {
      setCurrentView('admin');
    } else if (hash.startsWith('#/staff')) {
      setCurrentView('staff');
    } else if (hash.startsWith('#/card') || params.has('token')) {
      setCurrentView('customer');
    } else {
      setCurrentView('home');
    }
  };

  useEffect(() => {
    // Update on mount
    updateView();

    // Listen for hash changes
    window.addEventListener('hashchange', updateView);
    
    return () => {
      window.removeEventListener('hashchange', updateView);
    };
  }, []);

  console.log('Current view:', currentView);
  
  // Render appropriate view
  if (currentView === 'admin') {
    return <AdminPanel />;
  }
  
  if (currentView === 'staff') {
    return <StaffPanel />;
  }
  
  if (currentView === 'customer') {
    return <CustomerCard />;
  }
  
  return <HomePage />;
}

export default App;
