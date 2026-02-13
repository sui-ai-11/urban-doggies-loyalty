import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import CustomerCard from './pages/CustomerCard';
import AdminPanel from './pages/AdminPanel';
import StaffPanel from './pages/StaffPanel';

function App() {
  const [view, setView] = useState('loading');

  function route() {
    const h = (window.location.hash || '').toLowerCase();
    const p = (window.location.pathname || '/').toLowerCase();
    const s = window.location.search || '';

    // Log for debugging — remove later
    console.log('ROUTER DEBUG:', { hash: h, path: p, search: s });

    // Hash-based routing (primary)
    if (h.indexOf('/staff') !== -1) return 'staff';
    if (h.indexOf('/admin') !== -1) return 'admin';
    if (h.indexOf('/card') !== -1) return 'customer';

    // Path-based routing (Vercel rewrite fallback)
    if (p.indexOf('/staff') !== -1) return 'staff';
    if (p.indexOf('/admin') !== -1) return 'admin';
    if (p.indexOf('/card') !== -1) return 'customer';

    // Token in query string
    if (s.indexOf('token=') !== -1) return 'customer';

    return 'home';
  }

  useEffect(() => {
    // Route on mount
    setView(route());

    function onNav() { setView(route()); }
    window.addEventListener('hashchange', onNav);
    window.addEventListener('popstate', onNav);
    return () => {
      window.removeEventListener('hashchange', onNav);
      window.removeEventListener('popstate', onNav);
    };
  }, []);

  if (view === 'loading') return null;
  if (view === 'staff') return <StaffPanel />;
  if (view === 'admin') return <AdminPanel />;
  if (view === 'customer') return <CustomerCard />;
  return <HomePage />;
}

export default App;
