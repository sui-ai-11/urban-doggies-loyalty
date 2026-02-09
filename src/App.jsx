import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import CustomerCard from './pages/CustomerCard';
import AdminPanel from './pages/AdminPanel';
import StaffPanel from './pages/StaffPanel';

function App() {
  const [currentView, setCurrentView] = useState('home');
  
  // Update view based on URL
  const updateView = () => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    
    console.log('Current path:', path);
    
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

  useEffect(() => {
    // Update on mount
    updateView();

    // Listen for browser back/forward
    window.addEventListener('popstate', updateView);
    
    // IMPORTANT: Listen for ALL link clicks
    const handleClick = (e) => {
      // Check if clicked element or parent is a link
      const link = e.target.closest('a');
      if (link && link.href && link.href.startsWith(window.location.origin)) {
        e.preventDefault(); // Prevent full page reload
        window.history.pushState({}, '', link.href);
        updateView(); // Manually trigger view update
      }
    };

    document.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('popstate', updateView);
      document.removeEventListener('click', handleClick);
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
