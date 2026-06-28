"use client";

import React from "react";
import { MapContainer, WMSTileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default icon path issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const bhuvanIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconSize: [25, 41] as [number, number],
  iconAnchor: [12, 41] as [number, number],
  popupAnchor: [1, -34] as [number, number],
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  shadowSize: [41, 41] as [number, number],
});

// Cast component refs to `any` to bypass react-leaflet v4 strict TS prop typing
const AnyMapContainer = MapContainer as any;
const AnyWMSTileLayer = WMSTileLayer as any;
const AnyMarker = Marker as any;

export default function BhuvanMap({ markers = [] }: { markers: any[] }) {
  const position: [number, number] = [20.5937, 78.9629]; // Center of India

  return (
    <div style={{ height: "400px", width: "100%", borderRadius: "16px", overflow: "hidden", border: "1px solid #e9ecef" }}>
      <AnyMapContainer center={position} zoom={5} style={{ height: "100%", width: "100%", zIndex: 1 }}>
        <AnyWMSTileLayer
          url="https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wms/"
          params={{
            layers: "india3",
            format: "image/jpeg",
            transparent: true,
            version: "1.1.1",
          }}
          attribution='&copy; <a href="https://bhuvan.nrsc.gov.in/bhuvan_links.php">ISRO Bhuvan</a>'
        />
        {markers.map((m, idx) =>
          m.lat && m.lng ? (
            <AnyMarker key={idx} position={[m.lat, m.lng]} icon={bhuvanIcon}>
              <Popup>
                <strong>{m.title}</strong>
                <br />
                {m.description}
              </Popup>
            </AnyMarker>
          ) : null
        )}
      </AnyMapContainer>
    </div>
  );
}
