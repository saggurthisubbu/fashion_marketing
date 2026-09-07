import React from "react";
import { useShop } from "../context/ShopContext";

/**
 * LocationBanner
 * Sleek sticky banner that displays delivery destination and allows changing location.
 * Requirement 8: "Delivering to: {Area Name}" with a Change button.
 */
export const LocationBanner = () => {
  const { locationStatus, verifiedLocation, nearbyStores, detectUserLocation, resetLocation } = useShop();

  // If no location status or idle, don't show or show compact prompt if no saved location
  if (locationStatus === "idle" && !verifiedLocation) return null;

  // ── 1. GRANTED / IN ZONE (Saved Location active) ───────────────────────────
  if ((locationStatus === "granted" || verifiedLocation?.inZone) && (verifiedLocation || nearbyStores.length > 0)) {
    const areaName =
      verifiedLocation?.areaName ||
      nearbyStores[0]?.address?.split(",")?.[0]?.trim() ||
      nearbyStores[0]?.name ||
      "Vijayawada";

    const storeInfo = verifiedLocation?.nearestStore || nearbyStores[0];

    return (
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white py-2 px-3 sm:px-4 shadow-sm text-xs select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 min-w-0">
            {/* Live radar pulse */}
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>

            <span className="text-slate-400 font-medium shrink-0">Delivering to:</span>
            <span className="font-extrabold text-white truncate font-heading tracking-wide">
              {areaName}
            </span>

            {storeInfo && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full ml-1 font-mono">
                ⚡ 60-Min Express
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={resetLocation}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700 hover:border-slate-600 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              title="Change your delivery location"
            >
              <span>📍</span>
              <span>Change</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ── 2. OUT OF RANGE (Outside express delivery radius) ──────────────────────
  if (locationStatus === "out_of_range" || (verifiedLocation && !verifiedLocation.inZone)) {
    const areaName = verifiedLocation?.areaName || "your area";
    return (
      <div className="sticky top-0 z-40 bg-rose-950 border-b border-rose-900 text-white py-2 px-3 sm:px-4 shadow-sm text-xs select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0">🚫</span>
            <span className="text-rose-200 font-semibold truncate">
              Express 60-min delivery currently not available in {areaName}. Showing catalog for standard delivery.
            </span>
          </div>
          <button
            type="button"
            onClick={resetLocation}
            className="px-3 py-1 rounded-lg bg-rose-900 hover:bg-rose-800 text-white text-[11px] font-bold border border-rose-700 transition-all cursor-pointer shrink-0 active:scale-95"
          >
            Change Location
          </button>
        </div>
      </div>
    );
  }

  // ── 3. DETECTING (Acquiring GPS Signal) ────────────────────────────────────
  if (locationStatus === "detecting") {
    return (
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-300 py-2 px-3 sm:px-4 shadow-sm text-xs select-none">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0"></span>
          <span className="text-slate-300 font-medium">
            Detecting your location for 60-min express fashion delivery in Vijayawada...
          </span>
        </div>
      </div>
    );
  }

  // ── 4. DENIED (Location blocked in browser) ────────────────────────────────
  if (locationStatus === "denied") {
    return (
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-300 py-2 px-3 sm:px-4 shadow-sm text-xs select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0">📍</span>
            <span className="text-slate-300 font-medium truncate">
              Enable location to verify 60-min express delivery and nearby stores.
            </span>
          </div>
          <button
            type="button"
            onClick={() => detectUserLocation(true)}
            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
          >
            Enable Location
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default LocationBanner;
