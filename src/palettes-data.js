import { useState } from "react";

const palettes = [
  { id: 1, name: "Deep Space", description: "Dark & dramatic with vivid purple accents", backgroundColor: "#16161a", accentColor: "#7f5af0", borderColor: "#2cb67d", cardBackground: "#242629" },
  { id: 2, name: "Playful Purple", description: "Whimsical with coral & gold highlights", backgroundColor: "#f4effc", accentColor: "#ff6e6c", borderColor: "#1f1235", cardBackground: "#ffffff" },
  { id: 3, name: "Teal & Coral", description: "Bold contrast with tropical energy", backgroundColor: "#2a9d8f", accentColor: "#e76f51", borderColor: "#264653", cardBackground: "#f1faee" },
  { id: 4, name: "Fresh Mint", description: "Crisp and clean with teal energy", backgroundColor: "#d8eefe", accentColor: "#3da9fc", borderColor: "#094067", cardBackground: "#ffffff" },
  { id: 5, name: "Neo Brutalist", description: "High contrast black & electric orange", backgroundColor: "#0f0e17", accentColor: "#ff8906", borderColor: "#f25f4c", cardBackground: "#232136" },
  { id: 6, name: "Royal Burgundy", description: "Rich, premium feel with gold accents", backgroundColor: "#6b2737", accentColor: "#d4a853", borderColor: "#2d1117", cardBackground: "#fdf6ec" },
  { id: 7, name: "Midnight Garden", description: "Lush dark greens with gold accents", backgroundColor: "#1a1a2e", accentColor: "#e2b714", borderColor: "#16213e", cardBackground: "#0f3460" },
  { id: 8, name: "Ocean Breeze", description: "Cool blues with warm coral pop", backgroundColor: "#004643", accentColor: "#f9bc60", borderColor: "#abd1c6", cardBackground: "#001e1d" },
  { id: 9, name: "Candy Pop", description: "Bright & playful pink with blue contrast", backgroundColor: "#f72585", accentColor: "#4cc9f0", borderColor: "#3a0ca3", cardBackground: "#ffffff" },
  { id: 10, name: "Forest Calm", description: "Earthy greens with natural warmth", backgroundColor: "#2d6a4f", accentColor: "#d8f3dc", borderColor: "#1b4332", cardBackground: "#f1faee" },
  { id: 11, name: "Warm Terracotta", description: "Mediterranean warmth, refined & grounded", backgroundColor: "#e07a5f", accentColor: "#f2cc8f", borderColor: "#3d405b", cardBackground: "#f4f1de" },
  { id: 12, name: "Arctic Ice", description: "Icy blues with electric accents", backgroundColor: "#e8f1f2", accentColor: "#0077b6", borderColor: "#023e8a", cardBackground: "#ffffff" },
  { id: 13, name: "Noir Luxe", description: "Sophisticated black with gold elegance", backgroundColor: "#14213d", accentColor: "#fca311", borderColor: "#000000", cardBackground: "#1d2d50" },
  { id: 14, name: "Lavender Dream", description: "Soft purple with peachy warmth", backgroundColor: "#e2d5f1", accentColor: "#ff6b6b", borderColor: "#4a2c6e", cardBackground: "#ffffff" },
  { id: 15, name: "Citrus Burst", description: "Vibrant orange & yellow energy", backgroundColor: "#ff6d00", accentColor: "#ffea00", borderColor: "#3d0000", cardBackground: "#fffbf0" },
  { id: 16, name: "Sage & Clay", description: "Organic, natural, and grounding", backgroundColor: "#e8e0d0", accentColor: "#6b7f5e", borderColor: "#3c3836", cardBackground: "#ffffff" },
  { id: 17, name: "Electric Night", description: "Cyberpunk neon on dark canvas", backgroundColor: "#0d0221", accentColor: "#0abdc6", borderColor: "#ea00d9", cardBackground: "#150734" },
];

