import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Navigation } from "lucide-react";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 16);
  }, [center, map]);
  return null;
}

export default function MapPicker({ latitude, longitude, onLocationChange, readOnly = false }) {
  const [position, setPosition] = useState(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const center = position || { lat: -14.235, lng: -51.9253 };

  const handleMapClick = (latlng) => {
    if (readOnly) return;
    setPosition(latlng);
    onLocationChange?.(latlng.lat, latlng.lng);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
    const data = await res.json();
    if (data.length > 0) {
      const loc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      setPosition(loc);
      if (!readOnly) onLocationChange?.(loc.lat, loc.lng);
    }
    setSearching(false);
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setPosition(loc);
      if (!readOnly) onLocationChange?.(loc.lat, loc.lng);
    });
  };

  return (
    <div className="space-y-2">
      {!readOnly && (
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar endereço..."
            className="rounded-xl text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button type="button" size="icon" variant="outline" className="rounded-xl shrink-0" onClick={handleSearch} disabled={searching}>
            <Search className="w-4 h-4" />
          </Button>
          <Button type="button" size="icon" variant="outline" className="rounded-xl shrink-0" onClick={handleMyLocation}>
            <Navigation className="w-4 h-4" />
          </Button>
        </div>
      )}
      <div className="rounded-xl overflow-hidden border border-border h-52">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={position ? 18 : 4}
          maxZoom={18}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ zIndex: 1 }}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri"
          />
          {!readOnly && <ClickHandler onMapClick={handleMapClick} />}
          {position && <FlyTo center={[position.lat, position.lng]} />}
          {position && <Marker position={[position.lat, position.lng]} />}
        </MapContainer>
      </div>
      {position && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}