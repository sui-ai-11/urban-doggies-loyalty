import React, { useState, useEffect } from 'react';
import { Palette, Upload, Save, Check } from 'lucide-react';
import { colorPalettes } from './palettes-data';

const BrandingTab = () => {
  const [businessInfo, setBusinessInfo] = useState(null);
  const [selectedPalette, setSelectedPalette] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load current business info
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
        // Refresh business info
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

  const currentColors = selectedPalette || {
    backgroundColor: businessInfo?.backgroundColor || '#17BEBB',
    accentColor: businessInfo?.accentColor || '#17BEBB',
    borderColor: businessInfo?.borderColor || '#1F3A93',
    cardBackground: businessInfo?.cardBackground || '#F5F1E8',
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Brand Colors</h2>
        <p className="text-gray-600">
          Choose a professional color palette for your loyalty system
        </p>
      </div>

      {/* Current Preview */}
      <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Palette className="w-5 h-5 mr-2" />
          Current Colors
        </h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <div
              className="h-20 rounded-lg mb-2"
              style={{ backgroundColor: currentColors.backgroundColor }}
            />
            <p className="text-sm text-gray-600">Background</p>
            <p className="text-xs font-mono text-gray-500">{currentColors.backgroundColor}</p>
          </div>
          <div className="flex-1">
            <div
              className="h-20 rounded-lg mb-2"
              style={{ backgroundColor: currentColors.accentColor }}
            />
            <p className="text-sm text-gray-600">Accent</p>
            <p className="text-xs font-mono text-gray-500">{currentColors.accentColor}</p>
          </div>
          <div className="flex-1">
            <div
              className="h-20 rounded-lg mb-2 border-2"
              style={{ backgroundColor: currentColors.borderColor }}
            />
            <p className="text-sm text-gray-600">Border</p>
            <p className="text-xs font-mono text-gray-500">{currentColors.borderColor}</p>
          </div>
          <div className="flex-1">
            <div
              className="h-20 rounded-lg mb-2 border border-gray-300"
              style={{ backgroundColor: currentColors.cardBackground }}
            />
            <p className="text-sm text-gray-600">Card Background</p>
            <p className="text-xs font-mono text-gray-500">{currentColors.cardBackground}</p>
          </div>
        </div>
        
        {selectedPalette && (
          <button
            onClick={handleApplyPalette}
            disabled={saving}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {saving ? (
              'Saving...'
            ) : saved ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Apply This Palette
              </>
            )}
          </button>
        )}
      </div>

      {/* Palette Grid */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Choose a Palette</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {colorPalettes.map((palette) => (
            <button
              key={palette.id}
              onClick={() => handlePaletteSelect(palette)}
              className={`bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all text-left ${
                selectedPalette?.id === palette.id ? 'ring-4 ring-blue-500' : ''
              }`}
            >
              {/* Color Swatches */}
              <div className="flex gap-2 mb-3">
                <div
                  className="w-1/4 h-16 rounded-lg"
                  style={{ backgroundColor: palette.backgroundColor }}
                />
                <div
                  className="w-1/4 h-16 rounded-lg"
                  style={{ backgroundColor: palette.accentColor }}
                />
                <div
                  className="w-1/4 h-16 rounded-lg"
                  style={{ backgroundColor: palette.borderColor }}
                />
                <div
                  className="w-1/4 h-16 rounded-lg border border-gray-300"
                  style={{ backgroundColor: palette.cardBackground }}
                />
              </div>
              
              {/* Palette Info */}
              <h4 className="font-semibold text-gray-800 mb-1">{palette.name}</h4>
              <p className="text-sm text-gray-600">{palette.description}</p>
              
              {selectedPalette?.id === palette.id && (
                <div className="mt-2 flex items-center text-blue-600 text-sm font-medium">
                  <Check className="w-4 h-4 mr-1" />
                  Selected
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandingTab;
