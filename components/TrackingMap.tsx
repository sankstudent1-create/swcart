"use client";

import { useEffect, useRef, useState } from "react";

export interface Checkpoint {
  name: string;
  label: string; // e.g. "Seller", "Hub", "Delivery"
  position: [number, number] | null; // null = coords unknown
  color: string; // hex or named colour for the marker
  icon: string; // Bootstrap icon class
}

}

export interface VehicleAnimation {
  type: "truck" | "bike";
  fromIndex: number;
  toIndex: number;
  progress: number;
}

interface TrackingMapProps {
  checkpoints: Checkpoint[];
  activeVehicle?: VehicleAnimation;
}

const TRUCK_ICON = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><circle cx="12" cy="12" r="12" fill="%233b82f6"/><path d="M17 8h-3V6c0-1.1-.9-2-2-2H4C2.9 6 2 6.9 2 8v7h2c0 1.1.9 2 2 2s2-.9 2-2h6c0 1.1.9 2 2 2s2-.9 2-2h2v-5l-3-2zM6 15.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm12 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm-1-5H6V6h6v4z" fill="white"/></svg>`;
const BIKE_ICON = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><circle cx="12" cy="12" r="12" fill="%2310b981"/><path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.7-1.6-.7-.6 0-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z" fill="white"/></svg>`;

const MAPPLS_KEY =
  process.env.NEXT_PUBLIC_MAPPLS_KEY || "e5287c2e8e625032961522666d3693e7";

/**
 * Loads the official Mappls Web SDK from sdk.mappls.com
 * Official URL format per Mappls documentation (2024):
 *   https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=<KEY>
 *
 * Falls back to the legacy apis.mappls.com endpoint if needed.
 */
const loadMapplsSDK = (): Promise<boolean> =>
  new Promise((resolve) => {
    const win = window as any;

    // Already loaded
    if (win.mappls?.Map || win.MapmyIndia?.Map) {
      resolve(true);
      return;
    }

    // Correct official URLs (newest first)
    const candidates = [
      `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${MAPPLS_KEY}`,
      `https://apis.mappls.com/advancedmaps/api/${MAPPLS_KEY}/map_sdk?v=3.0&layer=vector`,
    ];

    let idx = 0;

    const tryNext = () => {
      if (idx >= candidates.length) {
        resolve(false);
        return;
      }

      const src = candidates[idx++];

      // Remove any stale script with the same base URL
      document
        .querySelectorAll(`script[src^="${src.split("?")[0]}"]`)
        .forEach((s) => s.remove());

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        if (win.mappls?.Map || win.MapmyIndia?.Map) {
          resolve(true);
        } else {
          // SDK loaded but window obj not ready — wait one tick
          setTimeout(() => {
            if (win.mappls?.Map || win.MapmyIndia?.Map) resolve(true);
            else tryNext();
          }, 300);
        }
      };

      script.onerror = tryNext;
      document.head.appendChild(script);
    };

    tryNext();
  });

