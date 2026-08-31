import React, { useState } from "react";
import { useShop } from "../context/ShopContext";

/**
 * LocationBanner
 * A dismissible sticky banner that communicates location detection status to users.
 * Shows: detecting / granted / denied / out-of-range states with clear CTAs.
 */
export const LocationBanner = () => {
  const { locationStatus, nearbyStores, userLocation, detectUserLocation, resetLocation } = useShop();
  const [dismissed, setDismissed] = useState(false);

  // Do not render in idle state (before any detection starts) or after dismiss
  if (locationStatus === "idle" || dismissed) return null;

  // ── detecting ─────────────────────────────────────────────────────────────
  if (locationStatus === "detecting") {
    return (
      <div style={styles.banner("amber")} role="status" aria-live="polite">
        <div style={styles.inner}>
          <span style={styles.icon}>📡</span>
          <div style={styles.textBlock}>
            <span style={styles.title}>Detecting your location…</span>
            <span style={styles.sub}>Finding nearby stores for fastest delivery</span>
          </div>
          <div style={styles.pulse} />
        </div>
      </div>
    );
  }

  // ── granted (in zone) ──────────────────────────────────────────────────────
  if (locationStatus === "granted" && nearbyStores.length > 0) {
    const nearest = nearbyStores[0];
    return (
      <div style={styles.banner("emerald")} role="status">
        <div style={styles.inner}>
          <span style={styles.icon}>📍</span>
          <div style={styles.textBlock}>
            <span style={styles.title}>
              Showing products from {nearbyStores.length} nearby store{nearbyStores.length > 1 ? "s" : ""}
            </span>
            <span style={styles.sub}>
              Nearest: <strong>{nearest.name}</strong> · {nearest.distanceKm} km · ~{nearest.estimatedMinutes} min delivery
            </span>
          </div>
          <div style={styles.actions}>
            <button
              onClick={resetLocation}
              style={styles.btn("emerald")}
              title="Change your location"
            >
              Change
            </button>
            <button onClick={() => setDismissed(true)} style={styles.close} aria-label="Dismiss">
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── out_of_range ───────────────────────────────────────────────────────────
  if (locationStatus === "out_of_range") {
    return (
      <div style={styles.banner("red")} role="alert">
        <div style={styles.inner}>
          <span style={styles.icon}>🚫</span>
          <div style={styles.textBlock}>
            <span style={styles.title}>We don't deliver to your area yet</span>
            <span style={styles.sub}>No stores within delivery range of your current location</span>
          </div>
          <div style={styles.actions}>
            <button onClick={resetLocation} style={styles.btn("red")}>
              Try Again
            </button>
            <button onClick={() => setDismissed(true)} style={styles.close} aria-label="Dismiss">
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── denied (location blocked or no location saved) ─────────────────────────
  if (locationStatus === "denied") {
    return (
      <div style={styles.banner("slate")} role="status">
        <div style={styles.inner}>
          <span style={styles.icon}>🔒</span>
          <div style={styles.textBlock}>
            <span style={styles.title}>Location access denied</span>
            <span style={styles.sub}>Showing all products. Enable location for faster, nearby delivery.</span>
          </div>
          <div style={styles.actions}>
            <button onClick={detectUserLocation} style={styles.btn("slate")}>
              Enable
            </button>
            <button onClick={() => setDismissed(true)} style={styles.close} aria-label="Dismiss">
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// ── Inline styles (no Tailwind dependency) ────────────────────────────────────
const COLOR_MAP = {
  amber:   { bg: "#fffbeb", border: "#f59e0b", text: "#92400e", btnBg: "#f59e0b",   btnText: "#fff" },
  emerald: { bg: "#f0fdf4", border: "#22c55e", text: "#14532d", btnBg: "#16a34a",   btnText: "#fff" },
  red:     { bg: "#fef2f2", border: "#f87171", text: "#7f1d1d", btnBg: "#dc2626",   btnText: "#fff" },
  slate:   { bg: "#f8fafc", border: "#94a3b8", text: "#334155", btnBg: "#475569",   btnText: "#fff" },
};

const styles = {
  banner: (color) => ({
    position: "sticky",
    top: 0,
    zIndex: 900,
    backgroundColor: COLOR_MAP[color].bg,
    borderBottom: `2px solid ${COLOR_MAP[color].border}`,
    padding: "10px 16px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  }),
  inner: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  icon: {
    fontSize: 20,
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: "-0.01em",
  },
  sub: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 500,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  btn: (color) => ({
    padding: "5px 14px",
    borderRadius: 999,
    border: "none",
    backgroundColor: COLOR_MAP[color].btnBg,
    color: COLOR_MAP[color].btnText,
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    transition: "opacity 0.15s",
  }),
  close: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    color: "#94a3b8",
    padding: "4px 6px",
    borderRadius: 4,
    lineHeight: 1,
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: "#f59e0b",
    animation: "pulse 1.4s ease-in-out infinite",
    flexShrink: 0,
  },
};

export default LocationBanner;
