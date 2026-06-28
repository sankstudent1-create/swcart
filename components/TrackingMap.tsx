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

const TrackingMap: React.FC<TrackingMapProps> = ({ checkpoints }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [hasCoords, setHasCoords] = useState(false);
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

    const mapplsKey = process.env.NEXT_PUBLIC_MAPPLS_KEY || "e5287c2e8e625032961522666d3693e7";

    const loadMapplsScript = () => {
      const candidateUrls = [
        `https://apis.mapmyindia.com/advancedmaps/api/${mapplsKey}/map_sdk.min.js`,
        `https://apis.mappls.com/advancedmaps/api/${mapplsKey}/map_sdk.min.js`,
        `https://apis.mappls.com/advancedmaps/api/${mapplsKey}/map_sdk?v=3.0&layer=vector`,
        `https://apis.mapmyindia.com/advancedmaps/api/${mapplsKey}/map_sdk?v=3.0&layer=vector`
      ];

      return new Promise<boolean>((resolve) => {
        if ((window as any).mappls || (window as any).MapmyIndia) {
          resolve(true);
          return;
        }

        let attempt = 0;

        const tryNext = () => {
          if (attempt >= candidateUrls.length) {
            // Quietly resolve with false so we fall back to OSM without console crashes
            resolve(false);
            return;
          }

          const url = candidateUrls[attempt];
          attempt++;

          // Remove any previous failed script with the same src prefix
          const oldScript = document.querySelector(`script[src^="${url.split('?')[0]}"]`);
          if (oldScript) {
            oldScript.remove();
          }

          const script = document.createElement("script");
          script.src = url;
          script.async = true;
          script.defer = true;
          script.onload = () => {
            if ((window as any).mappls || (window as any).MapmyIndia) {
              resolve(true);
            } else {
              tryNext();
            }
          };
          script.onerror = () => {
            tryNext();
          };
          document.head.appendChild(script);
        };

        tryNext();
      });
    };

    const initMap = async () => {
      if (!mapRef.current) return;

      // ─── Initialize Leaflet map (primary renderer) ─────────────────────────
      // Mappls Web SDK requires console activation (currently returns 401),
      // so we use Leaflet + ISRO Bhuvan WMS overlay as the authoritative
      // Indian map source instead.
      try {
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: false });
        mapInstanceRef.current = map;

        // ─── Base layer: OpenStreetMap ───────────────────────────────────────
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(map);

        // ─── Overlay: ISRO Bhuvan WMS — official Indian political boundaries ─
        // Bhuvan is India's national geospatial portal maintained by
        // ISRO / NRSC / Survey of India. Shows correct borders for
        // J&K, Ladakh, Arunachal Pradesh, Aksai Chin as per GoI.
        // No API key required — publicly accessible WMS endpoint.
        try {
          L.tileLayer.wms("https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms", {
            layers: "india3",      // Official India political boundary layer
            format: "image/png",
            transparent: true,
            opacity: 0.6,
            version: "1.1.1",
            attribution:
              '&copy; <a href="https://bhuvan.nrsc.gov.in" target="_blank">ISRO Bhuvan</a> | Survey of India',
          } as any).addTo(map);
        } catch {
          // Non-fatal — OSM base still renders if Bhuvan is unreachable
        }

        // ─── Fit map bounds ──────────────────────────────────────────────────
        const positions = validCheckpoints.map((c) => c.position as [number, number]);
        map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });

        // ─── Checkpoint markers ──────────────────────────────────────────────
        validCheckpoints.forEach((cp, idx) => {
          const pos = cp.position as [number, number];
          const circleMarker = L.circleMarker(pos, {
            radius: 14,
            fillColor: cp.color,
            color: "#fff",
            weight: 3,
            opacity: 1,
            fillOpacity: 0.92,
          }).addTo(map);

          circleMarker.bindPopup(
            `<div style="font-family:'Plus Jakarta Sans',system-ui;text-align:center;min-width:140px;padding:4px 0">
              <div style="font-weight:800;font-size:0.88rem;color:${cp.color};margin-bottom:3px">${cp.label}</div>
              <div style="color:#333;font-size:0.8rem;font-weight:600">${cp.name}</div>
            </div>`,
            { offset: [0, -12] }
          );
          if (idx === validCheckpoints.length - 1) circleMarker.openPopup();
        });

        // ─── Route polyline ──────────────────────────────────────────────────
        if (positions.length > 1) {
          L.polyline(positions, { color: "#e63946", weight: 4, opacity: 0.85 }).addTo(map);
          L.polyline(positions, {
            color: "#fff", weight: 2, opacity: 0.5, dashArray: "8, 12",
          }).addTo(map);
        }

        setMapReady(true);
      } catch (err) {
        console.error("Map init failed", err);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        if (typeof mapInstanceRef.current.remove === "function") {
          try {
            mapInstanceRef.current.remove();
          } catch (e) {
            // ignore
          }
        }
        mapInstanceRef.current = null;
      }
    };
  }, [checkpoints]);

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

  return (
    <div style={{ position: "relative" }}>
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
            <span className="spinner-border spinner-border-sm text-danger" role="status" />
            Loading map…
          </div>
        </div>
      )}

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
            .filter((c) => c.position && c.position[0] !== 0 && c.position[1] !== 0)
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