const TrackingMap: React.FC<TrackingMapProps> = ({ checkpoints, activeVehicle }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [hasCoords, setHasCoords] = useState(false);
  const [mapProvider, setMapProvider] = useState<"mappls" | "leaflet" | null>(null);
  const mapInstanceRef = useRef<any>(null);

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

    const initMap = async () => {
      if (!mapRef.current) return;

      // ── 1. Try official Mappls SDK (India's authoritative map) ──────────────
      try {
        const loaded = await loadMapplsSDK();
        const sdk = (window as any).mappls || (window as any).MapmyIndia;

        if (loaded && sdk?.Map) {
          const center = validCheckpoints[validCheckpoints.length - 1].position!;

          const map = new sdk.Map(mapRef.current, {
            center: { lat: center[0], lng: center[1] },
            zoom: 6,
            zoomControl: true,
          });
          mapInstanceRef.current = map;

          // Markers
          validCheckpoints.forEach((cp) => {
            const pos = { lat: cp.position![0], lng: cp.position![1] };
            new sdk.Marker({
              map,
              position: pos,
              popupHtml: `
                <div style="font-family:'Plus Jakarta Sans',system-ui;text-align:center;min-width:140px;padding:6px 4px">
                  <div style="font-weight:800;font-size:0.9rem;color:${cp.color};margin-bottom:3px">${cp.label}</div>
                  <div style="color:#333;font-size:0.8rem;font-weight:600">${cp.name}</div>
                </div>`,
            });
          });

          // Route polyline
          if (validCheckpoints.length > 1) {
            const coords = validCheckpoints.map((cp) => ({
              lat: cp.position![0],
              lng: cp.position![1],
            }));
            new sdk.Polyline({
              map,
              path: coords,
              strokeColor: "#e63946",
              strokeOpacity: 0.85,
              strokeWeight: 4,
            });
          }

          // Animated Vehicle
          if (activeVehicle && activeVehicle.fromIndex < validCheckpoints.length && activeVehicle.toIndex < validCheckpoints.length) {
            const p1 = validCheckpoints[activeVehicle.fromIndex].position!;
            const p2 = validCheckpoints[activeVehicle.toIndex].position!;
            const iconUrl = activeVehicle.type === 'truck' ? TRUCK_ICON : BIKE_ICON;
            
            const vMarker = new sdk.Marker({
              map,
              position: { lat: p1[0], lng: p1[1] },
              icon: iconUrl,
            });

            let t = activeVehicle.progress;
            const animate = () => {
              t += 0.003;
              if (t > 1) t = 0;
              const curLat = p1[0] + (p2[0] - p1[0]) * t;
              const curLng = p1[1] + (p2[1] - p1[1]) * t;
              vMarker.setPosition({ lat: curLat, lng: curLng });
              (vMarker as any)._animationId = requestAnimationFrame(animate);
            };
            animate();
            
            // Store for cleanup
            (map as any)._vMarker = vMarker;
          }

          setMapProvider("mappls");
          setMapReady(true);
          return; // ✅ Mappls loaded — done
        }
      } catch {
        // Fall through to Leaflet
      }

      // ── 2. Leaflet + ISRO Bhuvan WMS overlay (fallback) ────────────────────
      // Bhuvan is India's official national geospatial portal by ISRO/NRSC/
      // Survey of India — no API key required, shows correct Indian borders.
      try {
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        const map = L.map(mapRef.current!, {
          zoomControl: true,
          scrollWheelZoom: false,
        });
        mapInstanceRef.current = map;

        // Base tiles — OpenStreetMap
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        // Official Indian boundary overlay — ISRO Bhuvan WMS
        // Layer "india3" = administrative boundary as per Survey of India / GoI
        try {
          L.tileLayer.wms("https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms", {
            layers: "india3",
            format: "image/png",
            transparent: true,
            opacity: 0.55,
            version: "1.1.1",
            attribution:
              '&copy; <a href="https://bhuvan.nrsc.gov.in" target="_blank">ISRO Bhuvan</a> | Survey of India',
          } as any).addTo(map);
        } catch {
          /* non-fatal */
        }

        // Fit bounds
        const positions = validCheckpoints.map(
          (c) => c.position as [number, number]
        );
        map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });

        // Checkpoint markers
        validCheckpoints.forEach((cp, idx) => {
          const pos = cp.position as [number, number];
          const marker = L.circleMarker(pos, {
            radius: 14,
            fillColor: cp.color,
            color: "#fff",
            weight: 3,
            opacity: 1,
            fillOpacity: 0.92,
          }).addTo(map);

          marker.bindPopup(
            `<div style="font-family:'Plus Jakarta Sans',system-ui;text-align:center;min-width:140px;padding:4px 0">
              <div style="font-weight:800;font-size:0.88rem;color:${cp.color};margin-bottom:3px">${cp.label}</div>
              <div style="color:#333;font-size:0.8rem;font-weight:600">${cp.name}</div>
            </div>`,
            { offset: [0, -12] }
          );
          if (idx === validCheckpoints.length - 1) marker.openPopup();
        });

        // Route polyline
        if (positions.length > 1) {
          L.polyline(positions, {
            color: "#e63946",
            weight: 4,
            opacity: 0.85,
          }).addTo(map);
          L.polyline(positions, {
            color: "#fff",
            weight: 2,
            opacity: 0.5,
            dashArray: "8, 12",
          }).addTo(map);
        }

        // Animated Vehicle for Leaflet
        if (activeVehicle && activeVehicle.fromIndex < validCheckpoints.length && activeVehicle.toIndex < validCheckpoints.length) {
          const p1 = validCheckpoints[activeVehicle.fromIndex].position!;
          const p2 = validCheckpoints[activeVehicle.toIndex].position!;
          const iconUrl = activeVehicle.type === 'truck' ? TRUCK_ICON : BIKE_ICON;
          
          const vIcon = L.icon({
            iconUrl: iconUrl,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });
          
          const vMarker = L.marker([p1[0], p1[1]], { icon: vIcon }).addTo(map);

          let t = activeVehicle.progress;
          const animate = () => {
            t += 0.003;
            if (t > 1) t = 0;
            const curLat = p1[0] + (p2[0] - p1[0]) * t;
            const curLng = p1[1] + (p2[1] - p1[1]) * t;
            vMarker.setLatLng([curLat, curLng]);
            (vMarker as any)._animationId = requestAnimationFrame(animate);
          };
          animate();
          
          // Store for cleanup
          (map as any)._vMarker = vMarker;
        }

        setMapProvider("leaflet");
        setMapReady(true);
      } catch (err) {
        console.error("TrackingMap: all map providers failed", err);
      }
    };

    initMap();

    return () => {
      const m = mapInstanceRef.current;
      if (m) {
        try {
          if (m._vMarker && m._vMarker._animationId) cancelAnimationFrame(m._vMarker._animationId);
          if (typeof m.remove === "function") m.remove(); // Leaflet
          else if (typeof m.destroy === "function") m.destroy(); // Mappls
        } catch {
          /* ignore */
        }
        mapInstanceRef.current = null;
      }
    };
  }, [checkpoints, activeVehicle]);

  // ── No-coords state ─────────────────────────────────────────────────────────
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
        <i className="bi bi-map text-muted" style={{ fontSize: "3rem", opacity: 0.4 }} />
        <div style={{ textAlign: "center" }}>
          <div className="fw-bold text-muted" style={{ fontSize: "1rem" }}>
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

  // ── Map container ───────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative" }}>
      {/* Shimmer skeleton while loading */}
      {!mapReady && (
        <div
          style={{
            height: "400px",
            borderRadius: "16px",
            background:
              "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="text-muted small d-flex align-items-center gap-2">
            <span className="spinner-border spinner-border-sm text-danger" role="status" />
            Loading map…
          </div>
        </div>
      )}

      {/* Map div */}
      <div
        ref={mapRef}
        id="swcart-map-container"
        style={{
          height: "400px",
          width: "100%",
          borderRadius: "16px",
          opacity: mapReady && hasCoords ? 1 : 0,
          position: mapReady && hasCoords ? "relative" : "absolute",
          top: 0,
          left: 0,
          pointerEvents: mapReady && hasCoords ? "auto" : "none",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      />

      {/* Legend overlay */}
      {mapReady && hasCoords && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            background: "rgba(255,255,255,0.94)",
            backdropFilter: "blur(8px)",
            borderRadius: "12px",
            padding: "10px 14px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
            zIndex: 500,
            fontSize: "0.78rem",
            fontFamily: "'Plus Jakarta Sans', system-ui",
          }}
        >
          {checkpoints
            .filter(
              (c) =>
                c.position && c.position[0] !== 0 && c.position[1] !== 0
            )
            .map((cp, i, arr) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: i < arr.length - 1 ? "5px" : 0,
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
                    boxShadow: `0 0 0 2px ${cp.color}33`,
                  }}
                />
                <span style={{ color: "#333", fontWeight: 700 }}>{cp.label}</span>
                <span style={{ color: "#888" }}>{cp.name}</span>
              </div>
            ))}

          {/* Map source badge */}
          <div
            style={{
              marginTop: "8px",
              paddingTop: "6px",
              borderTop: "1px solid #eee",
              fontSize: "0.68rem",
              color: "#aaa",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <i className="bi bi-geo-fill" style={{ color: "#e63946" }} />
            {mapProvider === "mappls"
              ? "Powered by Mappls — India's official map"
              : "Powered by OpenStreetMap + ISRO Bhuvan"}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
};

export default TrackingMap;
