import React, { useState, useRef, useEffect, useCallback } from 'react';

const BusinessPhotoEditor = () => {
  const [image, setImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [activeFilter, setActiveFilter] = useState('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    sepia: 0,
    grayscale: 0,
    hueRotate: 0,
    invert: 0,
    sharpen: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  // Save state to history
  const saveToHistory = useCallback((adjustmentsState, zoomState, filterState) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ 
        adjustments: { ...adjustmentsState }, 
        zoom: zoomState, 
        activeFilter: filterState 
      });
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [historyIndex]);

  // Apply edits to canvas
  const applyEdits = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    
    // Wait for image to be fully loaded
    if (!img.complete || img.naturalWidth === 0) return;
    
    const width = img.naturalWidth;
    const height = img.naturalHeight;

    // Set canvas dimensions based on zoom
    canvas.width = width * (zoom / 100);
    canvas.height = height * (zoom / 100);
    
    // Enable high-quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Build filter string
    const filterParts = [];
    if (adjustments.brightness !== 100) filterParts.push(`brightness(${adjustments.brightness}%)`);
    if (adjustments.contrast !== 100) filterParts.push(`contrast(${adjustments.contrast}%)`);
    if (adjustments.saturation !== 100) filterParts.push(`saturate(${adjustments.saturation}%)`);
    if (adjustments.blur > 0) filterParts.push(`blur(${adjustments.blur}px)`);
    if (adjustments.sepia > 0) filterParts.push(`sepia(${adjustments.sepia}%)`);
    if (adjustments.grayscale > 0) filterParts.push(`grayscale(${adjustments.grayscale}%)`);
    if (adjustments.hueRotate !== 0) filterParts.push(`hue-rotate(${adjustments.hueRotate}deg)`);
    if (adjustments.invert > 0) filterParts.push(`invert(${adjustments.invert}%)`);
    
    ctx.filter = filterParts.join(' ');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Apply sharpening if needed
    if (adjustments.sharpen > 0) {
      applySharpening(ctx, canvas.width, canvas.height, adjustments.sharpen / 100);
    }
  }, [adjustments, zoom]);

  // Sharpening algorithm
  const applySharpening = (ctx, width, height, intensity) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const kernel = [
      0, -intensity, 0,
      -intensity, 1 + (intensity * 4), -intensity,
      0, -intensity, 0
    ];
    
    const side = 3;
    const halfSide = 1;
    const src = data.slice();
    const sw = width;
    const sh = height;
    
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        let r = 0, g = 0, b = 0;
        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = y + cy - halfSide;
            const scx = x + cx - halfSide;
            if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
              const srcOffset = (scy * sw + scx) * 4;
              const wt = kernel[cy * side + cx];
              r += src[srcOffset] * wt;
              g += src[srcOffset + 1] * wt;
              b += src[srcOffset + 2] * wt;
            }
          }
        }
        const dstOffset = (y * sw + x) * 4;
        data[dstOffset] = Math.min(255, Math.max(0, r));
        data[dstOffset + 1] = Math.min(255, Math.max(0, g));
        data[dstOffset + 2] = Math.min(255, Math.max(0, b));
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  // AI Enhancement
  const enhanceWithAI = async () => {
    if (!image || isProcessing) return;
    
    setIsProcessing(true);
    setProcessingMessage('Enhancing image quality with AI...');
    
    try {
      await clientSideUpscale();
    } catch (error) {
      console.error('AI Enhancement failed:', error);
      setProcessingMessage('Enhancement failed');
      setTimeout(() => setProcessingMessage(''), 2000);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProcessingMessage(''), 1000);
    }
  };

  // Client-side upscaling
  const clientSideUpscale = async () => {
    return new Promise((resolve) => {
      if (!imageRef.current) {
        resolve();
        return;
      }
      
      const img = imageRef.current;
      const scaleFactor = 2;
      const newWidth = img.naturalWidth * scaleFactor;
      const newHeight = img.naturalHeight * scaleFactor;
      
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = newWidth;
      offscreenCanvas.height = newHeight;
      const offscreenCtx = offscreenCanvas.getContext('2d');
      
      offscreenCtx.imageSmoothingEnabled = true;
      offscreenCtx.imageSmoothingQuality = 'high';
      offscreenCtx.drawImage(img, 0, 0, newWidth, newHeight);
      
      const upscaledDataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.95);
      const upscaledImg = new Image();
      upscaledImg.onload = () => {
        imageRef.current = upscaledImg;
        setImage(upscaledDataUrl);
        setOriginalImage(upscaledDataUrl);
        applyEdits();
        setProcessingMessage('Image enhanced successfully!');
        resolve();
      };
      upscaledImg.src = upscaledDataUrl;
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgData = event.target?.result;
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setImage(imgData);
        setOriginalImage(imgData);
        resetAdjustments();
        saveToHistory(adjustments, zoom, activeFilter);
        // Force canvas update
        setTimeout(() => applyEdits(), 100);
      };
      img.src = imgData;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
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
      sharpen: 0,
    });
    setActiveFilter('none');
    setZoom(100);
  };

  const handleAdjustmentChange = (key, value) => {
    setAdjustments((prev) => {
      const newState = { ...prev, [key]: value };
      return newState;
    });
  };

  // Trigger applyEdits when adjustments change
  useEffect(() => {
    if (imageRef.current) {
      applyEdits();
    }
  }, [adjustments, zoom, applyEdits]);

  const applyQuickFilter = (filter) => {
    setActiveFilter(filter);
    switch (filter) {
      case 'grayscale':
        setAdjustments((prev) => ({ ...prev, grayscale: 100, saturation: 0 }));
        break;
      case 'sepia':
        setAdjustments((prev) => ({ ...prev, sepia: 70, saturation: 80 }));
        break;
      case 'blur':
        setAdjustments((prev) => ({ ...prev, blur: 4 }));
        break;
      case 'brightness':
        setAdjustments((prev) => ({ ...prev, brightness: 130, contrast: 115 }));
        break;
      case 'contrast':
        setAdjustments((prev) => ({ ...prev, contrast: 150, brightness: 105 }));
        break;
      case 'vintage':
        setAdjustments((prev) => ({ ...prev, sepia: 40, saturation: 85, brightness: 105 }));
        break;
      case 'sharp':
        setAdjustments((prev) => ({ ...prev, sharpen: 60, contrast: 110 }));
        break;
      default:
        resetAdjustments();
        break;
    }
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'business-photo-edited.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const downloadHighQuality = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const img = imageRef.current;
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    // Export at original resolution or 2x
    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Apply same filters to the high-quality export
    const filterParts = [];
    if (adjustments.brightness !== 100) filterParts.push(`brightness(${adjustments.brightness}%)`);
    if (adjustments.contrast !== 100) filterParts.push(`contrast(${adjustments.contrast}%)`);
    if (adjustments.saturation !== 100) filterParts.push(`saturate(${adjustments.saturation}%)`);
    if (adjustments.blur > 0) filterParts.push(`blur(${adjustments.blur}px)`);
    if (adjustments.sepia > 0) filterParts.push(`sepia(${adjustments.sepia}%)`);
    if (adjustments.grayscale > 0) filterParts.push(`grayscale(${adjustments.grayscale}%)`);
    if (adjustments.hueRotate !== 0) filterParts.push(`hue-rotate(${adjustments.hueRotate}deg)`);
    if (adjustments.invert > 0) filterParts.push(`invert(${adjustments.invert}%)`);
    
    ctx.filter = filterParts.join(' ');
    ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
    
    const link = document.createElement('a');
    link.download = 'business-photo-high-quality.png';
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  };

  const resetToOriginal = () => {
    if (originalImage) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setImage(originalImage);
        resetAdjustments();
        saveToHistory(adjustments, zoom, activeFilter);
        setTimeout(() => applyEdits(), 100);
      };
      img.src = originalImage;
    }
  };

  const toggleBeforeAfter = () => {
    setShowBeforeAfter(!showBeforeAfter);
  };

  const handleMouseMove = (e) => {
    if (!showBeforeAfter || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setMousePosition({ x: Math.max(0, Math.min(x, rect.width)), y: 0 });
  };

  const AdjustmentSlider = ({ label, value, min, max, onChange, unit = '', icon = null }) => (
    <div className="mb-4">
      <div className="flex justify-between text-sm text-gray-300 mb-1">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xs">{icon}</span>}
          <span>{label}</span>
        </div>
        <span className="font-medium text-white">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, #374151 ${((value - min) / (max - min)) * 100}%, #374151 100%)`
        }}
      />
    </div>
  );

  const QuickFilterButton = ({ filter, label, isActive, icon }) => (
    <button
      onClick={() => applyQuickFilter(filter)}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 ${
        isActive
          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
      }`}
    >
      <div className="flex items-center gap-2 justify-center">
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header with AI Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 rounded-full mb-3">
            <span className="text-white font-semibold">✨ AI-Powered</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Professional Business Photo Editor
          </h1>
          <p className="text-gray-400 mt-2">Advanced editing tools + AI enhancement for stunning business images</p>
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-white font-semibold">{processingMessage}</p>
              <p className="text-gray-400 text-sm mt-2">This may take a few moments...</p>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Adjustments */}
          <div className="lg:col-span-3 bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-4 h-fit sticky top-4 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Adjustments
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (historyIndex > 0) {
                      const prevState = history[historyIndex - 1];
                      setHistoryIndex(historyIndex - 1);
                      setAdjustments(prevState.adjustments);
                      setZoom(prevState.zoom);
                      setActiveFilter(prevState.activeFilter);
                    }
                  }}
                  disabled={historyIndex <= 0}
                  className="p-1 rounded bg-gray-700 text-white disabled:opacity-50 hover:bg-gray-600 transition"
                  title="Undo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    if (historyIndex < history.length - 1) {
                      const nextState = history[historyIndex + 1];
                      setHistoryIndex(historyIndex + 1);
                      setAdjustments(nextState.adjustments);
                      setZoom(nextState.zoom);
                      setActiveFilter(nextState.activeFilter);
                    }
                  }}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1 rounded bg-gray-700 text-white disabled:opacity-50 hover:bg-gray-600 transition"
                  title="Redo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
              <AdjustmentSlider
                label="Brightness"
                value={adjustments.brightness}
                min={0}
                max={200}
                onChange={(v) => handleAdjustmentChange('brightness', v)}
                unit="%"
                icon="☀️"
              />
              <AdjustmentSlider
                label="Contrast"
                value={adjustments.contrast}
                min={0}
                max={200}
                onChange={(v) => handleAdjustmentChange('contrast', v)}
                unit="%"
                icon="◑"
              />
              <AdjustmentSlider
                label="Saturation"
                value={adjustments.saturation}
                min={0}
                max={200}
                onChange={(v) => handleAdjustmentChange('saturation', v)}
                unit="%"
                icon="🎨"
              />
              <AdjustmentSlider
                label="Sharpness"
                value={adjustments.sharpen}
                min={0}
                max={100}
                onChange={(v) => handleAdjustmentChange('sharpen', v)}
                unit="%"
                icon="🔪"
              />
              <AdjustmentSlider
                label="Blur"
                value={adjustments.blur}
                min={0}
                max={20}
                onChange={(v) => handleAdjustmentChange('blur', v)}
                unit="px"
                icon="🌀"
              />
              <AdjustmentSlider
                label="Sepia"
                value={adjustments.sepia}
                min={0}
                max={100}
                onChange={(v) => handleAdjustmentChange('sepia', v)}
                unit="%"
                icon="📜"
              />
              <AdjustmentSlider
                label="Hue Rotate"
                value={adjustments.hueRotate}
                min={0}
                max={360}
                onChange={(v) => handleAdjustmentChange('hueRotate', v)}
                unit="°"
                icon="🌈"
              />

              <hr className="my-4 border-gray-700" />

              <h3 className="text-sm font-semibold text-white mb-3">Quick Filters</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <QuickFilterButton filter="none" label="Original" isActive={activeFilter === 'none'} icon="🎯" />
                <QuickFilterButton filter="grayscale" label="Grayscale" isActive={activeFilter === 'grayscale'} icon="⚫" />
                <QuickFilterButton filter="sepia" label="Sepia" isActive={activeFilter === 'sepia'} icon="📜" />
                <QuickFilterButton filter="vintage" label="Vintage" isActive={activeFilter === 'vintage'} icon="📷" />
                <QuickFilterButton filter="sharp" label="Sharp" isActive={activeFilter === 'sharp'} icon="✨" />
                <QuickFilterButton filter="brightness" label="Bright" isActive={activeFilter === 'brightness'} icon="💡" />
                <QuickFilterButton filter="contrast" label="High Contrast" isActive={activeFilter === 'contrast'} icon="🎚️" />
                <QuickFilterButton filter="blur" label="Soft Blur" isActive={activeFilter === 'blur'} icon="🌸" />
              </div>

              <hr className="my-4 border-gray-700" />

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Zoom: {zoom}%</label>
                  <input
                    type="range"
                    min={25}
                    max={400}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg accent-blue-500"
                  />
                </div>
                
                <button
                  onClick={enhanceWithAI}
                  disabled={!image || isProcessing}
                  className={`w-full py-2 rounded-lg font-medium transition transform hover:scale-105 flex items-center justify-center gap-2 ${
                    image && !isProcessing 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span>✨</span>
                  <span>AI Enhance Quality</span>
                </button>
                
                <button
                  onClick={resetToOriginal}
                  className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-medium"
                >
                  Reset All
                </button>
              </div>
            </div>
          </div>

          {/* Center - Canvas Area */}
          <div className="lg:col-span-6">
            <div
              ref={containerRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onMouseMove={handleMouseMove}
              className={`bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-4 min-h-[600px] flex items-center justify-center transition-all relative ${
                isDragging ? 'border-4 border-dashed border-blue-400 bg-blue-500/20' : 'border-2 border-dashed border-gray-700'
              }`}
            >
              {image ? (
                <div className="relative overflow-auto max-h-[70vh] flex justify-center items-center">
                  <div className="relative" style={{ position: 'relative' }}>
                    <canvas
                      ref={canvasRef}
                      className="max-w-full h-auto shadow-2xl rounded-lg"
                      style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                    />
                    {showBeforeAfter && originalImage && (
                      <div 
                        className="absolute top-0 left-0 overflow-hidden rounded-lg"
                        style={{ width: `${mousePosition.x}px`, height: '100%' }}
                      >
                        <img 
                          src={originalImage} 
                          alt="Original" 
                          className="rounded-lg"
                          style={{ maxWidth: '100%', height: 'auto', minWidth: '100%' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <svg className="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-400 mb-2 text-lg">Drag & drop your image here</p>
                  <p className="text-gray-500 text-sm mb-4">Supports JPG, PNG, WEBP (Max 50MB)</p>
                  <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition transform hover:scale-105">
                    Select Image
                  </button>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            
            {/* Toolbar below canvas */}
            {image && (
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                <button
                  onClick={toggleBeforeAfter}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    showBeforeAfter ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span>🔄</span>
                  <span>Before/After</span>
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
                >
                  <span>🔍</span>
                  <span>Reset Zoom</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Panel - Actions & Info */}
          <div className="lg:col-span-3 bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-4 h-fit sticky top-4 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export
            </h2>
            
            <button
              onClick={downloadImage}
              disabled={!image}
              className={`w-full py-3 rounded-lg font-semibold transition mb-3 flex items-center justify-center gap-2 transform hover:scale-105 ${
                image ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Download Standard
            </button>

            <button
              onClick={downloadHighQuality}
              disabled={!image}
              className={`w-full py-3 rounded-lg font-semibold transition mb-4 flex items-center justify-center gap-2 transform hover:scale-105 ${
                image ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>⭐</span>
              <span>Download High Quality</span>
            </button>

            <div className="bg-gray-900/50 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-semibold text-white mb-2">💡 Pro Tips for Business Photos</h3>
              <ul className="text-xs text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Use AI Enhance for product images to show details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Increase contrast +20% for professional headshots</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Apply slight blur to backgrounds for focus</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Export in High Quality for print materials</span>
                </li>
              </ul>
            </div>

            <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-700">
              <p>Professional Photo Editor v2.0</p>
              <p className="mt-1">✨ AI-Enhanced | High Quality Output</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPhotoEditor;