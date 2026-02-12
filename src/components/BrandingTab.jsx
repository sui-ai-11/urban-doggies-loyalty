import React, { useState, useEffect } from 'react';
import { Palette, Save, Check, RefreshCw } from 'lucide-react';
import { colorPalettes } from '../palettes-data';

const BrandingTab = () => {
  const [businessInfo, setBusinessInfo] = useState(null);
  const [selectedPalette, setSelectedPalette] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const response = await fetch('/api/get-business-info');
        const data = await response.json();
        setBusinessInfo(data);
      } catch (error) {
        console.error('Error loading business info:', error);
      }
    };
    fetchBusinessInfo();
  }, []);

  const handlePaletteSelect = (palette) => {
    setSelectedPalette(palette);
    setSaved(false);
  };

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
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving palette:', error);
    } finally {
      setSaving(false);
    }
  };

  const accentColor = businessInfo?.accentColor || '#17BEBB';
  const borderColor = businessInfo?.borderColor || '#1F3A93';

  const currentColors = selectedPalette || {
    backgroundColor: businessInfo?.backgroundColor || '#17BEBB',
    accentColor: businessInfo?.accentColor || '#17BEBB',
    borderColor: businessInfo?.borderColor || '#1F3A93',
    cardBackground: businessInfo?.cardBackground || '#F5F1E8',
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: borderColor }}>Brand Colors</h2>
      <p className="text-gray-500 text-sm mb-6">Choose a professional color palette for your loyalty system</p>

      {/* Live Preview */}
      <div className="rounded-2xl p-6 mb-8 bg-white border" style={{ borderColor: `${accentColor}20` }}>
        <div className="flex items-center gap-2 mb-4">
          <Palette size={20} style={{ color: accentColor }} />
          <h3 className="text-lg font-bold" style={{ color: borderColor }}>
            {selectedPalette ? 'Preview' : 'Current Colors'}
          </h3>
          {selectedPalette && (
            <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: accentColor }}>
              Unsaved
            </span>
          )}
        </div>

        {/* Mini preview card */}
        <div className="rounded-2xl p-4 mb-4 relative overflow-hidden" style={{ backgroundColor: currentColors.backgroundColor }}>
          <div className="absolute top-2 right-2 w-16 h-16 rounded-full opacity-20 blur-xl" style={{ backgroundColor: currentColors.accentColor }} />
          <div className="relative z-10">
            <div className="rounded-xl p-4 mb-3" style={{ backgroundColor: currentColors.cardBackground }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: currentColors.accentColor }} />
                <div>
                  <div className="h-2 w-20 rounded" style={{ backgroundColor: currentColors.borderColor }} />
                  <div className="h-1.5 w-14 rounded mt-1 opacity-40" style={{ backgroundColor: currentColors.borderColor }} />
                </div>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} className="w-6 h-6 rounded-md text-white text-xs flex items-center justify-center font-bold"
                    style={{ backgroundColor: n <= 3 ? currentColors.accentColor : `${currentColors.accentColor}30` }}>
                    {n <= 3 ? '✓' : n}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 h-8 rounded-lg text-white text-xs flex items-center justify-center font-semibold"
                style={{ backgroundColor: currentColors.accentColor }}>Button</div>
              <div className="flex-1 h-8 rounded-lg text-white text-xs flex items-center justify-center font-semibold"
                style={{ backgroundColor: currentColors.borderColor }}>Nav</div>
            </div>
          </div>
        </div>

        {/* Color swatches */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Background', color: currentColors.backgroundColor },
            { label: 'Accent', color: currentColors.accentColor },
            { label: 'Nav/Border', color: currentColors.borderColor },
            { label: 'Card BG', color: currentColors.cardBackground, hasBorder: true },
          ].map(({ label, color, hasBorder }) => (
            <div key={label} className="text-center">
              <div className={`h-12 rounded-xl mb-1.5 ${hasBorder ? 'border border-gray-200' : ''}`}
                style={{ backgroundColor: color }} />
              <p className="text-xs font-semibold text-gray-500">{label}</p>
              <p className="text-[10px] font-mono text-gray-400">{color}</p>
            </div>
          ))}
        </div>

        {/* Apply button */}
        {selectedPalette && (
          <button onClick={handleApplyPalette} disabled={saving}
            className="mt-5 w-full text-white py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: accentColor }}>
            {saving ? (
              <><RefreshCw size={18} className="animate-spin" /> Saving…</>
            ) : saved ? (
              <><Check size={18} /> Saved! Reload to see changes.</>
            ) : (
              <><Save size={18} /> Apply "{selectedPalette.name}"</>
            )}
          </button>
        )}
      </div>

      {/* Palette Grid */}
      <h3 className="text-lg font-bold mb-4" style={{ color: borderColor }}>Choose a Palette</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {colorPalettes.map((palette) => {
          const isSelected = selectedPalette?.id === palette.id;
          const isCurrentActive = !selectedPalette &&
            businessInfo?.backgroundColor === palette.backgroundColor &&
            businessInfo?.accentColor === palette.accentColor;

          return (
            <button key={palette.id} onClick={() => handlePaletteSelect(palette)}
              className={`bg-white rounded-2xl p-4 text-left transition-all duration-200 hover:shadow-lg border-2 ${
                isSelected ? 'shadow-lg scale-[1.02]' : 'hover:scale-[1.01]'
              }`}
              style={{ borderColor: isSelected ? accentColor : isCurrentActive ? `${accentColor}60` : 'transparent' }}>

              {/* Color bar preview */}
              <div className="flex gap-1.5 mb-3">
                <div className="flex-1 h-10 rounded-lg" style={{ backgroundColor: palette.backgroundColor }} />
                <div className="flex-1 h-10 rounded-lg" style={{ backgroundColor: palette.accentColor }} />
                <div className="flex-1 h-10 rounded-lg" style={{ backgroundColor: palette.borderColor }} />
                <div className="flex-1 h-10 rounded-lg border border-gray-200" style={{ backgroundColor: palette.cardBackground }} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{palette.name}</h4>
                  <p className="text-xs text-gray-400">{palette.description}</p>
                </div>
                {isSelected && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: accentColor }}>
                    <Check size={14} />
                  </div>
                )}
                {isCurrentActive && !isSelected && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full text-gray-500 bg-gray-100 shrink-0">Active</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BrandingTab;
