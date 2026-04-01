import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';

const BieStoreInvitation = () => {
  const [inviteeName, setInviteeName] = useState('EDGAR NYABAGAKA');
  const [inviteeImage, setInviteeImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const posterRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInviteeImage(event.target.result);
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload a valid image (JPEG/PNG)');
    }
  };

  // Download poster as image
  const downloadPoster = async () => {
    if (!posterRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 3,
        backgroundColor: null,
        logging: false,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = 'bie-store-invitation.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating poster:', error);
      alert('Failed to generate poster. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Reset image
  const resetImage = () => {
    setInviteeImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Style definitions
  const styles = [
    { name: 'Luxury Gold', bg: 'bg-gradient-to-br from-yellow-900 via-amber-800 to-yellow-900', textColor: 'text-amber-100', accent: 'border-amber-400', button: 'bg-amber-500' },
    { name: 'Elegant Rose', bg: 'bg-gradient-to-br from-rose-900 via-pink-800 to-rose-900', textColor: 'text-pink-100', accent: 'border-pink-400', button: 'bg-pink-500' },
    { name: 'Midnight Blue', bg: 'bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900', textColor: 'text-blue-100', accent: 'border-blue-400', button: 'bg-blue-500' },
    { name: 'Emerald Green', bg: 'bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900', textColor: 'text-emerald-100', accent: 'border-emerald-400', button: 'bg-emerald-500' },
    { name: 'Royal Purple', bg: 'bg-gradient-to-br from-purple-900 via-violet-800 to-fuchsia-900', textColor: 'text-purple-100', accent: 'border-purple-400', button: 'bg-purple-500' },
    { name: 'Sunset Orange', bg: 'bg-gradient-to-br from-orange-800 via-red-700 to-pink-800', textColor: 'text-orange-100', accent: 'border-orange-400', button: 'bg-orange-500' },
    { name: 'Ocean Teal', bg: 'bg-gradient-to-br from-teal-900 via-cyan-800 to-blue-900', textColor: 'text-teal-100', accent: 'border-teal-400', button: 'bg-teal-500' },
    { name: 'Classic Black', bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-black', textColor: 'text-gray-100', accent: 'border-gray-400', button: 'bg-gray-600' },
    { name: 'Vintage Wine', bg: 'bg-gradient-to-br from-red-900 via-maroon-800 to-rose-900', textColor: 'text-red-100', accent: 'border-red-400', button: 'bg-red-500' },
    { name: 'Sapphire Blue', bg: 'bg-gradient-to-br from-sky-900 via-blue-800 to-indigo-900', textColor: 'text-sky-100', accent: 'border-sky-400', button: 'bg-sky-500' },
    { name: 'Champagne', bg: 'bg-gradient-to-br from-amber-200 via-yellow-100 to-orange-200', textColor: 'text-amber-900', accent: 'border-amber-600', button: 'bg-amber-600' },
    { name: 'Modern White', bg: 'bg-gradient-to-br from-gray-50 via-white to-gray-100', textColor: 'text-gray-800', accent: 'border-gray-800', button: 'bg-gray-800' }
  ];

  const currentStyle = styles[selectedStyle];

  // Render poster based on selected style
  const renderPoster = () => {
    const style = currentStyle;
    
    return (
      <div className={`relative w-[600px] min-h-[00px] ${style.bg}  shadow-2xl overflow-hidden`}>
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 border-2 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 rounded-full"></div>
        </div>
        
        {/* Main Content */}
        <div className="relative z-10 p-6 flex flex-col h-full">
          {/* BIE STORE Logo */}
          <div className="text-center mb-4">
            <div className={`text-xs tracking-[0.3em] ${style.textColor} opacity-80`}>BIE_STORE</div>
            <h1 className={`text-4xl font-bold mt-1 ${style.textColor}`}>BIE STORE</h1>
          </div>
          
          {/* LAUNCH Badge */}
          <div className="text-center my-3">
            <div className={`inline-block border-2 ${style.accent} ${style.textColor} px-6 py-2 font-bold text-lg tracking-wider`}>
              BIE STORE LAUNCH
            </div>
          </div>
          
          {/* Tagline */}
          <div className="text-center mb-4">
            <div className={`flex justify-center gap-4 text-xs font-semibold ${style.textColor} uppercase tracking-wider`}>
              <span>✦ CONNECTION</span>
              <span>✦ CAKE</span>
              <span>✦ FASHION</span>
            </div>
          </div>
          
          {/* Large Image Box */}
          <div className="mb-5 flex justify-center">
            <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-white shadow-2xl">
              {inviteeImage ? (
                <img src={inviteeImage} alt="Invitee" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center">
                  <i className="fas fa-user text-6xl text-white/60"></i>
                </div>
              )}
            </div>
          </div>
          
          {/* Invitee Name */}
          <div className="text-center mb-4">
            <div className={`text-sm font-semibold ${style.textColor} opacity-80`}>MR/MRS</div>
            <div className={`text-2xl font-bold mt-1 ${style.textColor}`}>
              {inviteeName}
            </div>
          </div>
          
          {/* Date & Time */}
          <div className="text-center mb-3">
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full ${style.textColor}`}>
              <i className="fas fa-calendar-alt text-sm"></i>
              <span className="font-semibold">SATURDAY, APRIL 4</span>
              <i className="fas fa-clock text-sm"></i>
              <span className="font-semibold">04 PM - 05 PM</span>
            </div>
          </div>
          
          {/* CEO Info */}
          <div className={`text-center text-sm ${style.textColor} opacity-90 mb-2`}>
            <p>CEO: BIDAUS KIMOTO BISENDO</p>
          </div>
          
          {/* Contact & Social */}
          <div className={`text-center text-xs ${style.textColor} opacity-80 space-y-1 mb-3`}>
            <p>📞 0621690364</p>
            <p>📱 @Bie_store</p>
          </div>
          
          {/* Location */}
          <div className={`text-center text-xs ${style.textColor} opacity-90 border-t border-white/20 pt-3 mt-auto`}>
            <p>📍 MAKUMBUSHO, KENYA STREET, HOUSE NO 14</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">BIE STORE</h1>
          <p className="text-gray-300">Premium Invitation Poster Creator</p>
          <p className="text-gray-400 text-sm mt-2">Choose from 12 stunning styles</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <i className="fas fa-magic text-yellow-400"></i>
              Customize Your Invitation
            </h2>
            
            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                <i className="fas fa-image mr-2 text-yellow-400"></i>
                Upload Photo
              </label>
              <div 
                onClick={() => fileInputRef.current.click()}
                className="border-2 border-dashed border-white/30 rounded-xl p-4 text-center cursor-pointer hover:border-yellow-400 transition-colors bg-white/5"
              >
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-40 object-cover rounded-lg mx-auto"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resetImage();
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="py-8">
                    <i className="fas fa-camera text-4xl text-white/50 mb-2"></i>
                    <p className="text-white/70">Click to upload photo</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Name Input */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                <i className="fas fa-user mr-2 text-yellow-400"></i>
                Invitee Name
              </label>
              <input
                type="text"
                value={inviteeName}
                onChange={(e) => setInviteeName(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none transition-colors"
                placeholder="Enter name"
              />
            </div>

            {/* Style Selection */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-3">
                <i className="fas fa-palette mr-2 text-yellow-400"></i>
                Select Style ({selectedStyle + 1}/12)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {styles.map((style, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedStyle(idx)}
                    className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                      selectedStyle === idx 
                        ? 'ring-2 ring-yellow-400 scale-105' 
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      background: style.bg.includes('gradient') ? style.bg : '',
                      backgroundColor: !style.bg.includes('gradient') ? style.bg.split(' ')[1] : '',
                      color: style.textColor.includes('text-') ? '' : 'white'
                    }}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Info */}
            <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <i className="fas fa-info-circle text-yellow-400"></i>
                Event Details
              </h3>
              <div className="space-y-1 text-sm text-white/80">
                <p>📅 Wednesday, April 4 | 04 PM - 05 PM</p>
                <p>📍 MAKUMBUSHO, KENYA STREET, HOUSE NO 14</p>
                <p>📞 0621690364</p>
                <p>📱 @Bie_store</p>
                <p>👑 CEO: BIDAUS KIMOTO BISENDO</p>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={downloadPoster}
              disabled={isDownloading}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Generating Poster...
                </>
              ) : (
                <>
                  <i className="fas fa-download"></i>
                  Download Invitation Poster
                </>
              )}
            </button>
          </div>

          {/* Right Panel - Poster Preview */}
          <div className="lg:col-span-2 flex justify-center items-start">
            <div ref={posterRef}>
              {renderPoster()}
            </div>
          </div>
        </div>

        {/* Style Guide */}
        <div className="mt-8 text-center text-white/60 text-sm">
          <p>✨ 12 Premium Styles Available • Click on any style to preview • Upload photo to personalize ✨</p>
        </div>
      </div>
    </div>
  );
};

export default BieStoreInvitation;


