"use client";

import React, { useEffect } from "react";
import { MapContainer, WMSTileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const bhuvanIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  shadowSize: [41, 41],
});

export default function BhuvanMap({ markers = [] }: { markers: any[] }) {
  // Center roughly on India
  const position: [number, number] = [20.5937, 78.9629]; 

  return (
    <div style={{ height: "400px", width: "100%", borderRadius: "16px", overflow: "hidden", border: "1px solid #e9ecef", zIndex: 1 }}>
      {/* @ts-ignore */}
      <MapContainer center={position} zoom={5} style={{ height: "100%", width: "100%", zIndex: 1 }}>
        {/* @ts-ignore */}
        <WMSTileLayer
          url="https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wms/"
          params={{
            layers: "india3",
            format: "image/jpeg",
            transparent: true,
            version: "1.1.1"
          }}
          attribution='&copy; <a href="https://bhuvan.nrsc.gov.in/bhuvan_links.php">ISRO Bhuvan</a>'
        />
        {markers.map((m, idx) => (
          m.lat && m.lng && (
            <Marker key={idx} position={[m.lat, m.lng]} icon={bhuvanIcon}>
              <Popup>
                <strong>{m.title}</strong><br />
                {m.description}
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
