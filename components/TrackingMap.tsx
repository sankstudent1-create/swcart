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
      return new Promise<void>((resolve, reject) => {
        if ((window as any).mappls) {
          resolve();
          return;
        }

        // Check if script is already added
        const existingScript = document.querySelector(
          'script[src*="apis.mappls.com/advancedmaps/api"]'
        );
        if (existingScript) {
          existingScript.addEventListener("load", () => resolve());
          existingScript.addEventListener("error", (e) => reject(e));
          return;
        }

        const script = document.createElement("script");
        script.src = `https://apis.mappls.com/advancedmaps/api/${mapplsKey}/map_sdk?v=3.0&layer=vector`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
      });
    };

    const initMap = async () => {
      try {
        if (!mapRef.current) return;

        // Try to load MapmyIndia Mappls SDK
        await loadMapplsScript();

        const mappls = (window as any).mappls;
        if (mappls && mappls.Map) {
          // Initialize via official MapmyIndia Mappls SDK
          const centerPos = validCheckpoints[validCheckpoints.length - 1].position!;
          
          const map = new mappls.Map(mapRef.current, {
            center: [centerPos[0], centerPos[1]],
            zoom: 6,
            zoomControl: true,
          });
          mapInstanceRef.current = map;

          // Add Markers
          validCheckpoints.forEach((cp) => {
            const pos = cp.position!;
            
            // Custom HTML/CSS styled marker using Mappls custom icon
            const marker = new mappls.Marker({
              map: map,
              position: { lat: pos[0], lng: pos[1] },
              popupHtml: `
                <div style="font-family:system-ui;text-align:center;min-width:130px;padding:5px;">
                  <div style="font-weight:700;font-size:0.9rem;margin-bottom:4px;color:${cp.color}">${cp.label}</div>
                  <div style="color:#333;font-size:0.8rem;font-weight:600">${cp.name}</div>
                </div>
              `,
              icon_url: cp.label === "Seller" 
                ? "https://tools.swinfosystems.online/marker-seller.png" 
                : cp.label === "Hub"
                ? "https://tools.swinfosystems.online/marker-hub.png"
                : "https://tools.swinfosystems.online/marker-delivery.png",
              width: 32,
              height: 32,
            });
          });

          // Add Polyline if multiple checkpoints
          if (validCheckpoints.length > 1) {
            const pathCoords = validCheckpoints.map((cp) => ({
              lat: cp.position![0],
              lng: cp.position![1],
            }));

            new mappls.Polyline({
              map: map,
              coordinates: pathCoords,
              strokeColor: "#e63946",
              strokeOpacity: 0.8,
              strokeWeight: 4,
            });
          }

          setMapReady(true);
        } else {
          throw new Error("Mappls object not loaded");
        }
      } catch (err) {
        console.warn("Mappls load failed, falling back to OpenStreetMap", err);
        // Fallback: Initialize Leaflet Map using standard OSM
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

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18,
          }).addTo(map);

          const positions = validCheckpoints.map((c) => c.position as [number, number]);
          const bounds = L.latLngBounds(positions);
          map.fitBounds(bounds, { padding: [40, 40] });

          validCheckpoints.forEach((cp, idx) => {
            const pos = cp.position as [number, number];
            const circleMarker = L.circleMarker(pos, {
              radius: 12,
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

            if (idx === validCheckpoints.length - 1) circleMarker.openPopup();
          });

          if (positions.length > 1) {
            L.polyline(positions, { color: "#e63946", weight: 3, opacity: 0.8 }).addTo(map);
          }

          setMapReady(true);
        } catch (leafletErr) {
          console.error("Leaflet fallback failed", leafletErr);
        }
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
