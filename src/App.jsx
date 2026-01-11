import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center p-6">
      <div className="text-center text-white">
        <h1 className="text-5xl font-bold mb-4">🐕 Urban Doggies</h1>
        <p className="text-2xl mb-8">Digital Loyalty System</p>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">✅ Successfully Deployed!</h2>
          <p className="text-sm text-blue-100 mb-6">
            Your professional white label loyalty system is now live.
          </p>
          <div className="text-left space-y-2 text-sm">
            <p>✅ React + Vite</p>
            <p>✅ Tailwind CSS</p>
            <p>✅ White Label Ready</p>
            <p>✅ Google Sheets Integration Ready</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
```

4. Click **"Commit new file"**

---

## ✅ **After creating all 3 files:**

Your repo should look like:
```
├── src/
│   ├── App.jsx       ✅
│   ├── main.jsx      ✅
│   └── index.css     ✅
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
