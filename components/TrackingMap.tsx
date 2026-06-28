"use client";

import { useEffect, useRef, useState } from "react";

export interface Checkpoint {
  name: string;
  label: string; // e.g. "Seller", "Hub", "Delivery"
  position: [number, number] | null; // null = coords unknown
  color: string; // hex or named colour for the marker
  icon: string; // Bootstrap icon class
}

interface TrackingMapProps {
  checkpoints: Checkpoint[];
}

/**
 * A client-side Leaflet map that:
 *  - Shows only checkpoints with valid coordinates
 *  - Falls back to a styled "No map data" UI when none are available
 *  - Uses coloured circle markers to distinguish Seller / Hub / Delivery
 *  - Draws a polyline between valid points
 *  - Fits the map to all visible markers automatically
 *  - Guards against the Leaflet SSR/icon-URL bug via L.Icon.Default.mergeOptions
 */
const TrackingMap: React.FC<TrackingMapProps> = ({ checkpoints }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [hasCoords, setHasCoords] = useState(false);

  useEffect(() => {
    const validCheckpoints = checkpoints.filter(
      (c) =>
        c.position &&
        c.position[0] !== 0 &&
        c.position[1] !== 0 &&
        !isNaN(c.position[0]) &&
        !isNaN(c.position[1])
    );

    if (validCheckpoints.length === 0) {
      setHasCoords(false);
      setMapReady(true);
      return;
    }

    setHasCoords(true);

    let L: any;
    let map: any;

    const initMap = async () => {
      // Dynamic import – keeps Leaflet out of the SSR bundle
      L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Fix broken default icon paths in Next.js
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current || leafletMapRef.current) return;

      const positions = validCheckpoints.map((c) => c.position as [number, number]);

      // Create map
      map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false });
      leafletMapRef.current = map;

      // -------------------------------------------------------
      // TILE LAYER: MapmyIndia Mappls (India's official map)
      // Shows correct political boundaries as per Survey of India.
      // Requires NEXT_PUBLIC_MAPPLS_KEY env var.
      // Falls back to OpenStreetMap if key not configured.
      // -------------------------------------------------------
      const mapplsKey = process.env.NEXT_PUBLIC_MAPPLS_KEY;

      if (mapplsKey) {
        // Mappls REST Maps tile layer — official Indian map authority
        L.tileLayer(
          `https://apis.mapmyindia.com/advancedmaps/v1/${mapplsKey}/still_m/{z}/{x}/{y}.png`,
          {
            attribution:
              '&copy; <a href="https://www.mappls.com" target="_blank">MapmyIndia</a> | &copy; <a href="https://www.surveyofindia.gov.in" target="_blank">Survey of India</a>',
            maxZoom: 18,
            minZoom: 4,
          }
        ).addTo(map);
      } else {
        // Fallback — OpenStreetMap (note: uses disputed borders in some regions)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(map);
      }

      // Fit map to all markers
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40] });

      // Custom coloured circle markers
      validCheckpoints.forEach((cp, idx) => {
        const pos = cp.position as [number, number];

        const circleMarker = L.circleMarker(pos, {
          radius: 14,
          fillColor: cp.color,
          color: "#fff",
          weight: 3,
          opacity: 1,
          fillOpacity: 0.9,
        }).addTo(map);

        circleMarker.bindPopup(
          `<div style="font-family:system-ui;text-align:center;min-width:130px">
            <div style="font-weight:700;font-size:0.9rem;margin-bottom:4px">${cp.label}</div>
            <div style="color:#555;font-size:0.8rem">${cp.name}</div>
          </div>`,
          { offset: [0, -10] }
        );

        // Open the last checkpoint popup by default (delivery)
        if (idx === validCheckpoints.length - 1) circleMarker.openPopup();
      });

      // Dashed animated polyline connecting waypoints
      if (positions.length > 1) {
        // Solid main line
        L.polyline(positions, {
          color: "#e63946",
          weight: 3,
          opacity: 0.8,
        }).addTo(map);

        // Dashed overlay for visual style
        L.polyline(positions, {
          color: "#fff",
          weight: 1,
          opacity: 0.6,
          dashArray: "6, 10",
        }).addTo(map);
      }

      setMapReady(true);
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [checkpoints]);

  // Fallback when no valid coordinates are available
  if (mapReady && !hasCoords) {
    return (
      <div
        style={{
          height: "280px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
          border: "2px dashed #dee2e6",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
        }}
      >
        <i
          className="bi bi-map text-muted"
          style={{ fontSize: "3rem", opacity: 0.4 }}
        />
        <div style={{ textAlign: "center" }}>
          <div
            className="fw-bold text-muted"
            style={{ fontSize: "1rem" }}
          >
            Live Map Unavailable
          </div>
          <div className="text-muted small mt-1">
            Location data for this order isn&apos;t available yet.
            <br />
            Use the journey tracker above to follow your parcel.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Loading skeleton */}
      {!mapReady && (
        <div
          style={{
            height: "400px",
            borderRadius: "16px",
            background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="text-muted small d-flex align-items-center gap-2">
            <span
              className="spinner-border spinner-border-sm text-danger"
              role="status"
            />
            Loading map…
          </div>
        </div>
      )}

      {/* Leaflet map container */}
      <div
        ref={mapRef}
        style={{
          height: "400px",
          width: "100%",
          borderRadius: "16px",
          display: mapReady && hasCoords ? "block" : "none",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      />

      {/* Legend */}
      {mapReady && hasCoords && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(8px)",
            borderRadius: "12px",
            padding: "10px 14px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
            zIndex: 500,
            fontSize: "0.78rem",
            fontFamily: "system-ui",
          }}
        >
          {checkpoints
            .filter(
              (c) =>
                c.position &&
                c.position[0] !== 0 &&
                c.position[1] !== 0
            )
            .map((cp, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: i < checkpoints.length - 1 ? "4px" : 0,
                }}
              >
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: cp.color,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "#333", fontWeight: 600 }}>
                  {cp.label}
                </span>
                <span style={{ color: "#888" }}>{cp.name}</span>
              </div>
            ))}
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default TrackingMap;
