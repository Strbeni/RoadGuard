import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';

// Fix for default markers in Leaflet with Vite
const defaultIcon = L.icon({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

interface MapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
  markers?: Array<{
    id: string;
    position: [number, number];
    type: 'user' | 'worker' | 'request';
    title?: string;
    popup?: string;
  }>;
}

const Map = ({ 
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 13,
  className = "",
  onLocationSelect,
  markers = []
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

      // Initialize map with options to prevent marker animation issues
    map.current = L.map(mapContainer.current, {
      center,
      zoom,
      zoomControl: false,
      preferCanvas: true // Better performance for many markers
    });

    // Add tile layer with error handling
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      detectRetina: true
    }).addTo(map.current);

    // Add zoom control
    L.control.zoom({
      position: 'topright'
    }).addTo(map.current);

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
          
          if (map.current) {
            map.current.setView([lat, lng], zoom);
            
            // Add user location marker
            const userIcon = L.divIcon({
              html: `
                <div style="
                  background: hsl(222 71% 32%); 
                  width: 20px; 
                  height: 20px; 
                  border-radius: 50%; 
                  border: 3px solid white; 
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                "></div>
              `,
              className: 'user-location-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });
            
            L.marker([lat, lng], { icon: userIcon })
              .addTo(map.current)
              .bindPopup('Your current location')
              .openPopup();
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }

    // Handle map click for location selection
    if (onLocationSelect && map.current) {
      map.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        onLocationSelect(lat, lng);
      });
    }

    // Cleanup
    return () => {
      if (map.current) {
        try {
          // Remove all event listeners first
          map.current.off();
          map.current.remove();
          map.current = null;
          // Clear any remaining Leaflet elements
          const leafletElements = document.querySelectorAll('.leaflet-marker-icon, .leaflet-popup, .leaflet-tooltip, .leaflet-layer, .leaflet-control-container');
          leafletElements.forEach(el => el.remove());
        } catch (error) {
          console.error('Error during map cleanup:', error);
        }
      }
    };
  }, []);

  // Create marker icon based on type
  const createMarkerIcon = useCallback((type: string) => {
    switch (type) {
      case 'user':
        return L.divIcon({
          html: `
            <div style="
              background: hsl(222 71% 32%); 
              width: 16px; 
              height: 16px; 
              border-radius: 50%; 
              border: 2px solid white; 
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            "></div>
          `,
          className: 'user-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
      case 'worker':
        return L.divIcon({
          html: `
            <div style="
              background: hsl(45 93% 50%); 
              width: 18px; 
              height: 18px; 
              border-radius: 50%; 
              border: 2px solid white; 
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            "></div>
          `,
          className: 'worker-marker',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
      case 'request':
        return L.divIcon({
          html: `
            <div style="
              background: hsl(0 84% 60%); 
              width: 20px; 
              height: 20px; 
              border-radius: 50%; 
              border: 3px solid white; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              animation: pulse 2s infinite;
            "></div>
            <style>
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
              }
            </style>
          `,
          className: 'request-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
      default:
        return defaultIcon;
    }
  }, []);

  // Update markers when markers prop changes
  useEffect(() => {
    if (!map.current) return;

    // Store the current map reference to avoid closure issues
    const currentMap = map.current;
    const markersGroup = L.layerGroup();
    
    // Add new markers
    markers.forEach((marker) => {
      try {
        const markerIcon = createMarkerIcon(marker.type);
        const leafletMarker = L.marker(marker.position, { icon: markerIcon });
        
        if (marker.popup) {
          leafletMarker.bindPopup(marker.popup);
        }
        
        if (marker.title) {
          leafletMarker.bindTooltip(marker.title);
        }
        
        markersGroup.addLayer(leafletMarker);
      } catch (error) {
        console.error('Error creating marker:', error);
      }
    });
    
    // Add all markers to the map at once
    markersGroup.addTo(currentMap);
    
    // Cleanup function to remove markers when component unmounts or markers change
    return () => {
      currentMap.removeLayer(markersGroup);
    };
  }, [markers, createMarkerIcon]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg shadow-md z-0"
        style={{ minHeight: '300px' }}
      />
      
      {/* Location Controls */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <button
          onClick={() => {
            if (userLocation && map.current) {
              map.current.setView(userLocation, 15);
            }
          }}
          className="bg-card text-card-foreground p-2 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          title="Center on my location"
        >
          <Navigation className="h-5 w-5" />
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-card/95 backdrop-blur-sm p-3 rounded-lg shadow-md">
        <div className="text-xs font-medium mb-2 text-card-foreground">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary border border-white"></div>
            <span className="text-card-foreground">Your location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent border border-white"></div>
            <span className="text-card-foreground">Mechanics nearby</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive border border-white"></div>
            <span className="text-card-foreground">Active requests</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;