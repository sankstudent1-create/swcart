"use client";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon issue for Leaflet in Next.js
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Fix default icon issue in Leaflet when using with Webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
  iconUrl: require('leaflet/dist/images/marker-icon.png').default,
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
});

interface Checkpoint {
  name: string;
  position: [number, number]; // [lat, lng]
}

interface TrackingMapProps {
  // We accept any order data; for now we only need to display checkpoint names.
  checkpoints: Checkpoint[];
}

const TrackingMap: React.FC<TrackingMapProps> = ({ checkpoints }) => {
  // Determine map bounds to fit all checkpoints
  const positions = checkpoints.map(c => c.position);
  const bounds = L.latLngBounds(positions as any);

  return (
    <MapContainer
      style={{ height: '400px', width: '100%', borderRadius: '12px' }}
      bounds={bounds}
    >
{/* @ts-ignore */}
      <TileLayer
        // OpenStreetMap tiles – free and open source
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

      />
      {checkpoints.map((cp, idx) => (
        <Marker key={idx} position={cp.position}>
          <Popup>{cp.name}</Popup>
        </Marker>
      ))}
      {/* Draw polyline connecting checkpoints */}
      <Polyline positions={positions} pathOptions={{ color: "#e63946", weight: 3 }} />
    </MapContainer>
  );
};

export default TrackingMap;
