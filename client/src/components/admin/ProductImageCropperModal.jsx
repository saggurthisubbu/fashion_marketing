import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Crop,
  Check,
  X,
  RefreshCw,
  Maximize2,
  Sliders,
  Sparkles,
  Smartphone,
  Square,
  RectangleVertical,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { getCroppedImg } from '../../utils/cropImage';

export const ProductImageCropperModal = ({
  isOpen,
  imageSrc,
  angleKey = 'front',
  angleLabel = 'Front View',
  onClose,
  onSaveCroppedImage
}) => {
  // Cropper States
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(1); // Default to 1:1 Square
  const [aspectName, setAspectName] = useState('1:1'); // '1:1' | '4:5'

  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [livePreviewUrl, setLivePreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCropApplied, setIsCropApplied] = useState(false);

  // Reset all settings when a new image or modal opens
  useEffect(() => {
    if (isOpen && imageSrc) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setAspect(1);
      setAspectName('1:1');
      setCroppedAreaPixels(null);
      setLivePreviewUrl(imageSrc);
      setIsCropApplied(false);
    }
  }, [isOpen, imageSrc]);

  // Callback when crop area changes in react-easy-crop
  const onCropComplete = useCallback((croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // Generate real-time crop preview when crop position or settings change
  const updateLivePreview = useCallback(async (pixels, currentRot) => {
    if (!imageSrc || !pixels) return;
    try {
      const result = await getCroppedImg(imageSrc, pixels, currentRot);
      if (result && result.url) {
        setLivePreviewUrl(result.url);
      }
    } catch (err) {
      console.warn('[Cropper Live Preview Error]', err);
    }
  }, [imageSrc]);

  // Update live preview when croppedAreaPixels or rotation changes
  useEffect(() => {
    if (croppedAreaPixels) {
      const timer = setTimeout(() => {
        updateLivePreview(croppedAreaPixels, rotation);
      }, 150); // slight debounce for smooth performance
      return () => clearTimeout(timer);
    }
  }, [croppedAreaPixels, rotation, updateLivePreview]);

  // Handle Aspect Ratio Change
  const handleAspectChange = (newAspect, name) => {
    setAspect(newAspect);
    setAspectName(name);
    setIsCropApplied(false);
  };

  // Handle Zoom In / Out Buttons
  const handleZoomIn = () => setZoom((prev) => Math.min(3, +(prev + 0.2).toFixed(2)));
  const handleZoomOut = () => setZoom((prev) => Math.max(1, +(prev - 0.2).toFixed(2)));

  // Handle Rotate Left / Right Buttons
  const handleRotateLeft = () => setRotation((prev) => (prev - 90 + 360) % 360);
  const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);

  // Reset Button Action (Requirement 11)
  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspect(1);
    setAspectName('1:1');
    setLivePreviewUrl(imageSrc);
    setIsCropApplied(false);
  };

  // Crop Button Action (Requirement 11)
  const handleApplyCrop = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setIsProcessing(true);
    try {
      const result = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        `product_${angleKey}_${aspectName.replace(':', 'x')}_${Date.now()}.jpg`
      );
      if (result && result.url) {
        setLivePreviewUrl(result.url);
        setIsCropApplied(true);
      }
    } catch (err) {
      console.error('Failed to generate crop:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save Image Button Action (Requirement 11)
  const handleSaveImage = async () => {
    if (!imageSrc) return;
    setIsProcessing(true);
    try {
      // Generate final high-res cropped image blob
      const pixelsToUse = croppedAreaPixels || { x: 0, y: 0, width: 800, height: 800 };
      const result = await getCroppedImg(
        imageSrc,
        pixelsToUse,
        rotation,
        `product_${angleKey}_${aspectName.replace(':', 'x')}_final.jpg`
      );

      if (result && result.file && result.url) {
        onSaveCroppedImage(result.file, result.url, angleKey);
        onClose();
      }
    } catch (err) {
      console.error('[Save Image Error]', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto font-sans animate-in fade-in duration-200">
      
      {/* Main Cropper Studio Modal Box */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden shadow-2xl text-zinc-100">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white text-zinc-950 font-black flex items-center justify-center shadow-sm">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-heading tracking-tight text-white">
                  Product Image Studio
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
                  {angleLabel} ({angleKey.toUpperCase()})
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Adjust position, zoom, rotation & frame ratio for high quality product cards & detail pages.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Close Editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Content Area (2-Column Desktop, 1-Column Mobile) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* Left Column: Interactive Cropper Canvas Workspace (lg:col-span-7) */}
          <div className="lg:col-span-7 bg-zinc-950 p-4 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-zinc-800 min-h-[380px] sm:min-h-[460px]">
            
            {/* Cropper Frame */}
            <div className="relative w-full h-[320px] sm:h-[400px] lg:h-[430px] rounded-2xl overflow-hidden bg-black/60 border border-zinc-800 shadow-inner group">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                showGrid={true}
                cropShape="rect"
                classes={{
                  containerClassName: 'w-full h-full',
                  cropAreaClassName: 'border-2 border-white shadow-2xl'
                }}
              />
              
              {/* Quick Info Overlay on Canvas */}
              <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 text-[10px] font-mono text-zinc-300 flex items-center gap-2 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Aspect: <strong className="text-white">{aspectName}</strong></span>
                <span>•</span>
                <span>Zoom: <strong className="text-white">{(zoom * 100).toFixed(0)}%</strong></span>
                <span>•</span>
                <span>Rot: <strong className="text-white">{rotation}°</strong></span>
              </div>
            </div>

            {/* Quick Canvas Action Bar */}
            <div className="pt-3 flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                <span>Drag to align • Scroll / Pinch to zoom</span>
              </span>

              <button
                onClick={handleReset}
                className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset View</span>
              </button>
            </div>

          </div>

          {/* Right Column: Aspect Ratio, Sliders & Live Previews (lg:col-span-5) */}
          <div className="lg:col-span-5 p-4 sm:p-5 bg-zinc-900 flex flex-col justify-between space-y-5">
            
            <div className="space-y-4">
              
              {/* 1. Crop Frame Aspect Ratio Selector (Req 3 & 4) */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Maximize2 className="w-4 h-4 text-amber-400" />
                  <span>Select Crop Frame Ratio</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  
                  {/* Square 1:1 (Product Cards) */}
                  <button
                    type="button"
                    onClick={() => handleAspectChange(1, '1:1')}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                      aspectName === '1:1'
                        ? 'bg-zinc-800 border-white text-white shadow-md ring-1 ring-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
                      <Square className={`w-4 h-4 ${aspectName === '1:1' ? 'text-emerald-400' : 'text-zinc-400'}`} />
                    </div>
                    <div>
                      <div className="font-bold text-xs">1:1 Square</div>
                      <div className="text-[10px] opacity-75">Product Cards</div>
                    </div>
                  </button>

                  {/* Rectangular 4:5 (Product Detail Page) */}
                  <button
                    type="button"
                    onClick={() => handleAspectChange(4 / 5, '4:5')}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                      aspectName === '4:5'
                        ? 'bg-zinc-800 border-white text-white shadow-md ring-1 ring-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
                      <RectangleVertical className={`w-4 h-4 ${aspectName === '4:5' ? 'text-amber-400' : 'text-zinc-400'}`} />
                    </div>
                    <div>
                      <div className="font-bold text-xs">4:5 Portrait</div>
                      <div className="text-[10px] opacity-75">Product Details</div>
                    </div>
                  </button>

                </div>
              </div>

              {/* 2. Zoom Controls (Req 2) */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Zoom Level</span>
                  </span>
                  <span className="font-mono text-[11px] text-amber-400">{(zoom * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-white h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 3. Rotation Controls (Req 2) */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Rotate Image</span>
                  </span>
                  <span className="font-mono text-[11px] text-emerald-400">{rotation}°</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRotateLeft}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                    title="Rotate -90°"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full accent-white h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={handleRotateRight}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                    title="Rotate +90°"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4. Live Preview Section (Req 5) */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>Live Display Preview</span>
                  </span>
                  {isCropApplied && (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Cropped & Ready
                    </span>
                  )}
                </label>

                {/* Mock Card Preview Box */}
                <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 flex items-center gap-3">
                  
                  {/* Cropped Image Thumbnail */}
                  <div className={`relative overflow-hidden rounded-xl border border-zinc-700 bg-black shrink-0 ${aspectName === '1:1' ? 'w-20 h-20' : 'w-18 h-22'}`}>
                    <img
                      src={livePreviewUrl || imageSrc}
                      alt="Cropped Preview"
                      className="w-full h-full object-cover transition-all"
                    />
                  </div>

                  {/* Mock Context Specs */}
                  <div className="space-y-1 text-xs flex-1">
                    <div className="font-bold text-white line-clamp-1">QuickFit Premium Apparel</div>
                    <div className="text-[11px] text-zinc-400 font-mono">Aspect: {aspectName} • HQ Canvas 0.95</div>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-bold">
                        ₹1,499
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-800">
                        {angleLabel}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Modal Action Footer Buttons (Req 11: Crop, Reset, Save Image) */}
            <div className="pt-3 border-t border-zinc-800 grid grid-cols-3 gap-2.5">
              
              {/* 1. RESET BUTTON */}
              <button
                type="button"
                onClick={handleReset}
                className="py-3 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                title="Reset all crop and zoom settings"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              {/* 2. CROP BUTTON */}
              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={isProcessing}
                className={`py-3 px-3 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                  isCropApplied
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white'
                }`}
                title="Preview crop area"
              >
                {isCropApplied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cropped</span>
                  </>
                ) : (
                  <>
                    <Crop className="w-3.5 h-3.5" />
                    <span>Crop</span>
                  </>
                )}
              </button>

              {/* 3. SAVE IMAGE BUTTON */}
              <button
                type="button"
                onClick={handleSaveImage}
                disabled={isProcessing}
                className="py-3 px-3 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-50"
                title="Save edited image to product angle"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Image</span>
                  </>
                )}
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ProductImageCropperModal;
