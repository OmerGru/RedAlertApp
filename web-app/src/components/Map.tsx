import React from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  activeAlert: {
    areas: string[];
  } | null;
}

// Mock coordinates for demonstration - in a real app, you'd geocode the areas
const areaCoordinates: Record<string, [number, number]> = {
  'Tel Aviv': [32.0853, 34.7818],
  'Jerusalem': [31.7683, 35.2137],
  'Haifa': [32.7940, 34.9896],
  'Ashdod': [31.8044, 34.6553],
  'Beersheba': [31.2530, 34.7915],
};

const RecenterMap: React.FC<{ coords: [number, number] }> = ({ coords }) => {
  const map = useMap();
  map.setView(coords, 10);
  return null;
};

const Map: React.FC<MapProps> = ({ activeAlert }) => {
  const center: [number, number] = [31.0461, 34.8516]; // Center of Israel

  return (
    <div className="map-container glass-card p-0">
      <MapContainer center={center} zoom={7} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {activeAlert?.areas.map((area, i) => {
          const coords = areaCoordinates[area];
          if (coords) {
            return (
              <React.Fragment key={i}>
                <Circle
                  center={coords}
                  pathOptions={{ color: '#ff3b30', fillColor: '#ff3b30', fillOpacity: 0.5 }}
                  radius={5000}
                />
                <RecenterMap coords={coords} />
              </React.Fragment>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
};

export default Map;
