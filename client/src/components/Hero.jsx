import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import { useShop } from '../context/ShopContext';
import { resolveImageUrl, handleImageError, DEFAULT_PLACEHOLDER_IMAGE } from '../config/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Hero = () => {
  const { setSelectedCategory, products, openProductDetail, API_BASE_URL } = useShop();

  const handleShopNow = () => {
    setSelectedCategory('All');
    const catalog = document.getElementById('catalog-section');
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExplore = () => {
    const categories = document.getElementById('categories-section');
    if (categories) {
      categories.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 1. Live Hero Showcase products selected by the Admin
  const [customShowcase, setCustomShowcase] = useState(null);

  const loadShowcase = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/products/showcase`, {
        params: { _t: Date.now() },
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (Array.isArray(res.data)) {
        setCustomShowcase(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch /products/showcase directly:', err.message);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    loadShowcase();
    const handleUpdate = () => {
      loadShowcase();
    };
    window.addEventListener('quickfit_showcase_updated', handleUpdate);
    window.addEventListener('quickfit_products_updated', handleUpdate);
    return () => {
      window.removeEventListener('quickfit_showcase_updated', handleUpdate);
      window.removeEventListener('quickfit_products_updated', handleUpdate);
    };
  }, [loadShowcase]);

  // Curate showcase products:
  // If customShowcase is loaded, strictly use admin's selection.
  // Otherwise fallback to products where isHeroShowcase is true.
  const showcaseProducts = useMemo(() => {
    if (customShowcase !== null) {
      return customShowcase.filter((p) => p && (p.images?.front || p.image));
    }
    if (!products || products.length === 0) return [];
    const selected = products.filter((p) => p && p.isHeroShowcase && (p.images?.front || p.image));
    return selected;
  }, [customShowcase, products]);

  const hasCarousel = showcaseProducts.length >= 2;
  const singleProduct = showcaseProducts[0] || (products.length > 0 ? products[0] : null);

  // Fallback hero image if single product or insufficient images
  const singleHeroImageSrc = resolveImageUrl(
    singleProduct?.images?.front || singleProduct?.image || '/uploads/quickfit-product-front-4x5-final-1789044286288-437978021.jpg'
  );

  // 2. Carousel state management
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index if it exceeds the new showcase items length
  useEffect(() => {
    if (currentIndex >= showcaseProducts.length && showcaseProducts.length > 0) {
      setCurrentIndex(0);
    }
  }, [showcaseProducts.length, currentIndex]);

  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  // Touch tracking for mobile swipe
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const isSwipingRef = useRef(false);

  // 3. Accessibility & Viewport Listeners
  useEffect(() => {
    const handleVisibility = () => {
      setIsPageVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e) => setPrefersReducedMotion(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionChange);
    } else {
      mediaQuery.addListener(handleMotionChange);
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMotionChange);
      } else {
        mediaQuery.removeListener(handleMotionChange);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 4. Autoplay transitions every 3.5 seconds
  const totalItems = showcaseProducts.length;
  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    if (totalItems <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    if (totalItems <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  const handleSelect = useCallback((idx) => {
    setCurrentIndex(idx);
  }, []);

  useEffect(() => {
    if (!hasCarousel || prefersReducedMotion || !isPageVisible || isHovered || isInteracting) {
      return;
    }

    const interval = setInterval(() => {
      handleNext();
    }, 3500);

    return () => clearInterval(interval);
  }, [hasCarousel, handleNext, prefersReducedMotion, isPageVisible, isHovered, isInteracting]);

  // 5. Preload next and previous product images
  useEffect(() => {
    if (!hasCarousel || showcaseProducts.length === 0) return;
    const nextIdx = (currentIndex + 1) % showcaseProducts.length;
    const prevIdx = (currentIndex - 1 + showcaseProducts.length) % showcaseProducts.length;

    const urls = [
      resolveImageUrl(showcaseProducts[nextIdx]?.images?.front || showcaseProducts[nextIdx]?.image),
      resolveImageUrl(showcaseProducts[prevIdx]?.images?.front || showcaseProducts[prevIdx]?.image)
    ].filter(Boolean);

    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [hasCarousel, currentIndex, showcaseProducts]);

  // 6. Mobile swipe handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    isSwipingRef.current = false;
    setIsInteracting(true);
  };

  const handleTouchMove = (e) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(touchDeltaX.current) > 10) {
      isSwipingRef.current = true;
    }
  };

  const handleTouchEnd = () => {
    setIsInteracting(false);
    if (touchDeltaX.current < -40) {
      handleNext();
    } else if (touchDeltaX.current > 40) {
      handlePrev();
    }
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 100);
    touchStartX.current = 0;
    touchDeltaX.current = 0;
  };

  // 7. Calculate diff and 3D card stack styles
  const getDiff = (idx) => {
    let diff = idx - currentIndex;
    while (diff > totalItems / 2) diff -= totalItems;
    while (diff < -totalItems / 2) diff += totalItems;
    return diff;
  };

  const getCardStyle = (diff) => {
    if (prefersReducedMotion) {
      if (diff === 0) {
        return {
          opacity: 1,
          zIndex: 30,
          pointerEvents: 'auto',
          transform: 'translate(-50%, -50%)'
        };
      }
      return {
        opacity: 0,
        zIndex: 10,
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)'
      };
    }

    if (isMobile) {
      if (diff === 0) {
        return {
          transform: 'translate(-50%, -50%) translateX(0%) scale(1)',
          opacity: 1,
          zIndex: 30,
          pointerEvents: 'auto'
        };
      } else if (diff === -1) {
        return {
          transform: 'translate(-50%, -50%) translateX(-65%) scale(0.82) rotateY(6deg)',
          opacity: 0.22,
          zIndex: 20,
          pointerEvents: 'auto'
        };
      } else if (diff === 1) {
        return {
          transform: 'translate(-50%, -50%) translateX(65%) scale(0.82) rotateY(-6deg)',
          opacity: 0.22,
          zIndex: 20,
          pointerEvents: 'auto'
        };
      }
      return {
        transform: diff > 0
          ? 'translate(-50%, -50%) translateX(100%) scale(0.7)'
          : 'translate(-50%, -50%) translateX(-100%) scale(0.7)',
        opacity: 0,
        zIndex: 10,
        pointerEvents: 'none'
      };
    }

    // Desktop 3D Card Stack
    if (diff === 0) {
      return {
        transform: 'translate(-50%, -50%) translateX(0%) scale(1) translateZ(0px) rotateY(0deg)',
        opacity: 1,
        zIndex: 30,
        pointerEvents: 'auto',
        filter: 'none'
      };
    } else if (diff === -1) {
      return {
        transform: 'translate(-50%, -50%) translateX(-36%) scale(0.86) translateZ(-50px) rotateY(8deg)',
        opacity: 0.55,
        zIndex: 20,
        pointerEvents: 'auto',
        filter: 'contrast(0.98)'
      };
    } else if (diff === 1) {
      return {
        transform: 'translate(-50%, -50%) translateX(36%) scale(0.86) translateZ(-50px) rotateY(-8deg)',
        opacity: 0.55,
        zIndex: 20,
        pointerEvents: 'auto',
        filter: 'contrast(0.98)'
      };
    }

    // Hidden queued cards
    return {
      transform: diff > 0
        ? 'translate(-50%, -50%) translateX(75%) scale(0.72) translateZ(-100px) rotateY(-14deg)'
        : 'translate(-50%, -50%) translateX(-75%) scale(0.72) translateZ(-100px) rotateY(14deg)',
      opacity: 0,
      zIndex: 10,
      pointerEvents: 'none'
    };
  };

  const handleCardClick = (product, diff, idx) => {
    if (isSwipingRef.current) return;
    if (diff === 0) {
      openProductDetail(product);
    } else if (Math.abs(diff) === 1) {
      handleSelect(idx);
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 bg-gradient-to-b from-slate-50 via-slate-100/60 to-white">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN - CONTENT & CTAs (Preserved 100%) */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
            
            {/* BADGE */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
              <span>QUICKFIT FASHION · MEN'S STREETWEAR ARCHIVE</span>
            </div>

            {/* MAIN HEADLINE */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08] font-heading uppercase">
              PREMIUM MEN'S <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 bg-clip-text text-transparent">
                FASHION & FITS.
              </span>
            </h1>

            {/* SUBHEADLINE */}
            <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Welcome to <strong className="font-semibold text-slate-800">QuickFit Fashion</strong>. Discover premium men's clothing, luxury oversized t-shirts, drop shoulder fits, and polo t-shirts crafted with 240+ GSM heavyweight cotton for modern drape and durability.
            </p>

            {/* CTAs BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={handleShopNow}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-slate-900 hover:bg-black text-white font-extrabold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2.5 !min-h-[48px]"
              >
                <span>Shop Collection</span>
                <span>➔</span>
              </button>

              <button
                onClick={handleExplore}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white border border-slate-300 text-slate-800 font-bold text-sm shadow-xs hover:bg-slate-50 transition-all duration-300 flex items-center justify-center gap-2 !min-h-[48px]"
              >
                <span>Explore Men's Wear</span>
                <span>↓</span>
              </button>
            </div>

            {/* SPECS */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-3 text-center lg:text-left max-w-md mx-auto lg:mx-0">
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-heading">240+ GSM</div>
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Heavy Cotton</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-heading">BOXY</div>
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Modern Drape</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-heading">EXPRESS</div>
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Vijayawada Hub</div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN - ANIMATED HERO 3D PRODUCT CAROUSEL */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            
            {!hasCarousel ? (
              /* Fallback for single or insufficient product images */
              <div
                onClick={() => singleProduct && openProductDetail(singleProduct)}
                className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 group cursor-pointer p-3 sm:p-4 flex flex-col justify-between"
              >
                <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-100 mb-3">
                  <img
                    src={singleHeroImageSrc}
                    alt={singleProduct?.name || "QuickFit Men's Streetwear"}
                    loading="eager"
                    fetchpriority="high"
                    decoding="sync"
                    onError={(e) => handleImageError(e, DEFAULT_PLACEHOLDER_IMAGE)}
                    className="w-full h-full object-cover object-top product-image-hd group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                <div className="flex items-center justify-between text-slate-900 px-1 pt-1">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      {singleProduct?.subcategory || "Heavy French Terry"}
                    </span>
                    <h3 className="text-xs sm:text-sm font-black uppercase line-clamp-1">
                      {singleProduct?.name || "Monochrome Boxy Oversized Tee"}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm sm:text-base font-black text-slate-900">
                      ₹{singleProduct?.price || 1499}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Premium 3D Card Stack Product Showcase Carousel */
              <div
                className="relative w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[480px] flex flex-col items-center justify-center select-none"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* 3D Stage Container */}
                <div className="relative w-full h-[450px] sm:h-[490px] lg:h-[510px] flex items-center justify-center hero-carousel-stage">
                  
                  {/* Cards Stack */}
                  {showcaseProducts.map((product, idx) => {
                    const diff = getDiff(idx);
                    const isCenter = diff === 0;
                    const isAdjacent = Math.abs(diff) === 1;

                    return (
                      <div
                        key={product._id || idx}
                        onClick={() => handleCardClick(product, diff, idx)}
                        style={getCardStyle(diff)}
                        className={`absolute left-1/2 top-1/2 w-[260px] sm:w-[290px] lg:w-[320px] bg-white rounded-3xl overflow-hidden border border-slate-200 p-3 sm:p-4 flex flex-col justify-between hero-carousel-card ${
                          isCenter
                            ? 'shadow-2xl shadow-slate-900/15 cursor-pointer group'
                            : isAdjacent
                            ? 'shadow-lg cursor-pointer hover:opacity-75'
                            : 'pointer-events-none'
                        }`}
                        aria-hidden={!isCenter}
                      >
                        {/* Product Image Frame */}
                        <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-100 mb-2.5 sm:mb-3">
                          <img
                            src={resolveImageUrl(product.images?.front || product.image || DEFAULT_PLACEHOLDER_IMAGE)}
                            alt={product.name || "QuickFit Men's Streetwear"}
                            loading={idx === 0 ? "eager" : "lazy"}
                            fetchpriority={idx === 0 ? "high" : "auto"}
                            decoding="async"
                            onError={(e) => handleImageError(e, DEFAULT_PLACEHOLDER_IMAGE)}
                            className={`w-full h-full object-cover object-top product-image-hd transition-transform duration-700 ${
                              isCenter ? 'group-hover:scale-105' : ''
                            }`}
                          />

                          {/* Category Tag Badge */}
                          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                            {product.subcategory || "Men's Fit"}
                          </div>

                          {/* Click / Zoom Hint on Active Card */}
                          {isCenter && (
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-md text-slate-800 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              View Fit ➔
                            </div>
                          )}
                        </div>

                        {/* Product Details Bar */}
                        <div className="flex items-center justify-between text-slate-900 px-1 pt-0.5">
                          <div className="min-w-0 pr-2">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                              {product.subcategory || "Heavy French Terry"}
                            </span>
                            <h3 className="text-xs sm:text-sm font-black uppercase line-clamp-1">
                              {product.name}
                            </h3>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm sm:text-base font-black text-slate-900">
                              ₹{product.price}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Previous Arrow Control */}
                  <button
                    type="button"
                    onClick={handlePrev}
                    onFocus={() => setIsInteracting(true)}
                    onBlur={() => setIsInteracting(false)}
                    aria-label="Previous product"
                    className="absolute -left-2 sm:-left-4 lg:-left-5 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md border border-slate-200/80 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
                  </button>

                  {/* Next Arrow Control */}
                  <button
                    type="button"
                    onClick={handleNext}
                    onFocus={() => setIsInteracting(true)}
                    onBlur={() => setIsInteracting(false)}
                    aria-label="Next product"
                    className="absolute -right-2 sm:-right-4 lg:-right-5 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md border border-slate-200/80 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
                  </button>

                </div>

                {/* Pagination Dots Controls */}
                <div className="flex items-center justify-center gap-1.5 pt-3 z-30">
                  {showcaseProducts.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelect(idx)}
                      onFocus={() => setIsInteracting(true)}
                      onBlur={() => setIsInteracting(false)}
                      aria-label={`Showcase product ${idx + 1}`}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === currentIndex
                          ? 'w-7 bg-slate-900 shadow-xs'
                          : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>

              </div>
            )}

          </div>

        </div>
      </div>
    </section>
  );
};
