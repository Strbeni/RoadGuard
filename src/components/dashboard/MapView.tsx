import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Layers } from "lucide-react";

interface MapViewProps {
  selectedWorkshop: string | null;
}

// Mock workshop locations
const workshopLocations = [
  { id: "1", name: "AutoFix Pro", lat: 40.7128, lng: -74.0060, status: "open" },
  { id: "2", name: "QuickService Motors", lat: 40.7589, lng: -73.9851, status: "open" },
  { id: "3", name: "Elite Auto Care", lat: 40.6892, lng: -74.0445, status: "closed" },
  { id: "4", name: "Rapid Repairs", lat: 40.7505, lng: -73.9934, status: "open" },
];

function MapView({ selectedWorkshop }: MapViewProps){
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapType, setMapType] = useState<"street" | "satellite">("street");

  useEffect(() => {
    // This would normally initialize a real map (Leaflet, Google Maps, etc.)
    // For now, we'll create a visual representation
    console.log("Map initialized with selected workshop:", selectedWorkshop);
  }, [selectedWorkshop]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Workshop Locations</span>
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant={mapType === "street" ? "default" : "outline"}
              size="sm"
              onClick={() => setMapType("street")}
            >
              <Layers className="h-4 w-4 mr-1" />
              Street
            </Button>
            <Button
              variant={mapType === "satellite" ? "default" : "outline"}
              size="sm"
              onClick={() => setMapType("satellite")}
            >
              <Navigation className="h-4 w-4 mr-1" />
              Satellite
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={mapRef}
          className="w-full h-[500px] bg-muted relative rounded-b-lg overflow-hidden"
          style={{
            backgroundImage: mapType === "satellite" 
              ? "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZGRkIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')"
              : "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0ic3RyZWV0IiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiNlZWUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNzdHJlZXQpIi8+PC9zdmc+Aw==')"
          }}
        >
          {/* Mock map pins */}
          {workshopLocations.map((location, index) => (
            <div
              key={location.id}
              className={`absolute w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-110 ${
                selectedWorkshop === location.id ? "scale-125 z-10" : ""
              }`}
              style={{
                left: `${20 + index * 20}%`,
                top: `${30 + index * 15}%`,
              }}
            >
              <div
                className={`w-full h-full rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
                  location.status === "open"
                    ? "bg-success"
                    : "bg-destructive"
                }`}
              >
                <MapPin className="h-3 w-3 text-white" />
              </div>
              {selectedWorkshop === location.id && (
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap z-20">
                  {location.name}
                </div>
              )}
            </div>
          ))}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
            <h4 className="text-sm font-medium mb-2">Workshop Status</h4>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span className="text-xs">Open</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-destructive rounded-full"></div>
                <span className="text-xs">Closed</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapView;