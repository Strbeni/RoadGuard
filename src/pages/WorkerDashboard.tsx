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
import { saveCompletedJob, getWorkerCompletedJobs } from "@/services/completedJobs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import NotificationBell from "@/components/NotificationBell";
import { Chat } from "@/components/Chat";

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
  Map as MapIcon,
  History
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

interface CompletedJob {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicleType: string;
  serviceType: string;
  location: string;
  coordinates: [number, number];
  estimatedPay: string;
  acceptedAt: Date;
  completedAt: Date;
  workerId: string;
  requestId: string;
  status: 'completed';
}

const WorkerDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('available');
  const [availableRequests, setAvailableRequests] = useState<ServiceRequest[]>([]);
  const [acceptedJob, setAcceptedJob] = useState<AcceptedJob | null>(null);
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [workerStatus, setWorkerStatus] = useState<'available' | 'busy' | 'offline'>('available');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([27.7172, 85.3240]); // Default to Kathmandu
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef<L.Map>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapCoords, setMapCoords] = useState<[number, number] | null>(null);
  const [mapAddress, setMapAddress] = useState<string>("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [messages, setMessages] = useState<RequestMessage[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'nearest' | 'urgency'>('recent');

  // Load user's location and completed jobs on mount
  useEffect(() => {
    // Load completed jobs
    const loadCompletedJobs = async () => {
      if (currentUser?.uid) {
        try {
          const jobs = await getWorkerCompletedJobs(currentUser.uid, 10);
          setCompletedJobs(jobs);
        } catch (error) {
          console.error('Error loading completed jobs:', error);
          // Fallback to existing completed jobs if any
        }
      }
    };

    loadCompletedJobs();

    // Load user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Could not get your location. Using default map view.');
          setIsLoading(false);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser. Using default map view.');
      setIsLoading(false);
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

  const updateJobStatus = async (status: AcceptedJob['status']) => {
    if (!acceptedJob || !currentUser?.uid) return;

    // Update local state first for responsiveness
    setAcceptedJob({ ...acceptedJob, status });
    
    // Try to find the request in available requests or use accepted job data
    const req = availableRequests.find(r => r.id === acceptedJob.id);
    
    // Notify user about status change if we have the request user ID
    const requestUserId = req?.requestUserId;
    if (requestUserId) {
      sendNotification(requestUserId, {
        title: 'Job Update',
        body: `Mechanic status changed to ${getStatusText(status)}.`,
        type: 'request_update',
        data: { requestId: acceptedJob.id, status },
      }).catch(console.error);
    }

    if (status === 'completed') {
      try {
        const completed: CompletedJob = {
          id: acceptedJob.id,
          customerName: acceptedJob.customerName,
          customerPhone: acceptedJob.customerPhone || 'Not provided',
          vehicleType: acceptedJob.vehicleType || 'Unknown',
          serviceType: acceptedJob.serviceType || 'Service',
          location: acceptedJob.location || 'Location not specified',
          coordinates: acceptedJob.coordinates || [0, 0],
          estimatedPay: acceptedJob.estimatedPay || '$0.00',
          acceptedAt: acceptedJob.acceptedAt || new Date(),
          completedAt: new Date(),
          workerId: currentUser.uid,
          requestId: acceptedJob.id,
          status: 'completed'
        };

        // Save to Firestore
        await saveCompletedJob(completed);
        
        // Update local state
        setCompletedJobs(prev => [completed, ...prev]);
        
        // Show success message
        toast({
          title: 'Job Completed',
          description: 'The job has been marked as completed.',
        });
        
        // Reset UI after a short delay
        setTimeout(() => {
          setAcceptedJob(null);
          setWorkerStatus('available');
          setActiveTab('available');
        }, 1000);
        
      } catch (error) {
        console.error('Error completing job:', error);
        // Revert local state on error
        setAcceptedJob({ ...acceptedJob, status: 'started' });
        
        // Show error to user
        toast({
          title: 'Error',
          description: 'Failed to complete the job. Please try again.',
          variant: 'destructive',
        });
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

  // Open Google Maps directions from mechanic (userLocation) to customer's request/job location
  const openDirections = () => {
    if (!acceptedJob) return;
    const dest = `${acceptedJob.coordinates[0]},${acceptedJob.coordinates[1]}`;
    const origin = userLocation ? `${userLocation[0]},${userLocation[1]}` : "";
    const url = origin
      ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const copyCustomerPhone = async () => {
    if (!acceptedJob?.customerPhone) return;
    const text = acceptedJob.customerPhone;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast({ title: 'Copied', description: `Phone ${text} copied to clipboard.` });
    } catch (e) {
      console.error('Copy failed', e);
      toast({ title: 'Copy failed', description: 'Unable to copy phone number.', variant: 'destructive' });
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
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{acceptedJob.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{getStatusText(acceptedJob.status)}</p>
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
                <Button size="sm" variant="outline" className="flex-1" onClick={copyCustomerPhone}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call Customer
                </Button>
                <Button size="sm" variant="outline" onClick={openDirections}>
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
              
              {/* Chat Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Chat with {acceptedJob.customerName}</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsChatExpanded(!isChatExpanded)}
                  >
                    {isChatExpanded ? 'Hide Chat' : 'Show Chat'}
                  </Button>
                </div>
                
                {isChatExpanded && (
                  <div className="border rounded-lg h-64 bg-background">
                    <Chat 
                      requestId={acceptedJob.id}
                      currentUserId={currentUser?.uid || ''}
                      otherUserName={acceptedJob.customerName}
                      className="h-full"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Requests / Work History toggle */}
        {workerStatus === 'available' && !acceptedJob && (
          <div className="space-y-3 w-[800px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant={activeTab === 'available' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('available')}>Available</Button>
                <Button variant={activeTab === 'history' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('history')}>History</Button>
              </div>
              {activeTab === 'available' && (
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
              )}
            </div>
            {activeTab === 'available' && (availableRequests.length === 0 ? (
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
            ))}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Completed Jobs</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      if (currentUser?.uid) {
                        try {
                          const jobs = await getWorkerCompletedJobs(currentUser.uid, 10);
                          setCompletedJobs(jobs);
                          toast({
                            title: 'Refreshed',
                            description: 'Completed jobs list has been updated.',
                          });
                        } catch (error) {
                          console.error('Error refreshing jobs:', error);
                          toast({
                            title: 'Error',
                            description: 'Failed to refresh completed jobs.',
                            variant: 'destructive',
                          });
                        }
                      }
                    }}
                  >
                    Refresh
                  </Button>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : completedJobs.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <History className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <h4 className="font-medium text-lg">No completed jobs yet</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Jobs you complete will appear here.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setActiveTab('available')}
                      >
                        Find Available Jobs
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {completedJobs.map((job) => (
                      <Card key={job.id} className="hover:bg-accent/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Completed
                                </span>
                                <span>{job.serviceType}</span>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {job.customerName} • {job.vehicleType}
                              </div>
                              <div className="text-sm mt-1">
                                <MapPin className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                {job.location}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">
                                {format(job.completedAt, 'MMM d, yyyy')}
                              </div>
                              <div className="text-sm font-medium mt-1">
                                {job.estimatedPay}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(job.completedAt, 'h:mm a')}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
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