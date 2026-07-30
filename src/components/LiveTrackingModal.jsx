import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';

export const LiveTrackingModal = () => {
  const { isTrackingOpen, setIsTrackingOpen, lastOrder } = useShop();

  if (!isTrackingOpen) return null;

  // Animated rider position percentage on map (0% to 100%)
  const [riderProgress, setRiderProgress] = useState(65);

  useEffect(() => {
    const interval = setInterval(() => {
      setRiderProgress((prev) => (prev >= 95 ? 30 : prev + 5));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      
      {/* BACKDROP */}
      <div
        onClick={() => setIsTrackingOpen(false)}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
      ></div>

      {/* MODAL CONTAINER */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 border border-slate-100 space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
              📍
            </div>
            <div>
              <h2 className="text-xl font-black font-heading text-slate-900">Vijayawada Live GPS Tracking</h2>
              <p className="text-xs text-slate-500">Real-Time Express Delivery Map • Vijayawada (5 KM)</p>
            </div>
          </div>

          <button
            onClick={() => setIsTrackingOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* SIMULATED MAP CANVAS / VECTOR GRAPHIC */}
        <div className="relative h-64 sm:h-72 w-full rounded-2xl bg-slate-900 overflow-hidden shadow-inner border border-slate-800 flex flex-col justify-between p-4 text-white">
          
          {/* MAP BACKGROUND DECORATIONS */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>

          {/* SIMULATED ROAD PATH */}
          <div className="absolute top-1/2 left-8 right-8 h-3 bg-blue-900/60 rounded-full border border-blue-500/30 transform -translate-y-1/2">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-orange-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${riderProgress}%` }}
            ></div>
          </div>

          {/* STORE PIN (START) */}
          <div className="absolute top-1/2 left-8 transform -translate-y-1/2 -translate-x-1/2 text-center z-10">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg border-2 border-white mx-auto">
              🏬
            </div>
            <div className="text-[10px] font-bold mt-1 text-blue-300 bg-slate-900/80 px-2 py-0.5 rounded-full">
              MG Road Store
            </div>
          </div>

          {/* MOVING RIDER PIN */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 text-center z-20 transition-all duration-1000 ease-out"
            style={{ left: `calc(32px + ${riderProgress}% * 0.8)` }}
          >
            <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shadow-2xl border-2 border-white mx-auto animate-bounce">
              🛵
            </div>
            <div className="text-[10px] font-extrabold text-orange-400 bg-slate-950 px-2 py-0.5 rounded-full shadow-lg border border-orange-500/50 whitespace-nowrap">
              Speed: 38 km/h
            </div>
          </div>

          {/* DESTINATION PIN (END) */}
          <div className="absolute top-1/2 right-8 transform -translate-y-1/2 translate-x-1/2 text-center z-10">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-lg border-2 border-white mx-auto">
              🏡
            </div>
            <div className="text-[10px] font-bold mt-1 text-emerald-300 bg-slate-900/80 px-2 py-0.5 rounded-full">
              {lastOrder?.customer?.area || 'Benz Circle'}
            </div>
          </div>

          {/* MAP OVERLAY TOP BADGE */}
          <div className="relative z-10 flex justify-between items-center">
            <span className="glass-dark px-3 py-1 rounded-full text-xs font-bold text-orange-400 border border-white/20">
              ⚡ Rider Arriving In ~12 Mins
            </span>
            <span className="glass-dark px-3 py-1 rounded-full text-xs text-slate-300 border border-white/20">
              Rider: Rajesh (Vijayawada Express)
            </span>
          </div>

          {/* MAP OVERLAY BOTTOM BADGE */}
          <div className="relative z-10 glass-dark p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs">
            <span>Current Location: <strong>Near Trendset Mall Flyover, Vijayawada</strong></span>
            <span className="text-emerald-400 font-bold">● GPS Active</span>
          </div>

        </div>

        {/* DELIVERY ESTIMATION CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500 font-semibold">Store Pickup</div>
            <div className="text-sm font-bold text-slate-900 font-heading">MG Road Boutique</div>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
            <div className="text-xs text-blue-700 font-semibold">Estimated Arrival</div>
            <div className="text-base font-black text-blue-900 font-heading">Within 24 Mins</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500 font-semibold">Delivery Radius</div>
            <div className="text-sm font-bold text-slate-900 font-heading">Vijayawada 5 KM</div>
          </div>
        </div>

      </div>

    </div>
  );
};
