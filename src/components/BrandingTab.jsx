import React, { useState, useEffect } from 'react';
import { Palette, Save, Check, RefreshCw, Star, Gift, Users } from 'lucide-react';
import { colorPalettes } from '../palettes-data';

const BrandingTab = ({ businessInfo: parentBiz, onUpdate }) => {
  const [businessInfo, setBusinessInfo] = useState(parentBiz || null);
  const [selectedPalette, setSelectedPalette] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customColors, setCustomColors] = useState({
    accent: '#17BEBB',
    border: '#1F3A93',
    background: '#17BEBB',
    card: '#F5F1E8',
  });

  useEffect(() => {
    if (!parentBiz) {
      fetch('/api/get-business-info')
        .then(r => r.json())
        .then(data => setBusinessInfo(data))
        .catch(err => console.error('Error loading business info:', err));
    }
    if (parentBiz || businessInfo) {
      var bi = parentBiz || businessInfo;
      setCustomColors({
        accent: bi.accentColor || '#17BEBB',
        border: bi.borderColor || '#1F3A93',
        background: bi.backgroundColor || '#17BEBB',
        card: bi.cardBackground || '#F5F1E8',
      });
    }
  }, []);

  const handleApplyPalette = async () => {
    if (!selectedPalette) return;
    setSaving(true);
    try {
      const response = await fetch('/api/update-business-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backgroundColor: selectedPalette.backgroundColor,
          accentColor: selectedPalette.accentColor,
          borderColor: selectedPalette.borderColor,
          cardBackground: selectedPalette.cardBackground,
        }),
      });
      if (response.ok) {
        setSaved(true);
        const updatedData = await fetch('/api/get-business-info').then(r => r.json());
        setBusinessInfo(updatedData);
        if (onUpdate) onUpdate(updatedData);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving palette:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyCustom = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/update-business-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backgroundColor: customColors.background,
          accentColor: customColors.accent,
          borderColor: customColors.border,
          cardBackground: customColors.card,
        }),
      });
      if (response.ok) {
        setSaved(true);
        const updatedData = await fetch('/api/get-business-info').then(r => r.json());
        setBusinessInfo(updatedData);
        if (onUpdate) onUpdate(updatedData);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving custom colors:', error);
    } finally {
      setSaving(false);
    }
  };

  const accentColor = businessInfo?.accentColor || '#7f5af0';
  const borderColor = businessInfo?.borderColor || '#2cb67d';

  const matchedPalette = colorPalettes.find(p =>
    p.backgroundColor === businessInfo?.backgroundColor
  ) || colorPalettes[0];

  const customPreview = {
    id: 'custom',
    name: 'Custom',
    backgroundColor: customColors.background,
    accentColor: customColors.accent,
    borderColor: customColors.border,
    cardBackground: customColors.card,
    highlight: customColors.accent,
    buttonText: '#ffffff',
    headline: customColors.border,
  };

  const current = customMode ? customPreview : (selectedPalette || matchedPalette);

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: borderColor }}>Brand Colors</h2>
      <p className="text-gray-500 text-sm mb-6">Choose a curated palette — see how it looks in real context</p>

      {/* Live Preview — Happy Hues style */}
      <div className="rounded-2xl overflow-hidden mb-6 shadow-lg border border-gray-100">
        {/* Preview Header / Nav */}
        <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: current.borderColor }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ backgroundColor: current.accentColor, color: current.buttonText || '#fff' }}>B</div>
            <span className="font-bold text-sm" style={{ color: current.headline || '#fff' }}>Your Brand</span>
          </div>
          <div className="flex gap-1.5">
            {['Home', 'Staff', 'Admin'].map(t => (
              <div key={t} className="px-3 py-1 rounded-md text-xs font-semibold"
                style={{ backgroundColor: `${current.accentColor}30`, color: current.headline || '#fff' }}>{t}</div>
            ))}
          </div>
        </div>

        {/* Preview Hero */}
        <div className="px-6 py-8 relative overflow-hidden" style={{ backgroundColor: current.backgroundColor }}>
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full opacity-20 blur-2xl"
            style={{ backgroundColor: current.accentColor }} />
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-1 tracking-tight" style={{ color: current.headline || '#fff' }}>
              {current.name}
            </h3>
            <p className="text-sm mb-4" style={{ color: current.paragraph || '#94a1b2' }}>
              {current.description}
            </p>
            <div className="flex gap-2">
              <div className="px-4 py-2 rounded-lg text-xs font-bold"
                style={{ backgroundColor: current.accentColor, color: current.buttonText || '#fff' }}>
                Get Started
              </div>
              <div className="px-4 py-2 rounded-lg text-xs font-bold border"
                style={{ borderColor: current.highlight || current.accentColor, color: current.highlight || current.accentColor }}>
                Learn More
              </div>
            </div>
          </div>
        </div>

        {/* Preview Cards */}
        <div className="px-6 py-5 grid grid-cols-3 gap-3" style={{ backgroundColor: current.backgroundColor }}>
          {[
            { icon: <Star size={16} />, label: 'Loyalty', count: '248' },
            { icon: <Users size={16} />, label: 'Clients', count: '52' },
            { icon: <Gift size={16} />, label: 'Rewards', count: '18' },
          ].map((item, i) => (
            <div key={i} className="rounded-xl p-3 text-center"
              style={{ backgroundColor: current.cardBackground }}>
              <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
                style={{ backgroundColor: current.accentColor, color: current.buttonText || '#fff' }}>
                {item.icon}
              </div>
              <p className="text-lg font-black" style={{ color: current.headline || current.borderColor }}>{item.count}</p>
              <p className="text-xs font-medium" style={{ color: current.paragraph || '#666' }}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Preview Stamp Card */}
        <div className="px-6 pb-5" style={{ backgroundColor: current.backgroundColor }}>
          <div className="rounded-xl p-4" style={{ backgroundColor: current.cardBackground }}>
            <p className="text-xs font-bold mb-2" style={{ color: current.headline || current.borderColor }}>Stamp Card Preview</p>
            <div className="flex gap-1.5 mb-2">
              {[1,2,3,4,5,6,7,8].map(n => (
                <div key={n} className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: n <= 5 ? current.accentColor : 'transparent',
                    color: n <= 5 ? (current.buttonText || '#fff') : (current.paragraph || '#999'),
                    border: n > 5 ? `2px dashed ${current.accentColor}40` : 'none',
                  }}>
                  {n <= 5 ? '✓' : n}
                </div>
              ))}
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${current.accentColor}20` }}>
              <div className="h-full rounded-full" style={{ width: '62%', backgroundColor: current.accentColor }} />
            </div>
          </div>
        </div>

        {/* Color Chips — clickable when in custom mode */}
        <div className="px-6 py-4 bg-white border-t border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            {customMode ? 'Click any color to customize' : 'Palette Colors'}
          </p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { key: 'background', label: 'Background', color: current.backgroundColor },
              { key: 'accent', label: 'Accent', color: current.accentColor },
              { key: 'border', label: 'Nav/Text', color: current.borderColor },
              { key: 'card', label: 'Card', color: current.cardBackground, border: true },
            ].map(({ key, label, color, border }) => (
              <div key={label} className="text-center relative">
                {customMode ? (
                  <label className="cursor-pointer block">
                    <div className={`h-10 rounded-lg mb-1 hover:ring-2 hover:ring-offset-1 transition ${border ? 'border border-gray-200' : ''}`}
                      style={{ backgroundColor: color, ringColor: color }} />
                    <input type="color" value={color}
                      onChange={(e) => setCustomColors({...customColors, [key]: e.target.value})}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-10" />
                  </label>
                ) : (
                  <div className={`h-10 rounded-lg mb-1 ${border ? 'border border-gray-200' : ''}`}
                    style={{ backgroundColor: color }} />
                )}
                <p className="text-[10px] font-semibold text-gray-400">{label}</p>
                <p className="text-[9px] font-mono text-gray-300">{color}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Apply Button */}
      {selectedPalette && (
        <button onClick={handleApplyPalette} disabled={saving}
          className="w-full text-white py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-2 mb-6"
          style={{ backgroundColor: accentColor }}>
          {saving ? (
            <><RefreshCw size={18} className="animate-spin" /> Saving…</>
          ) : saved ? (
            <><Check size={18} /> Saved! Reload page to see changes everywhere.</>
          ) : (
            <><Save size={18} /> Apply "{selectedPalette.name}" Palette</>
          )}
        </button>
      )}

      {/* Mode Toggle */}
      <div className="flex gap-3 mb-5">
        <button onClick={() => setCustomMode(false)}
          className="px-5 py-2.5 rounded-xl font-bold text-sm transition"
          style={{ backgroundColor: !customMode ? accentColor : '#f3f4f6', color: !customMode ? '#fff' : '#6b7280' }}>
          Preset Palettes
        </button>
        <button onClick={() => setCustomMode(true)}
          className="px-5 py-2.5 rounded-xl font-bold text-sm transition"
          style={{ backgroundColor: customMode ? accentColor : '#f3f4f6', color: customMode ? '#fff' : '#6b7280' }}>
          Custom Colors
        </button>
      </div>

      {/* Custom Color Apply Button */}
      {customMode && (
        <button onClick={handleApplyCustom} disabled={saving}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-2 mb-6"
          style={{ backgroundColor: customColors.accent, color: '#fff' }}>
          {saving ? <><RefreshCw size={16} className="animate-spin" /> Saving...</> :
           saved ? <><Check size={16} /> Applied!</> :
           <><Save size={16} /> Apply Custom Colors</>}
        </button>
      )}

      {/* Palette Grid */}
      {!customMode && (
      <>
      <h3 className="text-lg font-bold mb-4" style={{ color: borderColor }}>Choose a Palette</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {colorPalettes.map((palette) => {
          const isSelected = selectedPalette?.id === palette.id;
          const isCurrentActive = !selectedPalette &&
            businessInfo?.backgroundColor === palette.backgroundColor &&
            businessInfo?.accentColor === palette.accentColor;

          return (
            <button key={palette.id} onClick={() => { setSelectedPalette(palette); setSaved(false); }}
              className={`rounded-2xl overflow-hidden text-left transition-all duration-200 hover:shadow-lg border-2 ${
                isSelected ? 'shadow-lg scale-[1.02]' : 'hover:scale-[1.01]'
              }`}
              style={{ borderColor: isSelected ? accentColor : isCurrentActive ? `${accentColor}60` : '#e5e7eb' }}>

              {/* Mini site preview */}
              <div className="flex h-20">
                {/* Left: Background preview */}
                <div className="flex-1 relative p-3 flex flex-col justify-between" style={{ backgroundColor: palette.backgroundColor }}>
                  <div>
                    <div className="h-1.5 w-12 rounded mb-1" style={{ backgroundColor: palette.headline || '#fff' }} />
                    <div className="h-1 w-16 rounded opacity-50" style={{ backgroundColor: palette.paragraph || '#999' }} />
                  </div>
                  <div className="flex gap-1">
                    <div className="h-4 w-10 rounded text-[6px] flex items-center justify-center font-bold"
                      style={{ backgroundColor: palette.accentColor, color: palette.buttonText || '#fff' }}>•••</div>
                    <div className="h-4 w-10 rounded text-[6px] flex items-center justify-center font-bold"
                      style={{ backgroundColor: palette.borderColor, color: palette.headline || '#fff' }}>•••</div>
                  </div>
                </div>
                {/* Right: Card preview */}
                <div className="w-24 p-2 flex flex-col gap-1 justify-center" style={{ backgroundColor: palette.cardBackground }}>
                  <div className="flex gap-0.5">
                    {[1,2,3,4].map(n => (
                      <div key={n} className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: n <= 2 ? palette.accentColor : `${palette.accentColor}30` }} />
                    ))}
                  </div>
                  <div className="h-1 w-14 rounded" style={{ backgroundColor: palette.headline || palette.borderColor }} />
                  <div className="h-0.5 w-10 rounded opacity-40" style={{ backgroundColor: palette.paragraph || '#999' }} />
                </div>
              </div>

              {/* Info bar */}
              <div className="bg-white px-3 py-2.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{palette.name}</h4>
                  <p className="text-xs text-gray-400">{palette.description}</p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: accentColor }}>
                    <Check size={12} />
                  </div>
                )}
                {isCurrentActive && !isSelected && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-gray-500 bg-gray-100 shrink-0">Active</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      </>
      )}
    </div>
  );
};

export default BrandingTab;
