import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { subscribeAllPendingRequests, acceptRequest, Request as FirestoreRequest } from "@/services/requests";
import { sendNotification } from "@/services/notifications";
import { subscribeMessages, RequestMessage } from "@/services/messages";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import NotificationBell from "@/components/NotificationBell";

// Fix for default marker icons in Leaflet with Webpack
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
import { 
  Wrench, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle,
  Navigation,
  Phone,
  Star,
  HardHat,
  Map as MapIcon
} from "lucide-react";

interface ServiceRequest {
  id: string;
  requestUserId?: string;
  customerName: string;
  vehicleType: string;
  serviceType: string;
  location: string;
  coordinates: [number, number];
  distance: string;
  urgency: 'emergency' | 'high' | 'normal' | 'low';
  estimatedPay: string;
  description: string;
  createdAt: Date;
}

interface AcceptedJob {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicleType: string;
  serviceType: string;
  location: string;
  coordinates: [number, number];
  status: 'accepted' | 'en_route' | 'arrived' | 'started' | 'completed';
  estimatedPay: string;
  acceptedAt: Date;
}

const WorkerDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('available');
  const [availableRequests, setAvailableRequests] = useState<ServiceRequest[]>([]);
  const [acceptedJob, setAcceptedJob] = useState<AcceptedJob | null>(null);
  const [workerStatus, setWorkerStatus] = useState<'available' | 'busy' | 'offline'>('available');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([27.7172, 85.3240]); // Default to Kathmandu
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef<L.Map>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapCoords, setMapCoords] = useState<[number, number] | null>(null);
  const [mapAddress, setMapAddress] = useState<string>("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [messages, setMessages] = useState<RequestMessage[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'nearest' | 'urgency'>('recent');

  // Request user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setLocationError(null);
          
          // Update available requests with distances from user's location
          updateRequestDistances(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to retrieve your location. Please enable location services for a better experience.');
          // Use default location if geolocation fails
          updateRequestDistances(mapCenter[0], mapCenter[1]);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      updateRequestDistances(mapCenter[0], mapCenter[1]);
    }
  }, []);

  // Subscribe to available (pending) requests in real-time
  useEffect(() => {
    const unsubscribe = subscribeAllPendingRequests((all: FirestoreRequest[]) => {
      const mapped: ServiceRequest[] = all.map((r) => {
        const created = (r as any).createdAt?.toDate ? (r as any).createdAt.toDate() : ((r as any).createdAt || new Date());
        const lat = r.location?.lat ?? 0;
        const lng = r.location?.lng ?? 0;
        return {
          id: r.id || `${lat}-${lng}-${Date.now()}`,
          requestUserId: r.userId,
          customerName: r.userId ? `User ${r.userId.slice(0, 6)}` : 'Customer',
          vehicleType: r.vehicleType || 'Vehicle',
          serviceType: r.serviceType,
          location: r.location?.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          coordinates: [lat, lng],
          distance: '—',
          urgency: (r.urgency as ServiceRequest['urgency']) || 'normal',
          estimatedPay: '$60 - $120',
          description: r.description || '',
          createdAt: created as Date,
        };
      });
      // Apply sorting
      const sorted = sortRequests(mapped, sortBy, userLocation);
      setAvailableRequests(sorted);
      if (userLocation) updateRequestDistances(userLocation[0], userLocation[1]);
    });
    return unsubscribe;
  }, [userLocation, sortBy]);

  // Subscribe to messages for selected request
  useEffect(() => {
    if (!detailsOpen || !selectedRequest?.id) return;
    const unsub = subscribeMessages(selectedRequest.id, setMessages, console.error);
    return () => unsub();
  }, [detailsOpen, selectedRequest?.id]);

  // Update distances for available requests based on user's location
  const updateRequestDistances = (lat: number, lng: number) => {
    setAvailableRequests(prevRequests => 
      prevRequests.map(request => {
        // Simple distance calculation (as the crow flies) for demo purposes
        const distance = calculateDistance(
          lat, lng,
          request.coordinates[0], request.coordinates[1]
        );
        return {
          ...request,
          distance: `${distance.toFixed(1)} miles`
        };
      })
    );
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // distances are recalculated elsewhere once data and location load

  const handleAcceptRequest = async (requestId: string) => {
    const request = availableRequests.find(r => r.id === requestId);
    if (!request) return;
    try {
      if (currentUser?.uid) {
        await acceptRequest(requestId, currentUser.uid);
        // notify user
        if (request.requestUserId) {
          await sendNotification(request.requestUserId, {
            title: 'Request Accepted',
            body: `Your ${request.serviceType} request was accepted by a mechanic.`,
            type: 'request_update',
            data: { requestId },
          });
        }
      }
      const newJob: AcceptedJob = {
        id: request.id,
        customerName: request.customerName,
        customerPhone: '+1 (555) 123-4567',
        vehicleType: request.vehicleType,
        serviceType: request.serviceType,
        location: request.location,
        coordinates: request.coordinates,
        status: 'accepted',
        estimatedPay: request.estimatedPay,
        acceptedAt: new Date()
      };
      setAcceptedJob(newJob);
      setWorkerStatus('busy');
      setActiveTab('accepted');
    } catch (e) {
      console.error('Failed to accept request:', e);
    }
  };

  const openLocationModal = (request: ServiceRequest) => {
    setMapCoords(request.coordinates);
    setMapAddress(request.location);
    setMapOpen(true);
  };

  const handleDeclineRequest = (requestId: string) => {
    setAvailableRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const updateJobStatus = (status: AcceptedJob['status']) => {
    if (acceptedJob) {
      setAcceptedJob({ ...acceptedJob, status });
      // notify user about status change
      const req = availableRequests.find(r => r.id === acceptedJob.id);
      if (req?.requestUserId) {
        sendNotification(req.requestUserId, {
          title: 'Job Update',
          body: `Mechanic status changed to ${getStatusText(status)}.`,
          type: 'request_update',
          data: { requestId: acceptedJob.id, status },
        }).catch(console.error);
      }
      if (status === 'completed') {
        // In a real app, this would update the job status in your backend
        setTimeout(() => {
          setAcceptedJob(null);
          setWorkerStatus('available');
          setActiveTab('available');
        }, 2000);
      }
    }
  };

  const sortRequests = (
    list: ServiceRequest[],
    sort: 'recent' | 'nearest' | 'urgency',
    loc: [number, number] | null
  ) => {
    const copy = [...list];
    if (sort === 'recent') {
      copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sort === 'nearest' && loc) {
      copy.sort((a, b) => (
        calculateDistance(loc[0], loc[1], a.coordinates[0], a.coordinates[1]) -
        calculateDistance(loc[0], loc[1], b.coordinates[0], b.coordinates[1])
      ));
    } else if (sort === 'urgency') {
      const rank: Record<ServiceRequest['urgency'], number> = { emergency: 0, high: 1, normal: 2, low: 3 };
      copy.sort((a, b) => rank[a.urgency] - rank[b.urgency]);
    }
    return copy;
  };

  const openDetails = (req: ServiceRequest) => {
    setSelectedRequest(req);
    setDetailsOpen(true);
  };

  const getUrgencyColor = (urgency: 'emergency' | 'high' | 'normal' | 'low') => {
    switch (urgency) {
      case 'emergency': 
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'normal': 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'low': 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Job Accepted';
      case 'en_route': return 'On The Way';
      case 'arrived': return 'Arrived at Location';
      case 'started': return 'Service in Progress';
      case 'completed': return 'Job Completed';
      default: return status;
    }
  };

  // Map center based on user's location or accepted job
  useEffect(() => {
    if (acceptedJob) {
      setMapCenter(acceptedJob.coordinates);
    } else if (userLocation) {
      setMapCenter(userLocation);
    }
  }, [acceptedJob, userLocation]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <HardHat className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-semibold text-gray-900">RoadGuard Mechanic</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center"
              onClick={() => setWorkerStatus(workerStatus === 'available' ? 'offline' : 'available')}
              disabled={workerStatus === 'busy'}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${
                workerStatus === 'available' ? 'bg-green-500' : 
                workerStatus === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'
              }`} />
              {workerStatus === 'available' ? 'Online' : workerStatus === 'busy' ? 'Busy' : 'Offline'}
            </Button>
            <div className="flex items-center space-x-2">
              <NotificationBell />
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser?.photoURL || ''} alt={currentUser?.displayName || 'User'} />
                <AvatarFallback>
                  {currentUser?.displayName?.charAt(0) || 'M'}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm text-gray-700">
                <div className="font-medium">{currentUser?.displayName || 'Mechanic'}</div>
                <div className="text-xs text-gray-500">{currentUser?.role || 'Mechanic'}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 flex items-center flex-col space-y-4">
        {/* Active Job */}
        {acceptedJob && (
          <Card className="border-accent w-[800px] shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Current Job</CardTitle>
                <Badge variant="secondary">{getStatusText(acceptedJob.status)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{acceptedJob.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Service</p>
                  <p className="font-medium">{acceptedJob.serviceType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{acceptedJob.vehicleType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pay</p>
                  <p className="font-medium text-accent">{acceptedJob.estimatedPay}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <MapPin className="h-4 w-4" />
                <span>{acceptedJob.location}</span>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Customer
                </Button>
                <Button size="sm" variant="outline">
                  <Navigation className="h-4 w-4 mr-2" />
                  Navigate
                </Button>
              </div>

              {/* Status Update Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {acceptedJob.status === 'accepted' && (
                  <Button onClick={() => updateJobStatus('en_route')} className="col-span-2">
                    Start Journey
                  </Button>
                )}
                {acceptedJob.status === 'en_route' && (
                  <Button onClick={() => updateJobStatus('arrived')} className="col-span-2">
                    I've Arrived
                  </Button>
                )}
                {acceptedJob.status === 'arrived' && (
                  <Button onClick={() => updateJobStatus('started')} className="col-span-2">
                    Start Service
                  </Button>
                )}
                {acceptedJob.status === 'started' && (
                  <Button onClick={() => updateJobStatus('completed')} className="col-span-2 bg-success hover:bg-success/90">
                    Complete Job
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Requests */}
        {workerStatus === 'available' && !acceptedJob && (
          <div className="space-y-3 w-[800px]">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Available Requests Near You</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Sort by</span>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="recent">Most Recent</option>
                  <option value="nearest">Nearest</option>
                  <option value="urgency">Urgency</option>
                </select>
              </div>
            </div>
            {availableRequests.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="font-medium mb-2">No available requests</h3>
                  <p className="text-sm text-muted-foreground">
                    Check back later for new service requests in your area.
                  </p>
                </CardContent>
              </Card>
            ) : (
              availableRequests.map((request) => (
                <Card key={request.id} className="shadow-sm cursor-pointer" onClick={() => openDetails(request)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{request.serviceType}</h3>
                        <p className="text-sm text-muted-foreground">
                          {request.vehicleType} • {request.customerName}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getUrgencyColor(request.urgency)}>
                          {request.urgency.toUpperCase()}
                        </Badge>
                        <p className="text-sm font-medium text-accent mt-1">{request.estimatedPay}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4" />
                      <span>{request.location} • {request.distance} away</span>
                    </div>

                    {request.description && (
                      <p className="text-sm bg-muted/50 p-2 rounded mb-3">{request.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.floor((Date.now() - request.createdAt.getTime()) / 60000)} min ago
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); openLocationModal(request); }}
                      >
                        View Location
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); handleDeclineRequest(request.id); }}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                      <Button 
                        onClick={(e) => { e.stopPropagation(); handleAcceptRequest(request.id); }}
                        className="flex-1 bg-success hover:bg-success/90"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Job
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Map Component */}
        <Card className="overflow-hidden w-full max-w-4xl">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base flex items-center gap-2">
                <MapIcon className="h-5 w-5" />
                {acceptedJob ? 'Active Job Location' : 'Available Jobs Near You'}
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (userLocation) {
                    setMapCenter(userLocation);
                    mapRef.current?.flyTo(userLocation, 13);
                  }
                }}
                disabled={!userLocation}
              >
                <Navigation className="h-4 w-4 mr-2" />
                My Location
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-80 relative">
            <MapContainer 
              center={mapCenter} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* User Location Marker */}
              {userLocation && (
                <Marker position={userLocation} icon={userIcon}>
                  <Popup>Your Location</Popup>
                </Marker>
              )}
              
              {/* Request or Job Marker */}
              {acceptedJob ? (
                <Marker position={acceptedJob.coordinates} icon={defaultIcon}>
                  <Popup>
                    <div className="font-medium">{acceptedJob.serviceType}</div>
                    <div className="text-sm">{acceptedJob.customerName}</div>
                    <div className="text-xs text-gray-500">{acceptedJob.location}</div>
                  </Popup>
                </Marker>
              ) : (
                availableRequests.map((request) => (
                  <Marker key={request.id} position={request.coordinates} icon={defaultIcon}>
                    <Popup>
                      <div className="font-medium">{request.serviceType}</div>
                      <div className="text-sm">{request.customerName}</div>
                      <div className="text-xs text-gray-500">{request.distance} away</div>
                      <Button 
                        size="xs" 
                        className="mt-2 w-full"
                        onClick={() => handleAcceptRequest(request.id)}
                      >
                        Accept Job
                      </Button>
                    </Popup>
                  </Marker>
                ))
              )}
            </MapContainer>
            
            {locationError && (
              <div className="absolute bottom-2 left-2 right-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-2 rounded">
                {locationError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Offline Status */}
        {workerStatus === 'offline' && (
          <Card className="border-muted">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <Wrench className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">You're offline</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Go online to start receiving service requests.
              </p>
              <Button onClick={() => setWorkerStatus('available')}>
                Go Online
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      {/* Location Modal */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="px-6 pt-4">
            <DialogTitle>Request Location</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-4 text-sm text-muted-foreground">{mapAddress}</div>
          <div className="h-[420px] w-full">
            {mapCoords && (
              <MapContainer 
                center={mapCoords} 
                zoom={14} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={mapCoords} icon={defaultIcon}>
                  <Popup>{mapAddress || 'Request Location'}</Popup>
                </Marker>
              </MapContainer>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Request Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Service</div>
                <div className="font-medium">{selectedRequest.serviceType}</div>
                <div className="text-sm text-muted-foreground">Vehicle</div>
                <div>{selectedRequest.vehicleType}</div>
                <div className="text-sm text-muted-foreground">Location</div>
                <div>{selectedRequest.location}</div>
                {selectedRequest.description && (
                  <div>
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div className="text-sm bg-muted/50 p-2 rounded">{selectedRequest.description}</div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Messages</div>
                <div className="h-48 overflow-auto rounded border p-2 space-y-2 bg-background">
                  {messages.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No messages yet</div>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} className="text-sm">
                        <div className="font-medium">{m.fromUserId === currentUser?.uid ? 'You' : 'User'}</div>
                        <div className="">{m.body}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString() : ''}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WorkerDashboard;