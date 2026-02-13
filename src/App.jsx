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
    if (this.state.view === 'staff') {
      return (
        <div style={{minHeight:'100vh',backgroundColor:'green',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <h1 style={{color:'white',fontSize:'48px'}}>STAFF ROUTE WORKS</h1>
        </div>
      );
    }
    if (this.state.view === 'admin') return <AdminPanel />;
    if (this.state.view === 'customer') return <CustomerCard />;
    return <HomePage />;
  }
}

export default App;