function isDark(hex) {
  if (!hex) return false;
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

function PalettePreview({ p, selected, onClick }) {
  const bgDark = isDark(p.backgroundColor);
  const cardDark = isDark(p.cardBackground);
  const heroText = bgDark ? "#ffffff" : p.borderColor;
  const heroSub = bgDark ? "rgba(255,255,255,0.7)" : `${p.borderColor}90`;
  const cardHead = cardDark ? "#ffffff" : p.borderColor;
  const cardText = cardDark ? "#b0b0b0" : "#6b7280";
  const cardSub = cardDark ? "#888" : "#9ca3af";

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 ${selected ? "ring-4 ring-blue-500 scale-[1.02]" : "hover:scale-[1.01]"}`}
      style={{ border: "1px solid #e5e7eb" }}
    >
      {/* Nav */}
      <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: p.borderColor }}>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: p.accentColor }}>U</div>
          <span className="text-[10px] font-bold text-white">Urban Doggies</span>
        </div>
        <div className="flex gap-1">
          {["Home", "Staff", "Admin"].map((t) => (
            <div key={t} className="px-1.5 py-0.5 rounded text-[7px] font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="px-4 py-5 relative" style={{ backgroundColor: p.backgroundColor }}>
        <div className="absolute top-2 right-2 w-16 h-16 rounded-full opacity-20 blur-xl" style={{ backgroundColor: p.accentColor }} />
        <h3 className="text-base font-black tracking-tight mb-0.5 relative z-10" style={{ color: heroText }}>Urban Doggies</h3>
        <p className="text-[10px] mb-3 relative z-10" style={{ color: heroSub }}>Digital Loyalty System</p>

        {/* Mini cards */}
        <div className="flex gap-2 relative z-10">
          <div className="flex-1 rounded-lg p-2" style={{ backgroundColor: p.cardBackground }}>
            <div className="w-6 h-6 rounded-md mb-1.5 flex items-center justify-center" style={{ backgroundColor: p.accentColor }}>
              <span className="text-white text-[8px]">★</span>
            </div>
            <div className="h-1.5 w-12 rounded mb-1" style={{ backgroundColor: cardHead }} />
            <div className="h-1 w-8 rounded opacity-50" style={{ backgroundColor: cardText }} />
          </div>
          <div className="flex-1 rounded-lg p-2" style={{ backgroundColor: p.cardBackground }}>
            <div className="w-6 h-6 rounded-md mb-1.5 flex items-center justify-center" style={{ backgroundColor: p.accentColor }}>
              <span className="text-white text-[8px]">⚙</span>
            </div>
            <div className="h-1.5 w-12 rounded mb-1" style={{ backgroundColor: cardHead }} />
            <div className="h-1 w-8 rounded opacity-50" style={{ backgroundColor: cardText }} />
          </div>
        </div>
      </div>

      {/* Customer Card Preview */}
      <div className="px-4 py-3" style={{ backgroundColor: p.backgroundColor }}>
        <div className="rounded-xl p-3 mx-auto max-w-[180px]" style={{ backgroundColor: p.cardBackground, border: `2px solid ${p.borderColor}20` }}>
          <p className="text-[9px] font-bold text-center mb-1" style={{ color: cardHead }}>Hey, Mau!</p>
          <div className="flex gap-1 justify-center mb-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="w-4 h-4 rounded text-[6px] flex items-center justify-center font-bold"
                style={{
                  backgroundColor: n <= 3 ? p.accentColor : "transparent",
                  color: n <= 3 ? "#fff" : cardSub,
                  border: n > 3 ? `1px dashed ${p.accentColor}40` : "none",
                }}>
                {n <= 3 ? "✓" : n}
              </div>
            ))}
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${p.accentColor}20` }}>
            <div className="h-full rounded-full" style={{ width: "37%", backgroundColor: p.accentColor }} />
          </div>
          <p className="text-[7px] text-center mt-1" style={{ color: cardSub }}>3/8 stamps</p>
        </div>
      </div>

      {/* Label */}
      <div className="px-3 py-2 bg-white flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-800">{p.name}</p>
          <p className="text-[10px] text-gray-400">{p.description}</p>
        </div>
        <span className="text-[9px] font-mono text-gray-300">#{p.id}</span>
      </div>
    </div>
  );
}

