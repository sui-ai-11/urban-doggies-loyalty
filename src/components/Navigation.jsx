import React from 'react';
import { Home, Users, Settings } from 'lucide-react';

function Navigation({ currentPage }) {
  return (
    <nav className="bg-[#1F3A93] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">Urban Doggies</div>
          </div>
          
          <div className="flex gap-2">
            <a
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentPage === 'home' 
                  ? 'bg-white bg-opacity-20' 
                  : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Home size={20} />
              <span className="hidden sm:inline">Home</span>
            </a>
            
            <a
              href="/staff"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentPage === 'staff' 
                  ? 'bg-white bg-opacity-20' 
                  : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Users size={20} />
              <span className="hidden sm:inline">Client Management</span>
            </a>
            
            <a
              href="/admin"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentPage === 'admin' 
                  ? 'bg-white bg-opacity-20' 
                  : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Settings size={20} />
              <span className="hidden sm:inline">Admin Panel</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
