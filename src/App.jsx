import React from 'react';
import HomePage from './pages/HomePage';
import CustomerCard from './pages/CustomerCard';
import AdminPanel from './pages/AdminPanel';
import StaffPanel from './pages/StaffPanel';

function getView() {
  var hash = window.location.hash || '';
  if (hash.indexOf('staff') > -1) return 'staff';
  if (hash.indexOf('admin') > -1) return 'admin';
  if (hash.indexOf('card') > -1) return 'customer';
  if (hash.indexOf('token') > -1) return 'customer';
  var path = window.location.pathname || '/';
  if (path.indexOf('staff') > -1) return 'staff';
  if (path.indexOf('admin') > -1) return 'admin';
  if (path.indexOf('card') > -1) return 'customer';
  var search = window.location.search || '';
  if (search.indexOf('token') > -1) return 'customer';
  return 'home';
}

// Error Boundary to catch crashes
class ErrorCatcher extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ error: error, errorInfo: errorInfo });
  }
  render() {
    if (this.state.error) {
      return React.createElement('div', {
        style: { padding: '40px', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white', fontFamily: 'monospace' }
      },
        React.createElement('h1', { style: { color: '#ff6b6b', fontSize: '24px', marginBottom: '16px' } }, 
          'Component Crash Detected'),
        React.createElement('p', { style: { color: '#ffd93d', marginBottom: '8px' } }, 
          'Error: ' + String(this.state.error)),
        React.createElement('pre', { style: { color: '#a0a0a0', fontSize: '12px', whiteSpace: 'pre-wrap', marginTop: '16px' } }, 
          this.state.errorInfo ? this.state.errorInfo.componentStack : 'No stack available')
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
    document.title = 'View: ' + this.state.view;
  }
  componentWillUnmount() {
    window.removeEventListener('hashchange', this.onNav);
    window.removeEventListener('popstate', this.onNav);
  }
  onNav() {
    var v = getView();
    document.title = 'View: ' + v;
    this.setState({ view: v });
  }
  render() {
    var content;
    switch (this.state.view) {
      case 'staff': content = React.createElement(StaffPanel, null); break;
      case 'admin': content = React.createElement(AdminPanel, null); break;
      case 'customer': content = React.createElement(CustomerCard, null); break;
      default: content = React.createElement(HomePage, null);
    }
    return React.createElement(ErrorCatcher, null, content);
  }
}

export default App;
