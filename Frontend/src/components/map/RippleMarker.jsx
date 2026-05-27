import { useEffect, useRef, useCallback } from "react";
import { useGoogleMap } from "@react-google-maps/api";

/** Neon Cyan used exclusively for search-highlighted markers */
const HIGHLIGHT_COLOR = "#00f0ff";

/**
 * Returns hex color based on complaint severity.
 * Grey = 0 complaints (or NA)
 * Green = 1–4 complaints
 * Yellow = 4–8 complaints
 * Red = 9–12+ complaints
 */
function getColor(complaints) {
  if (complaints === null || complaints === undefined || isNaN(complaints) || complaints === 0) {
    return "#64748b"; // Grey for 0 or NA
  }
  if (complaints <= 4) return "#22c55e"; // Green (1–4)
  if (complaints <= 8) return "#eab308"; // Yellow (4–8)
  return "#ef4444"; // Red (9–12+)
}

/** Number of ripple rings per click */
const RIPPLE_COUNT = 4;
/** Max radius each ripple expands to (meters) */
const MAX_RADIUS = 3000;
/** Duration of each ripple animation (ms) */
const RIPPLE_DURATION = 1800;
/** Delay between successive rings (ms) */
const RIPPLE_STAGGER = 300;

/** Continuous glow interval for highlighted markers (ms) */
const GLOW_INTERVAL = 2400;

/**
 * RippleMarker renders a clickable dot on the map.
 * On click, it spawns animated concentric ripple circles.
 * When `isHighlighted` is true, it renders in Neon Cyan with a larger radius
 * and spawns continuous ripple rings to draw attention.
 */
export default function RippleMarker({ lat, lng, complaints, isHighlighted, onClick }) {
  const map = useGoogleMap();
  const markerRef = useRef(null);
  const ripplesRef = useRef([]);
  const glowTimerRef = useRef(null);

  const baseColor = getColor(complaints);
  const color = isHighlighted ? HIGHLIGHT_COLOR : baseColor;

  // ── Spawn ripple animation ──
  const spawnRipples = useCallback(() => {
    if (!map || !window.google || !window.google.maps) return;

    const center = { lat, lng };
    const mapsLib = window.google.maps;

    for (let i = 0; i < RIPPLE_COUNT; i++) {
      const delay = i * RIPPLE_STAGGER;

      setTimeout(() => {
        const circle = new mapsLib.Circle({
          center,
          radius: 0,
          map,
          strokeColor: color,
          strokeOpacity: 0.7,
          strokeWeight: 2,
          fillColor: color,
          fillOpacity: 0.25,
          clickable: false,
          zIndex: 5,
        });

        ripplesRef.current.push(circle);

        const startTime = performance.now();

        function animate(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / RIPPLE_DURATION, 1);

          // Ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);

          const currentRadius = eased * MAX_RADIUS;
          const currentFillOpacity = 0.25 * (1 - progress);
          const currentStrokeOpacity = 0.7 * (1 - progress);

          circle.setRadius(currentRadius);
          circle.setOptions({
            fillOpacity: currentFillOpacity,
            strokeOpacity: currentStrokeOpacity,
          });

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            circle.setMap(null);
            ripplesRef.current = ripplesRef.current.filter((c) => c !== circle);
          }
        }

        requestAnimationFrame(animate);
      }, delay);
    }
  }, [map, lat, lng, color]);

  // ── Continuous glow effect when highlighted ──
  useEffect(() => {
    if (isHighlighted) {
      // Fire immediately once
      spawnRipples();
      // Then repeat on interval
      glowTimerRef.current = setInterval(spawnRipples, GLOW_INTERVAL);
    } else {
      // Stop continuous glow
      if (glowTimerRef.current) {
        clearInterval(glowTimerRef.current);
        glowTimerRef.current = null;
      }
    }

    return () => {
      if (glowTimerRef.current) {
        clearInterval(glowTimerRef.current);
        glowTimerRef.current = null;
      }
    };
  }, [isHighlighted, spawnRipples]);

  // ── Create the marker circle (small static dot) ──
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    const mapsLib = window.google.maps;

    // Highlighted markers are larger and bolder
    const radius = isHighlighted ? 400 : 250;
    const strokeWeight = isHighlighted ? 4 : 2.5;
    const fillOpacity = isHighlighted ? 0.7 : 0.6;
    const zIndex = isHighlighted ? 25 : 15;

    const marker = new mapsLib.Circle({
      center: { lat, lng },
      radius,
      map,
      strokeColor: color,
      strokeOpacity: 1,
      strokeWeight,
      fillColor: color,
      fillOpacity,
      clickable: true,
      zIndex,
    });

    markerRef.current = marker;

    // Click → ripple + callback
    const clickListener = marker.addListener("click", () => {
      spawnRipples();
      if (onClick) onClick();
    });

    return () => {
      window.google.maps.event.removeListener(clickListener);
      marker.setMap(null);
      // Cleanup lingering ripples
      ripplesRef.current.forEach((c) => c.setMap(null));
      ripplesRef.current = [];
    };
  }, [map, lat, lng, color, isHighlighted, spawnRipples, onClick]);

  return null;
}
