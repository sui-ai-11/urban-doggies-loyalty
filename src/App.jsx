import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import CustomerCard from './pages/CustomerCard';
import AdminPanel from './pages/AdminPanel';
import StaffPanel from './pages/StaffPanel';

function App() {
  const [currentView, setCurrentView] = useState('home');
  
  // Update view when URL changes
  useEffect(() => {
    const updateView = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      
      console.log('Current path:', path); // Debug
      console.log('Current params:', params.toString()); // Debug
      
      if (path === '/admin' || path.startsWith('/admin')) {
        setCurrentView('admin');
      } else if (path === '/staff' || path.startsWith('/staff')) {
        setCurrentView('staff');
      } else if (path === '/card' || path.startsWith('/card') || params.has('token')) {
        setCurrentView('customer');
      } else {
        setCurrentView('home');
      }
    };

    // Update on mount
    updateView();

    // Listen for navigation (back/forward buttons)
    window.addEventListener('popstate', updateView);
    
    return () => window.removeEventListener('popstate', updateView);
  }, []);

  console.log('Current view:', currentView); // Debug
  
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
