import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import CustomerCard from './pages/CustomerCard';
import AdminPanel from './pages/AdminPanel';
import StaffPanel from './pages/StaffPanel';

function App() {
  const [currentView, setCurrentView] = useState('home');
  
  // Determine which view to show based on URL
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    
    if (path.includes('/admin')) {
      setCurrentView('admin');
    } else if (path.includes('/staff')) {
      setCurrentView('staff');
    } else if (path.includes('/card') || params.has('token')) {
      setCurrentView('customer');
    } else {
      setCurrentView('home');
    }
  }, []);

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
