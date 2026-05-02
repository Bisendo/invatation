import React, { useState, useRef, useEffect, useCallback } from 'react';

const BusinessPhotoEditor = () => {
  const [image, setImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [activeFilter, setActiveFilter] = useState('none');
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    sepia: 0,
    grayscale: 0,
    hueRotate: 0,
    invert: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  // Apply filters and adjustments to canvas
  const applyEdits = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const width = img.width;
    const height = img.height;

    // Set canvas dimensions based on zoom
    canvas.width = width * (zoom / 100);
    canvas.height = height * (zoom / 100);

    // Apply CSS filters for real-time preview
    const filterString = `
      brightness(${adjustments.brightness}%)
      contrast(${adjustments.contrast}%)
      saturate(${adjustments.saturation}%)
      blur(${adjustments.blur}px)
      sepia(${adjustments.sepia}%)
      grayscale(${adjustments.grayscale}%)
      hue-rotate(${adjustments.hueRotate}deg)
      invert(${adjustments.invert}%)
    `;

    ctx.filter = filterString.trim();
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, [adjustments, zoom]);

  useEffect(() => {
    if (image) {
      const img = new Image();
      img.src = image;
      img.onload = () => {
        imageRef.current = img;
        applyEdits();
      };
    }
  }, [image, applyEdits]);

  useEffect(() => {
    if (imageRef.current) {
      applyEdits();
    }
  }, [adjustments, zoom, applyEdits]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgData = event.target?.result;
        setImage(imgData);
        setOriginalImage(imgData);
        resetAdjustments();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgData = event.target?.result;
        setImage(imgData);
        setOriginalImage(imgData);
        resetAdjustments();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const resetAdjustments = () => {
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      sepia: 0,
      grayscale: 0,
      hueRotate: 0,
      invert: 0,
    });
    setActiveFilter('none');
    setZoom(100);
  };

  const handleAdjustmentChange = (key, value) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }));
  };

  const applyQuickFilter = (filter) => {
    setActiveFilter(filter);
    switch (filter) {
      case 'grayscale':
        setAdjustments((prev) => ({ ...prev, grayscale: 100, saturation: 0 }));
        break;
      case 'sepia':
        setAdjustments((prev) => ({ ...prev, sepia: 100, saturation: 70 }));
        break;
      case 'blur':
        setAdjustments((prev) => ({ ...prev, blur: 5 }));
        break;
      case 'brightness':
        setAdjustments((prev) => ({ ...prev, brightness: 140 }));
        break;
      case 'contrast':
        setAdjustments((prev) => ({ ...prev, contrast: 150 }));
        break;
      case 'hue-rotate':
        setAdjustments((prev) => ({ ...prev, hueRotate: 180 }));
        break;
      case 'invert':
        setAdjustments((prev) => ({ ...prev, invert: 100 }));
        break;
      default:
        resetAdjustments();
        break;
    }
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'edited-photo.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const resetToOriginal = () => {
    if (originalImage) {
      setImage(originalImage);
      resetAdjustments();
    }
  };

  const AdjustmentSlider = ({ label, value, min, max, onChange, unit = '' }) => (
    <div className="mb-4">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{label}</span>
        <span>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );

  const QuickFilterButton = ({ filter, label, isActive }) => (
    <button
      onClick={() => applyQuickFilter(filter)}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Business Photo Editor
          </h1>
          <p className="text-gray-500 mt-2">Professional editing tools for your business images</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Adjustments */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-4 h-fit sticky top-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Adjustments
            </h2>
            
            <AdjustmentSlider
              label="Brightness"
              value={adjustments.brightness}
              min={0}
              max={200}
              onChange={(v) => handleAdjustmentChange('brightness', v)}
              unit="%"
            />
            <AdjustmentSlider
              label="Contrast"
              value={adjustments.contrast}
              min={0}
              max={200}
              onChange={(v) => handleAdjustmentChange('contrast', v)}
              unit="%"
            />
            <AdjustmentSlider
              label="Saturation"
              value={adjustments.saturation}
              min={0}
              max={200}
              onChange={(v) => handleAdjustmentChange('saturation', v)}
              unit="%"
            />
            <AdjustmentSlider
              label="Blur"
              value={adjustments.blur}
              min={0}
              max={20}
              onChange={(v) => handleAdjustmentChange('blur', v)}
              unit="px"
            />
            <AdjustmentSlider
              label="Sepia"
              value={adjustments.sepia}
              min={0}
              max={100}
              onChange={(v) => handleAdjustmentChange('sepia', v)}
              unit="%"
            />
            <AdjustmentSlider
              label="Hue Rotate"
              value={adjustments.hueRotate}
              min={0}
              max={360}
              onChange={(v) => handleAdjustmentChange('hueRotate', v)}
              unit="°"
            />

            <hr className="my-4" />

            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Filters</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <QuickFilterButton filter="none" label="Original" isActive={activeFilter === 'none'} />
              <QuickFilterButton filter="grayscale" label="Grayscale" isActive={activeFilter === 'grayscale'} />
              <QuickFilterButton filter="sepia" label="Sepia" isActive={activeFilter === 'sepia'} />
              <QuickFilterButton filter="blur" label="Blur" isActive={activeFilter === 'blur'} />
              <QuickFilterButton filter="brightness" label="Bright" isActive={activeFilter === 'brightness'} />
              <QuickFilterButton filter="contrast" label="High Contrast" isActive={activeFilter === 'contrast'} />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Zoom: {zoom}%</label>
                <input
                  type="range"
                  min={25}
                  max={200}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg"
                />
              </div>
              <button
                onClick={resetToOriginal}
                className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Reset All
              </button>
            </div>
          </div>

          {/* Center - Canvas Area */}
          <div className="lg:col-span-2">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`bg-white rounded-2xl shadow-lg p-4 min-h-[500px] flex items-center justify-center transition-all ${
                isDragging ? 'border-4 border-dashed border-blue-400 bg-blue-50' : 'border-2 border-dashed border-gray-200'
              }`}
            >
              {image ? (
                <div className="relative overflow-auto max-h-[70vh] flex justify-center items-center">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full h-auto shadow-md rounded-lg"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>
              ) : (
                <div className="text-center p-8 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 mb-2">Drag & drop your image here</p>
                  <p className="text-gray-400 text-sm mb-4">or click to browse</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Select Image
                  </button>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Right Panel - Actions & Info */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-4 h-fit sticky top-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export
            </h2>
            <button
              onClick={downloadImage}
              disabled={!image}
              className={`w-full py-3 rounded-lg font-semibold transition mb-4 flex items-center justify-center gap-2 ${
                image ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Image
            </button>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Tips for Business Photos</h3>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>✓ Increase contrast for product images</li>
                <li>✓ Use slight blur for background focus</li>
                <li>✓ Adjust brightness for team photos</li>
                <li>✓ Apply light sepia for warm brand tone</li>
              </ul>
            </div>

            <div className="text-center text-xs text-gray-400 pt-4 border-t">
              Professional Photo Editor v1.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPhotoEditor;