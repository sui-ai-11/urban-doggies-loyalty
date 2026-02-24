import React from 'react';
import HomePage from './pages/HomePage';
import CustomerCard from './pages/CustomerCard';
import AdminPanel from './pages/AdminPanel';
import StaffPanel from './pages/StaffPanel';
import PortalPage from './pages/PortalPage';

function getView() {
  var hash = (window.location.hash || '').replace('#', '').replace(/^\//, '').split('?')[0].toLowerCase();
  
  // Exact route matching
  if (hash === 'portal' || hash === 'register') return 'portal';
  if (hash === 'staff') return 'staff';
  if (hash === 'admin') return 'admin';
  if (hash === 'card') return 'customer';
  
  // Token in hash query
  if ((window.location.hash || '').indexOf('token=') > -1) return 'customer';
  
  // Token in URL search params
  var search = window.location.search || '';
  if (search.indexOf('token=') > -1) return 'customer';
  
  // Only show homepage for exact root
  if (hash === '' || hash === '/') return 'home';
  
  // Unknown route → portal (safe public page)
  return 'portal';
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  componentDidCatch(error, info) {
    this.setState({ error: error });
    console.error('Component crash:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', maxWidth: '500px', textAlign: 'center' }}>
            <h1 style={{ color: '#ef4444', fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Something went wrong</h1>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>{String(this.state.error)}</p>
            <button onClick={function() { window.location.hash = '#/'; window.location.reload(); }}
              style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>
              Go Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { view: getView() };
    this.onNav = this.onNav.bind(this);
  }
  componentDidMount() {
    window.addEventListener('hashchange', this.onNav);
    window.addEventListener('popstate', this.onNav);
  }
  componentWillUnmount() {
    window.removeEventListener('hashchange', this.onNav);
    window.removeEventListener('popstate', this.onNav);
  }
  onNav() {
    this.setState({ view: getView() });
  }
  render() {
    var content;
    if (this.state.view === 'staff') content = React.createElement(StaffPanel);
    else if (this.state.view === 'admin') content = React.createElement(AdminPanel);
    else if (this.state.view === 'customer') content = React.createElement(CustomerCard);
    else if (this.state.view === 'portal') content = React.createElement(PortalPage);
    else content = React.createElement(HomePage);
    return React.createElement(ErrorBoundary, null, content);
  }
}

export default App;
