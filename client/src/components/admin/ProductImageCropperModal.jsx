import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Smartphone,
  Square,
  RectangleVertical,
  Eye,
  CheckCircle2,
  Move,
  Lock,
  Unlock
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
  // Cropper Core Coordinates & Transformations
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Aspect Ratio & Custom Dimensions (Free Crop by Default)
  const [aspectName, setAspectName] = useState('free'); // 'free' | '1:1' | '4:5'
  const [cropSize, setCropSize] = useState({ width: 300, height: 360 });
  const [aspect, setAspect] = useState(300 / 360);

  // Canvas & Cropped Result State
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [livePreviewUrl, setLivePreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCropApplied, setIsCropApplied] = useState(false);
  const [mediaSize, setMediaSize] = useState(null);

  // Container sizing ref for bounding handle drags
  const containerRef = useRef(null);
  const [containerRect, setContainerRect] = useState({ width: 500, height: 400 });

  // Update container size on mount / resize
  useEffect(() => {
    if (!isOpen) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerRect({
          width: Math.max(280, rect.width),
          height: Math.max(280, rect.height)
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isOpen]);

  // Reset all settings to Free Crop default when editor opens
  useEffect(() => {
    if (isOpen && imageSrc) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setAspectName('free');
      
      // Default Free Crop initial dimensions (proportional to container, unconstrained)
      const initialW = Math.min(320, Math.round((containerRect.width || 450) * 0.75));
      const initialH = Math.min(380, Math.round((containerRect.height || 400) * 0.8));
      setCropSize({ width: initialW, height: initialH });
      setAspect(initialW / initialH);

      setCroppedAreaPixels(null);
      setLivePreviewUrl(imageSrc);
      setIsCropApplied(false);
    }
  }, [isOpen, imageSrc, containerRect.width, containerRect.height]);

  // Callback when media loads in react-easy-crop
  const onMediaLoaded = useCallback((loadedMediaSize) => {
    setMediaSize(loadedMediaSize);
    // If opening in Free Crop mode, fit frame to natural image orientation comfortably
    if (loadedMediaSize && loadedMediaSize.naturalWidth && loadedMediaSize.naturalHeight) {
      const imgRatio = loadedMediaSize.naturalWidth / loadedMediaSize.naturalHeight;
      const targetW = Math.min(340, Math.round((containerRect.width || 450) * 0.75));
      const targetH = Math.round(targetW / imgRatio);
      const clampedH = Math.min(Math.round((containerRect.height || 400) * 0.85), Math.max(80, targetH));
      const finalW = Math.min(Math.round((containerRect.width || 450) * 0.85), Math.max(80, Math.round(clampedH * imgRatio)));
      
      setCropSize({ width: finalW, height: clampedH });
      setAspect(finalW / clampedH);
    }
  }, [containerRect.width, containerRect.height]);

  // Callback when crop area changes in react-easy-crop
  const onCropComplete = useCallback((croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // Generate real-time live crop preview
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

  // Debounced live preview update
  useEffect(() => {
    if (croppedAreaPixels) {
      const timer = setTimeout(() => {
        updateLivePreview(croppedAreaPixels, rotation);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [croppedAreaPixels, rotation, updateLivePreview]);

  // Handle Aspect Ratio Mode Switch
  const handleAspectChange = (name) => {
    setAspectName(name);
    setIsCropApplied(false);

    const maxW = Math.max(100, containerRect.width - 24);
    const maxH = Math.max(100, containerRect.height - 24);

    if (name === '1:1') {
      const size = Math.min(cropSize.width, cropSize.height, maxW, maxH);
      setCropSize({ width: size, height: size });
      setAspect(1);
    } else if (name === '4:5') {
      let w = cropSize.width;
      let h = Math.round(w * 1.25);
      if (h > maxH) {
        h = maxH;
        w = Math.round(h * 0.8);
      }
      setCropSize({ width: w, height: h });
      setAspect(4 / 5);
    } else {
      // 'free' custom mode: keep current width and height, completely unlocked
      setAspect(cropSize.width / cropSize.height);
    }
  };

  // 8-Point Interactive Manual Resize Engine
  const startResize = useCallback((e, handleType) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const startX = clientX;
    const startY = clientY;
    const startWidth = cropSize.width;
    const startHeight = cropSize.height;

    const maxW = Math.max(100, containerRect.width - 24);
    const maxH = Math.max(100, containerRect.height - 24);

    const onMove = (moveEvent) => {
      moveEvent.preventDefault();
      const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const dx = currentX - startX;
      const dy = currentY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      // Because crop frame is centered (translate(-50%, -50%)), edge motion expands/contracts symmetrically by delta * 2
      switch (handleType) {
        case 'e':
          newWidth = startWidth + dx * 2;
          break;
        case 'w':
          newWidth = startWidth - dx * 2;
          break;
        case 's':
          newHeight = startHeight + dy * 2;
          break;
        case 'n':
          newHeight = startHeight - dy * 2;
          break;
        case 'se':
          newWidth = startWidth + dx * 2;
          newHeight = startHeight + dy * 2;
          break;
        case 'sw':
          newWidth = startWidth - dx * 2;
          newHeight = startHeight + dy * 2;
          break;
        case 'ne':
          newWidth = startWidth + dx * 2;
          newHeight = startHeight - dy * 2;
          break;
        case 'nw':
          newWidth = startWidth - dx * 2;
          newHeight = startHeight - dy * 2;
          break;
        default:
          break;
      }

      // Constrain within minimum and maximum container bounds
      newWidth = Math.max(60, Math.min(maxW, newWidth));
      newHeight = Math.max(60, Math.min(maxH, newHeight));

      // Preset ratio lock if user explicitly selected 1:1 or 4:5; otherwise FULLY FREE
      if (aspectName === '1:1') {
        const minVal = Math.min(newWidth, newHeight);
        newWidth = minVal;
        newHeight = minVal;
      } else if (aspectName === '4:5') {
        if (handleType === 'n' || handleType === 's') {
          newWidth = Math.round(newHeight * 0.8);
        } else {
          newHeight = Math.round(newWidth * 1.25);
        }
        newWidth = Math.min(maxW, Math.max(60, newWidth));
        newHeight = Math.min(maxH, Math.max(60, newHeight));
      }

      const finalW = Math.round(newWidth);
      const finalH = Math.round(newHeight);

      setCropSize({ width: finalW, height: finalH });
      setAspect(finalW / finalH);
      setIsCropApplied(false);
    };

    const onEnd = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  }, [cropSize.width, cropSize.height, containerRect.width, containerRect.height, aspectName]);

  // Direct dimension adjusters for sidebar controls
  const handleWidthChange = (val) => {
    const maxW = Math.max(100, containerRect.width - 24);
    const clampedW = Math.round(Math.max(60, Math.min(maxW, Number(val))));
    setCropSize((prev) => {
      const nextH = aspectName === '1:1' ? clampedW : aspectName === '4:5' ? Math.round(clampedW * 1.25) : prev.height;
      setAspect(clampedW / nextH);
      return { width: clampedW, height: nextH };
    });
    setIsCropApplied(false);
  };

  const handleHeightChange = (val) => {
    const maxH = Math.max(100, containerRect.height - 24);
    const clampedH = Math.round(Math.max(60, Math.min(maxH, Number(val))));
    setCropSize((prev) => {
      const nextW = aspectName === '1:1' ? clampedH : aspectName === '4:5' ? Math.round(clampedH * 0.8) : prev.width;
      setAspect(nextW / clampedH);
      return { width: nextW, height: clampedH };
    });
    setIsCropApplied(false);
  };

  // Zoom & Rotation Handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(3, +(prev + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom((prev) => Math.max(1, +(prev - 0.15).toFixed(2)));
  const handleRotateLeft = () => setRotation((prev) => (prev - 90 + 360) % 360);
  const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);

  // Reset Button Action
  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspectName('free');
    const initialW = Math.min(320, Math.round((containerRect.width || 450) * 0.75));
    const initialH = Math.min(380, Math.round((containerRect.height || 400) * 0.8));
    setCropSize({ width: initialW, height: initialH });
    setAspect(initialW / initialH);
    setLivePreviewUrl(imageSrc);
    setIsCropApplied(false);
  };

  // Crop Button Action (Applies & confirms crop locally)
  const handleApplyCrop = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setIsProcessing(true);
    try {
      const result = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        `product_${angleKey}_${aspectName === 'free' ? 'custom' : aspectName.replace(':', 'x')}_${Date.now()}.jpg`
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

  // Save Image Button Action (Saves exact custom crop without forcing 4:5 or 1:1)
  const handleSaveImage = async () => {
    if (!imageSrc) return;
    setIsProcessing(true);
    try {
      const pixelsToUse = croppedAreaPixels || {
        x: 0,
        y: 0,
        width: cropSize.width,
        height: cropSize.height
      };

      const result = await getCroppedImg(
        imageSrc,
        pixelsToUse,
        rotation,
        `product_${angleKey}_${aspectName === 'free' ? 'custom' : aspectName.replace(':', 'x')}_final.jpg`
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
        <div className="px-4 sm:px-6 py-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
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
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold uppercase">
                  {aspectName === 'free' ? 'Free Crop Active' : `${aspectName} Locked`}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Manually resize the crop frame from any corner or edge with full free-form control.
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
            
            {/* Cropper Container */}
            <div
              ref={containerRef}
              className="relative w-full h-[320px] sm:h-[400px] lg:h-[430px] rounded-2xl overflow-hidden bg-black/70 border border-zinc-800 shadow-inner select-none"
            >
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                cropSize={cropSize}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                onMediaLoaded={onMediaLoaded}
                showGrid={true}
                cropShape="rect"
                classes={{
                  containerClassName: 'w-full h-full cursor-move',
                  cropAreaClassName: 'border border-transparent' // Border rendered cleanly by custom handles overlay
                }}
              />

              {/* ── 8-POINT INTERACTIVE MANUAL RESIZE HANDLES OVERLAY ── */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                style={{ width: `${cropSize.width}px`, height: `${cropSize.height}px` }}
              >
                {/* Visual Bounding Border */}
                <div className="absolute inset-0 border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] pointer-events-none transition-all">
                  {/* Subtle Corner Accents */}
                  <div className="absolute -top-[2px] -left-[2px] w-4 h-4 border-t-2 border-l-2 border-amber-400"></div>
                  <div className="absolute -top-[2px] -right-[2px] w-4 h-4 border-t-2 border-r-2 border-amber-400"></div>
                  <div className="absolute -bottom-[2px] -left-[2px] w-4 h-4 border-b-2 border-l-2 border-amber-400"></div>
                  <div className="absolute -bottom-[2px] -right-[2px] w-4 h-4 border-b-2 border-r-2 border-amber-400"></div>
                </div>

                {/* Floating Dimension Label */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-zinc-950/90 text-white font-mono text-[10px] font-bold border border-zinc-700 whitespace-nowrap shadow-lg flex items-center gap-1.5 pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>{cropSize.width} × {cropSize.height} px</span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-amber-300 uppercase">{aspectName === 'free' ? 'Custom' : aspectName}</span>
                </div>

                {/* ── 4 CORNER RESIZE HANDLES ── */}
                {/* Top-Left */}
                <div
                  onMouseDown={(e) => startResize(e, 'nw')}
                  onTouchStart={(e) => startResize(e, 'nw')}
                  className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-white border-2 border-zinc-950 rounded-md shadow-md hover:bg-amber-400 active:bg-amber-400 cursor-nwse-resize pointer-events-auto transition-transform hover:scale-125 z-40 flex items-center justify-center"
                  title="Resize Corner (Top-Left)"
                >
                  <div className="w-1 h-1 bg-zinc-950 rounded-full"></div>
                </div>

                {/* Top-Right */}
                <div
                  onMouseDown={(e) => startResize(e, 'ne')}
                  onTouchStart={(e) => startResize(e, 'ne')}
                  className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-zinc-950 rounded-md shadow-md hover:bg-amber-400 active:bg-amber-400 cursor-nesw-resize pointer-events-auto transition-transform hover:scale-125 z-40 flex items-center justify-center"
                  title="Resize Corner (Top-Right)"
                >
                  <div className="w-1 h-1 bg-zinc-950 rounded-full"></div>
                </div>

                {/* Bottom-Left */}
                <div
                  onMouseDown={(e) => startResize(e, 'sw')}
                  onTouchStart={(e) => startResize(e, 'sw')}
                  className="absolute -bottom-2.5 -left-2.5 w-5 h-5 bg-white border-2 border-zinc-950 rounded-md shadow-md hover:bg-amber-400 active:bg-amber-400 cursor-nesw-resize pointer-events-auto transition-transform hover:scale-125 z-40 flex items-center justify-center"
                  title="Resize Corner (Bottom-Left)"
                >
                  <div className="w-1 h-1 bg-zinc-950 rounded-full"></div>
                </div>

                {/* Bottom-Right */}
                <div
                  onMouseDown={(e) => startResize(e, 'se')}
                  onTouchStart={(e) => startResize(e, 'se')}
                  className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-zinc-950 rounded-md shadow-md hover:bg-amber-400 active:bg-amber-400 cursor-nwse-resize pointer-events-auto transition-transform hover:scale-125 z-40 flex items-center justify-center"
                  title="Resize Corner (Bottom-Right)"
                >
                  <div className="w-1 h-1 bg-zinc-950 rounded-full"></div>
                </div>

                {/* ── 4 SIDE EDGE RESIZE HANDLES ── */}
                {/* Top Edge */}
                <div
                  onMouseDown={(e) => startResize(e, 'n')}
                  onTouchStart={(e) => startResize(e, 'n')}
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-white border-2 border-zinc-950 rounded-full shadow-md hover:bg-amber-400 active:bg-amber-400 cursor-ns-resize pointer-events-auto transition-transform hover:scale-110 z-40 flex items-center justify-center"
                  title="Resize Height (Top)"
                >
                  <div className="w-3 h-0.5 bg-zinc-950 rounded-full"></div>
                </div>

                {/* Bottom Edge */}
                <div
                  onMouseDown={(e) => startResize(e, 's')}
                  onTouchStart={(e) => startResize(e, 's')}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-white border-2 border-zinc-950 rounded-full shadow-md hover:bg-amber-400 active:bg-amber-400 cursor-ns-resize pointer-events-auto transition-transform hover:scale-110 z-40 flex items-center justify-center"
                  title="Resize Height (Bottom)"
                >
                  <div className="w-3 h-0.5 bg-zinc-950 rounded-full"></div>
                </div>

                {/* Left Edge */}
                <div
                  onMouseDown={(e) => startResize(e, 'w')}
                  onTouchStart={(e) => startResize(e, 'w')}
                  className="absolute top-1/2 -left-2 -translate-y-1/2 w-3.5 h-8 bg-white border-2 border-zinc-950 rounded-full shadow-md hover:bg-amber-400 active:bg-amber-400 cursor-ew-resize pointer-events-auto transition-transform hover:scale-110 z-40 flex items-center justify-center"
                  title="Resize Width (Left)"
                >
                  <div className="h-3 w-0.5 bg-zinc-950 rounded-full"></div>
                </div>

                {/* Right Edge */}
                <div
                  onMouseDown={(e) => startResize(e, 'e')}
                  onTouchStart={(e) => startResize(e, 'e')}
                  className="absolute top-1/2 -right-2 -translate-y-1/2 w-3.5 h-8 bg-white border-2 border-zinc-950 rounded-full shadow-md hover:bg-amber-400 active:bg-amber-400 cursor-ew-resize pointer-events-auto transition-transform hover:scale-110 z-40 flex items-center justify-center"
                  title="Resize Width (Right)"
                >
                  <div className="h-3 w-0.5 bg-zinc-950 rounded-full"></div>
                </div>

              </div>

              {/* Quick Info Overlay on Canvas */}
              <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 text-[10px] font-mono text-zinc-300 flex items-center gap-2 pointer-events-none z-10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Mode: <strong className="text-white uppercase">{aspectName}</strong></span>
                <span>•</span>
                <span>Zoom: <strong className="text-white">{(zoom * 100).toFixed(0)}%</strong></span>
                <span>•</span>
                <span>Rot: <strong className="text-white">{rotation}°</strong></span>
              </div>
            </div>

            {/* Quick Canvas Instruction Bar */}
            <div className="pt-3 flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Move className="w-3.5 h-3.5 text-amber-400" />
                <span>Drag white handles to resize • Drag image to align</span>
              </span>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset View</span>
              </button>
            </div>

          </div>

          {/* Right Column: Aspect Ratio Modes, Dimension Sliders, Controls & Live Preview (lg:col-span-5) */}
          <div className="lg:col-span-5 p-4 sm:p-5 bg-zinc-900 flex flex-col justify-between space-y-4">
            
            <div className="space-y-3.5">
              
              {/* 1. Crop Mode Selector (Free Crop DEFAULT, 1:1, 4:5) */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4 text-amber-400" />
                    <span>Crop Mode</span>
                  </span>
                  {aspectName === 'free' ? (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> Unconstrained
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Fixed Ratio
                    </span>
                  )}
                </label>

                <div className="grid grid-cols-3 gap-2">
                  
                  {/* Free Crop / Custom (DEFAULT) */}
                  <button
                    type="button"
                    onClick={() => handleAspectChange('free')}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      aspectName === 'free'
                        ? 'bg-zinc-800 border-amber-400 text-white shadow-md ring-1 ring-amber-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Crop className={`w-4 h-4 ${aspectName === 'free' ? 'text-amber-400' : 'text-zinc-400'}`} />
                      <span className={`text-[8px] font-mono px-1 py-0.2 rounded font-bold ${aspectName === 'free' ? 'bg-amber-400/20 text-amber-300' : 'bg-zinc-800 text-zinc-500'}`}>
                        DEFAULT
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-xs">Free Crop</div>
                      <div className="text-[9px] opacity-75">Any Ratio</div>
                    </div>
                  </button>

                  {/* Square 1:1 Preset */}
                  <button
                    type="button"
                    onClick={() => handleAspectChange('1:1')}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      aspectName === '1:1'
                        ? 'bg-zinc-800 border-white text-white shadow-md ring-1 ring-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Square className={`w-4 h-4 ${aspectName === '1:1' ? 'text-emerald-400' : 'text-zinc-400'}`} />
                      <span className="text-[8px] font-mono text-zinc-400">1:1</span>
                    </div>
                    <div>
                      <div className="font-bold text-xs">1:1 Square</div>
                      <div className="text-[9px] opacity-75">Product Card</div>
                    </div>
                  </button>

                  {/* Rectangular 4:5 Preset */}
                  <button
                    type="button"
                    onClick={() => handleAspectChange('4:5')}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      aspectName === '4:5'
                        ? 'bg-zinc-800 border-white text-white shadow-md ring-1 ring-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <RectangleVertical className={`w-4 h-4 ${aspectName === '4:5' ? 'text-amber-400' : 'text-zinc-400'}`} />
                      <span className="text-[8px] font-mono text-zinc-400">4:5</span>
                    </div>
                    <div>
                      <div className="font-bold text-xs">4:5 Portrait</div>
                      <div className="text-[9px] opacity-75">Product Detail</div>
                    </div>
                  </button>

                </div>
              </div>

              {/* 2. Custom Frame Dimensions Fine-Tuning */}
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Frame Dimensions (px)</span>
                  </span>
                  <span className="font-mono text-[11px] text-zinc-400">
                    {cropSize.width}w × {cropSize.height}h
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {/* Width slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400 text-[10px]">
                      <span>Width</span>
                      <span className="text-white font-mono font-bold">{cropSize.width}px</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={Math.max(100, containerRect.width - 24)}
                      value={cropSize.width}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      className="w-full accent-amber-400 h-1 bg-zinc-800 rounded cursor-pointer"
                    />
                  </div>

                  {/* Height slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400 text-[10px]">
                      <span>Height</span>
                      <span className="text-white font-mono font-bold">{cropSize.height}px</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={Math.max(100, containerRect.height - 24)}
                      value={cropSize.height}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className="w-full accent-amber-400 h-1 bg-zinc-800 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Zoom Controls */}
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Zoom Level</span>
                  </span>
                  <span className="font-mono text-[11px] text-amber-400">{(zoom * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-white h-1 bg-zinc-800 rounded cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 4. Rotation Controls */}
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Rotate Image</span>
                  </span>
                  <span className="font-mono text-[11px] text-emerald-400">{rotation}°</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleRotateLeft}
                    className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                    title="Rotate -90°"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full accent-white h-1 bg-zinc-800 rounded cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={handleRotateRight}
                    className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                    title="Rotate +90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 5. Live Preview Section (Updates immediately with exact custom crop) */}
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

                {/* Custom Aspect Ratio Preview Box */}
                <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 flex items-center gap-3">
                  
                  {/* Cropped Image Thumbnail with Dynamic Aspect Ratio */}
                  <div
                    className="relative overflow-hidden rounded-xl border border-zinc-700 bg-black shrink-0 max-w-[90px] max-h-[100px] flex items-center justify-center"
                    style={{
                      aspectRatio: `${cropSize.width} / ${cropSize.height}`,
                      width: cropSize.width >= cropSize.height ? '80px' : `${Math.round(80 * (cropSize.width / cropSize.height))}px`,
                      height: cropSize.height >= cropSize.width ? '90px' : `${Math.round(80 * (cropSize.height / cropSize.width))}px`
                    }}
                  >
                    <img
                      src={livePreviewUrl || imageSrc}
                      alt="Cropped Preview"
                      className="w-full h-full object-cover transition-all"
                    />
                  </div>

                  {/* Mock Context Specs */}
                  <div className="space-y-1 text-xs flex-1 min-w-0">
                    <div className="font-bold text-white truncate">QuickFit Custom Crop</div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      {cropSize.width}×{cropSize.height} ({aspectName === 'free' ? 'Custom' : aspectName})
                    </div>
                    <div className="pt-1 flex items-center gap-1.5 flex-wrap">
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

            {/* Modal Action Footer Buttons (Crop, Reset, Save Image) */}
            <div className="pt-3 border-t border-zinc-800 grid grid-cols-3 gap-2">
              
              {/* 1. RESET BUTTON */}
              <button
                type="button"
                onClick={handleReset}
                className="py-2.5 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                title="Reset crop, zoom and rotation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              {/* 2. CROP BUTTON */}
              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={isProcessing}
                className={`py-2.5 px-3 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
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
                className="py-2.5 px-3 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-50"
                title="Save exact custom crop"
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
