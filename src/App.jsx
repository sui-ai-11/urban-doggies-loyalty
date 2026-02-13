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

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { view: getView() };
    this.onNav = this.onNav.bind(this);
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.onNav);
    window.addEventListener('popstate', this.onNav);
    // Show what view was detected
    document.title = 'View: ' + this.state.view + ' | Hash: ' + window.location.hash;
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.onNav);
    window.removeEventListener('popstate', this.onNav);
  }

  onNav() {
    var newView = getView();
    document.title = 'View: ' + newView + ' | Hash: ' + window.location.hash;
    this.setState({ view: newView });
  }

  render() {
    switch (this.state.view) {
      case 'staff': return <StaffPanel />;
      case 'admin': return <AdminPanel />;
      case 'customer': return <CustomerCard />;
      default: return <HomePage />;
    }
  }
}

export default App;
