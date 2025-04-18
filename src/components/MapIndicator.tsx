import React from 'react';

interface MapIndicatorProps {
  name: string;
}

const MapIndicator: React.FC<MapIndicatorProps> = ({ name }) => {
  return (
    <span className="map-indicator">
      <span className="dot pastel-dot"></span>
      {name}
    </span>
  );
};

export default MapIndicator;