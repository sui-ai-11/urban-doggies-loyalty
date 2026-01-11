import React, { useState } from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center p-6">
      <div className="text-center text-white">
        <h1 className="text-5xl font-bold mb-4">🐕 Urban Doggies</h1>
        <p className="text-2xl mb-8">Digital Loyalty System</p>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md">
          <h2 className="text-xl font-semibold mb-4">✅ System Deployed Successfully!</h2>
          <p className="text-sm text-blue-100">
            Your white label loyalty system is now live. 
            Full features will be added after Google Sheets connection.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
