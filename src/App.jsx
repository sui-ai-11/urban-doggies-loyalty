import React, { useState, useEffect } from 'react';
import CustomerCard from './pages/CustomerCard';
import AdminPanel from './pages/AdminPanel';
import StaffPanel from './pages/StaffPanel';

function App() {
  const [currentView, setCurrentView] = useState('customer');
  
  // Determine which view to show based on URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/admin')) {
      setCurrentView('admin');
    } else if (path.includes('/staff')) {
      setCurrentView('staff');
    } else {
      setCurrentView('customer');
    }
  }, []);

  // Render appropriate view
  if (currentView === 'admin') {
    return <AdminPanel />;
  }
  
  if (currentView === 'staff') {
    return <StaffPanel />;
  }
  
  return <CustomerCard />;
}

export default App;
