import React from 'react';
import './MapIndicator.css';

interface MapIndicatorProps {
  mapName: string;
}

const MapIndicator: React.FC<MapIndicatorProps> = ({ mapName }) => {
  return (
    <span className="map-indicator">
      <span className="dot pastel-dot"></span>
      {mapName}
    </span>
  );
};

export default MapIndicator;