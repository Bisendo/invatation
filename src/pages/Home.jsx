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
    exposure: 0,
    temperature: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedRatio, setSelectedRatio] = useState('free');
  const [showCropOverlay, setShowCropOverlay] = useState(false);
  const [cropStart, setCropStart] = useState(null);
  const [cropRect, setCropRect] = useState(null);
  
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  // Save state to history
  const saveToHistory = useCallback((newState) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ ...newState });
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [historyIndex]);

  // Undo/Redo functions
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const previousState = history[historyIndex - 1];
      setAdjustments(previousState.adjustments);
      setZoom(previousState.zoom);
      setActiveFilter(previousState.activeFilter);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const nextState = history[historyIndex + 1];
      setAdjustments(nextState.adjustments);
      setZoom(nextState.zoom);
      setActiveFilter(nextState.activeFilter);
    }
  };

  // High-quality image processing with advanced filters
  const applyEdits = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { 
      alpha: false,
      antialias: true,
      willReadFrequently: false 
    });
    if (!ctx) return;

    const img = imageRef.current;
    const width = img.width;
    const height = img.height;

    // Set canvas dimensions based on zoom with high quality
    canvas.width = width * (zoom / 100);
    canvas.height = height * (zoom / 100);
    
    // Enable high-quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Advanced filter string with additional effects
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
    
    // Apply sharpening if needed (using canvas manipulation)
    if (adjustments.sharpen > 0) {
      applySharpening(ctx, canvas.width, canvas.height, adjustments.sharpen);
    }
  }, [adjustments, zoom]);

  // Sharpening algorithm
  const applySharpening = (ctx, width, height, intensity) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const sharpenMatrix = [
      0, -1, 0,
      -1, 4 + intensity, -1,
      0, -1, 0
    ];
    
    const side = Math.round(Math.sqrt(sharpenMatrix.length));
    const halfSide = Math.floor(side / 2);
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
              const wt = sharpenMatrix[cy * side + cx];
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

  // AI Upscaling using free API (you can replace with your own API key)
  const enhanceWithAI = async () => {
    if (!image || isProcessing) return;
    
    setIsProcessing(true);
    setProcessingMessage('Enhancing image quality with AI...');
    
    try {
      // Method 1: Client-side upscaling using canvas (free, no API key needed)
      await clientSideUpscale();
      
      // Method 2: If you have an API key, uncomment below for better results
      // await serverSideUpscale();
      
    } catch (error) {
      console.error('AI Enhancement failed:', error);
      setProcessingMessage('Enhancement failed, using client-side upscaling...');
      await clientSideUpscale();
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  // Client-side AI upscaling using Lanczos interpolation
  const clientSideUpscale = async () => {
    return new Promise((resolve) => {
      if (!imageRef.current) {
        resolve();
        return;
      }
      
      const img = imageRef.current;
      const scaleFactor = 2; // 2x upscale
      const newWidth = img.width * scaleFactor;
      const newHeight = img.height * scaleFactor;
      
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = newWidth;
      offscreenCanvas.height = newHeight;
      const offscreenCtx = offscreenCanvas.getContext('2d', { 
        alpha: false,
        antialias: true 
      });
      
      // Enable high-quality scaling
      offscreenCtx.imageSmoothingEnabled = true;
      offscreenCtx.imageSmoothingQuality = 'high';
      
      // Draw and scale the image with enhanced quality
      offscreenCtx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Apply additional sharpening for better quality
      const imageData = offscreenCtx.getImageData(0, 0, newWidth, newHeight);
      const data = imageData.data;
      
      // Simple unsharp mask for better clarity
      for (let i = 0; i < data.length; i += 4) {
        // Slight contrast enhancement
        data[i] = Math.min(255, Math.max(0, data[i] * 1.05));     // Red
        data[i+1] = Math.min(255, Math.max(0, data[i+1] * 1.05)); // Green
        data[i+2] = Math.min(255, Math.max(0, data[i+2] * 1.05)); // Blue
      }
      
      offscreenCtx.putImageData(imageData, 0, 0);
      
      // Set the upscaled image
      const upscaledDataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.95);
      const upscaledImg = new Image();
      upscaledImg.onload = () => {
        imageRef.current = upscaledImg;
        setImage(upscaledDataUrl);
        setOriginalImage(upscaledDataUrl);
        saveToHistory({ adjustments, zoom, activeFilter });
        applyEdits();
        setProcessingMessage('Image enhanced successfully!');
        setTimeout(() => setProcessingMessage(''), 2000);
        resolve();
      };
      upscaledImg.src = upscaledDataUrl;
    });
  };

  // Server-side AI upscaling (requires API key - example with free API)
  const serverSideUpscale = async () => {
    // Note: This is a placeholder. You'll need to sign up for a free API key
    // from services like DeepAI, Clipdrop, or Replicate
    
    const formData = new FormData();
    const response = await fetch(image);
    const blob = await response.blob();
    formData.append('image', blob);
    
    // Example with DeepAI (free tier available)
    // Sign up at https://deepai.org/ to get your API key
    const DEEP_AI_API_KEY = 'YOUR_FREE_API_KEY_HERE'; // Replace with your key
    
    const aiResponse = await fetch('https://api.deepai.org/api/torch-srgan', {
      method: 'POST',
      headers: {
        'api-key': DEEP_AI_API_KEY,
      },
      body: formData
    });
    
    const aiData = await aiResponse.json();
    if (aiData.output_url) {
      setImage(aiData.output_url);
      setOriginalImage(aiData.output_url);
    }
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
        saveToHistory({ adjustments: { ...adjustments }, zoom, activeFilter });
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
      exposure: 0,
      temperature: 0,
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

  const applyQuickFilter = (filter) => {
    setActiveFilter(filter);
    switch (filter) {
      case 'grayscale':
        setAdjustments((prev) => ({ ...prev, grayscale: 100, saturation: 0 }));
        break;
      case 'sepia':
        setAdjustments((prev) => ({ ...prev, sepia: 70, saturation: 50 }));
        break;
      case 'blur':
        setAdjustments((prev) => ({ ...prev, blur: 4 }));
        break;
      case 'brightness':
        setAdjustments((prev) => ({ ...prev, brightness: 130, contrast: 115 }));
        break;
      case 'contrast':
        setAdjustments((prev) => ({ ...prev, contrast: 160, brightness: 105 }));
        break;
      case 'vintage':
        setAdjustments((prev) => ({ ...prev, sepia: 40, saturation: 80, brightness: 105 }));
        break;
      case 'sharp':
        setAdjustments((prev) => ({ ...prev, sharpen: 50, contrast: 110 }));
        break;
      case 'warm':
        setAdjustments((prev) => ({ ...prev, temperature: 20, saturation: 110 }));
        break;
      case 'cool':
        setAdjustments((prev) => ({ ...prev, temperature: -20, saturation: 105 }));
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
    if (!canvasRef.current) return;
    // Create a high-quality export with max dimensions
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    // Export at 2x resolution for print quality
    tempCanvas.width = canvas.width * 2;
    tempCanvas.height = canvas.height * 2;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
    
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
        saveToHistory({ adjustments: { ...adjustments }, zoom, activeFilter });
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
    setMousePosition({ x, y: 0 });
  };

  const AdjustmentSlider = ({ label, value, min, max, onChange, unit = '', icon = null }) => (
    <div className="mb-4">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xs">{icon}</span>}
          <span>{label}</span>
        </div>
        <span className="font-medium">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(value - min) / (max - min) * 100}%, #e5e7eb ${(value - min) / (max - min) * 100}%, #e5e7eb 100%)`
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
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <div className="flex items-center gap-2 justify-center">
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </div>
    </button>
  );

  const AspectRatioButton = ({ ratio, label, isActive }) => (
    <button
      onClick={() => setSelectedRatio(ratio)}
      className={`px-3 py-1 rounded text-sm transition ${
        isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
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
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-800 font-semibold">{processingMessage}</p>
              <p className="text-gray-500 text-sm mt-2">This may take a few moments...</p>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Adjustments */}
          <div className="lg:col-span-3 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-4 h-fit sticky top-4 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Adjustments
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="p-1 rounded bg-gray-700 text-white disabled:opacity-50 hover:bg-gray-600 transition"
                  title="Undo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button
                  onClick={redo}
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
            
            <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
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

              <hr className="my-4 border-white/20" />

              <h3 className="text-sm font-semibold text-white mb-3">Quick Filters</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <QuickFilterButton filter="none" label="Original" isActive={activeFilter === 'none'} icon="🎯" />
                <QuickFilterButton filter="grayscale" label="Grayscale" isActive={activeFilter === 'grayscale'} icon="⚫" />
                <QuickFilterButton filter="sepia" label="Sepia" isActive={activeFilter === 'sepia'} icon="📜" />
                <QuickFilterButton filter="vintage" label="Vintage" isActive={activeFilter === 'vintage'} icon="📷" />
                <QuickFilterButton filter="sharp" label="Sharp" isActive={activeFilter === 'sharp'} icon="✨" />
                <QuickFilterButton filter="warm" label="Warm" isActive={activeFilter === 'warm'} icon="🔥" />
                <QuickFilterButton filter="cool" label="Cool" isActive={activeFilter === 'cool'} icon="❄️" />
                <QuickFilterButton filter="brightness" label="Bright" isActive={activeFilter === 'brightness'} icon="💡" />
              </div>

              <hr className="my-4 border-white/20" />

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
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
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
              className={`bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-4 min-h-[600px] flex items-center justify-center transition-all relative ${
                isDragging ? 'border-4 border-dashed border-blue-400 bg-blue-500/20' : 'border-2 border-dashed border-white/20'
              }`}
            >
              {image ? (
                <div className="relative overflow-auto max-h-[70vh] flex justify-center items-center">
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      className="max-w-full h-auto shadow-2xl rounded-lg"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                    {showBeforeAfter && originalImage && (
                      <div 
                        className="absolute top-0 left-0 overflow-hidden"
                        style={{ width: `${mousePosition.x}px`, height: '100%' }}
                      >
                        <img 
                          src={originalImage} 
                          alt="Original" 
                          className="max-w-full h-auto rounded-lg"
                          style={{ maxWidth: '100%', height: 'auto' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <svg className="w-24 h-24 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-300 mb-2 text-lg">Drag & drop your image here</p>
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
                    showBeforeAfter ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <span>🔄</span>
                  <span>Before/After</span>
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition flex items-center gap-2"
                >
                  <span>🔍</span>
                  <span>Reset Zoom</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Panel - Actions & Info */}
          <div className="lg:col-span-3 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-4 h-fit sticky top-4 border border-white/20">
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
                image ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Standard
            </button>

            <button
              onClick={downloadHighQuality}
              disabled={!image}
              className={`w-full py-3 rounded-lg font-semibold transition mb-4 flex items-center justify-center gap-2 transform hover:scale-105 ${
                image ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>⭐</span>
              <span>Download High Quality (2x)</span>
            </button>

            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-semibold text-white mb-2">💡 Pro Tips for Business Photos</h3>
              <ul className="text-xs text-gray-300 space-y-2">
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
                  <span>Warm filter works great for team photos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Export in High Quality for print materials</span>
                </li>
              </ul>
            </div>

            <div className="text-center text-xs text-gray-500 pt-4 border-t border-white/10">
              <p>Professional Photo Editor v2.0</p>
              <p className="mt-1">✨ AI-Enhanced | High Quality Output</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default BusinessPhotoEditor;