function FullPreview({ p }) {
  const bgDark = isDark(p.backgroundColor);
  const cardDark = isDark(p.cardBackground);
  const heroText = bgDark ? "#ffffff" : p.borderColor;
  const heroSub = bgDark ? "rgba(255,255,255,0.7)" : `${p.borderColor}90`;
  const cardHead = cardDark ? "#ffffff" : p.borderColor;
  const cardText = cardDark ? "#b0b0b0" : "#6b7280";
  const cardSub = cardDark ? "#888" : "#9ca3af";
  const glassNav = bgDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: "1px solid #e5e7eb" }}>
      {/* Nav */}
      <div className="flex items-center justify-between px-5 py-3" style={{ backgroundColor: p.borderColor }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: p.accentColor }}>U</div>
          <span className="text-sm font-bold text-white">Urban Doggies</span>
        </div>
        <div className="flex gap-1.5">
          {["Home", "Loyalty Desk", "Client Mgmt"].map((t) => (
            <div key={t} className="px-3 py-1.5 rounded-lg text-[10px] font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="px-8 py-10 relative" style={{ backgroundColor: p.backgroundColor }}>
        <div className="absolute top-6 right-8 w-32 h-32 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: p.accentColor }} />
        <div className="absolute bottom-6 left-8 w-24 h-24 rounded-full opacity-15 blur-2xl" style={{ backgroundColor: p.borderColor }} />
        <div className="relative z-10 text-center">
          <h2 className="text-3xl font-black tracking-tight mb-1" style={{ color: heroText }}>Urban Doggies</h2>
          <p className="text-sm mb-6" style={{ color: heroSub }}>Digital Loyalty System</p>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="rounded-2xl p-5" style={{ backgroundColor: p.cardBackground }}>
              <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-white" style={{ backgroundColor: p.accentColor }}>★</div>
              <p className="text-sm font-bold mb-1" style={{ color: cardHead }}>Loyalty Desk</p>
              <p className="text-[10px]" style={{ color: cardText }}>Search & add stamps</p>
            </div>
            <div className="rounded-2xl p-5" style={{ backgroundColor: p.cardBackground }}>
              <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-white" style={{ backgroundColor: p.accentColor }}>⚙</div>
              <p className="text-sm font-bold mb-1" style={{ color: cardHead }}>Client Management</p>
              <p className="text-[10px]" style={{ color: cardText }}>Analytics & more</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Card */}
      <div className="px-8 py-6" style={{ backgroundColor: p.backgroundColor }}>
        <div className="max-w-xs mx-auto rounded-2xl p-5" style={{ backgroundColor: p.cardBackground, border: `2px solid ${p.borderColor}20` }}>
          <p className="text-xs font-bold text-center mb-0.5" style={{ color: cardHead }}>Hey, Mau! 👋</p>
          <p className="text-[10px] text-center mb-3" style={{ color: cardSub }}>Track your visits and earn rewards!</p>
          <div className="flex gap-1.5 justify-center mb-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-5 h-5 rounded-md text-[7px] flex items-center justify-center font-bold"
                style={{
                  backgroundColor: i < 4 ? p.accentColor : "transparent",
                  color: i < 4 ? "#fff" : cardSub,
                  border: i >= 4 ? `1.5px dashed ${p.accentColor}40` : "none",
                }}>
                {i < 4 ? "✓" : i === 4 ? "🎁" : i === 9 ? "🏆" : i + 1}
              </div>
            ))}
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden mb-1" style={{ backgroundColor: `${p.accentColor}20` }}>
            <div className="h-full rounded-full" style={{ width: "40%", backgroundColor: p.accentColor }} />
          </div>
          <p className="text-[8px] text-center" style={{ color: cardSub }}>6 more visits until your next reward!</p>
          
          {/* Milestones */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 rounded-lg p-2" style={{ backgroundColor: cardDark ? "rgba(255,255,255,0.05)" : "#f9fafb", border: `1px solid ${p.accentColor}15` }}>
              <span className="text-sm">🎁</span>
              <div className="flex-1">
                <p className="text-[9px] font-bold" style={{ color: cardHead }}>10% OFF</p>
                <p className="text-[7px]" style={{ color: cardSub }}>5th visit reward</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg p-2" style={{ backgroundColor: cardDark ? "rgba(255,255,255,0.05)" : "#f9fafb", border: `1px solid ${p.accentColor}15` }}>
              <span className="text-sm">🏆</span>
              <div className="flex-1">
                <p className="text-[9px] font-bold" style={{ color: cardHead }}>FREE SERVICE</p>
                <p className="text-[7px]" style={{ color: cardSub }}>10th visit reward</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="px-4 py-2" style={{ backgroundColor: bgDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", borderTop: `1px solid ${bgDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` }}>
        <div className="flex gap-3">
          <div className="flex-1 rounded-lg p-2" style={{ backgroundColor: glassNav }}>
            <p className="text-[9px] font-bold" style={{ color: heroText }}>📋 For Staff</p>
            <p className="text-[7px]" style={{ color: heroSub }}>Quick check-in & stamps</p>
          </div>
          <div className="flex-1 rounded-lg p-2" style={{ backgroundColor: glassNav }}>
            <p className="text-[9px] font-bold" style={{ color: heroText }}>⚙️ For Admins</p>
            <p className="text-[7px]" style={{ color: heroSub }}>Full system control</p>
          </div>
        </div>
      </div>

      {/* Swatches */}
      <div className="px-4 py-3 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          {[
            { l: "BG", c: p.backgroundColor },
            { l: "Accent", c: p.accentColor },
            { l: "Nav", c: p.borderColor },
            { l: "Card", c: p.cardBackground, b: true },
          ].map(({ l, c, b }) => (
            <div key={l} className="flex-1 text-center">
              <div className={`h-6 rounded-md mb-0.5 ${b ? "border border-gray-200" : ""}`} style={{ backgroundColor: c }} />
              <p className="text-[8px] font-semibold text-gray-400">{l}</p>
              <p className="text-[7px] font-mono text-gray-300">{c}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">All 17 Palettes Preview</h1>
          <p className="text-gray-500 text-sm mt-1">Click any palette to see the full preview below</p>
        </div>

        {/* Full Preview */}
        <div className="mb-10 max-w-xl mx-auto">
          <FullPreview p={palettes[selected]} />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {palettes.map((p, i) => (
            <PalettePreview key={p.id} p={p} selected={i === selected} onClick={() => setSelected(i)} />
          ))}
        </div>
      </div>
    </div>
  );
}
