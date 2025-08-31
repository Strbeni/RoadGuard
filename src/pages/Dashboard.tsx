import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Chat } from "@/components/Chat";
import Map from "@/components/Map";
import ServiceRequestForm from "@/components/ServiceRequestForm";
import {
  MapPin,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  History,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createRequest, Request as RequestType, getRequests } from "@/services/requests";
import { subscribeMessages, RequestMessage } from "@/services/messages";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

type Request = RequestType;

const Dashboard = () => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [formSubmission, setFormSubmission] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [messages, setMessages] = useState<RequestMessage[]>([]);
  const [requestFilter, setRequestFilter] = useState<'active' | 'history' | 'all'>('active');

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; variant: string }> = {
      'pending': { text: 'Pending', variant: 'bg-yellow-100 text-yellow-800' },
      'accepted': { text: 'Accepted', variant: 'bg-blue-100 text-blue-800' },
      'en_route': { text: 'En Route', variant: 'bg-indigo-100 text-indigo-800' },
      'arrived': { text: 'Arrived', variant: 'bg-purple-100 text-purple-800' },
      'started': { text: 'In Progress', variant: 'bg-cyan-100 text-cyan-800' },
      'completed': { text: 'Completed', variant: 'bg-green-100 text-green-800' },
      'cancelled': { text: 'Cancelled', variant: 'bg-red-100 text-red-800' },
    };

    const statusInfo = statusMap[status] || { text: status, variant: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.variant}`}>
        {statusInfo.text}
      </span>
    );
  };

  // --- Fetch requests ---
  const fetchRequests = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsLoadingRequests(true);
      const userRequests = await getRequests(currentUser.uid);
      setRequests(userRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: "Failed to load your service requests.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRequests(false);
    }
  }, [currentUser]);

  // --- Get user location ---
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          const address = data.display_name || "Current location";
          setUserLocation({ lat: latitude, lng: longitude, address });
          localStorage.setItem("userLocation", JSON.stringify({ lat: latitude, lng: longitude, address }));

          if (formSubmission) {
            handleRequestSubmit(formSubmission);
            setFormSubmission(null);
          }
        } catch (err) {
          console.error("Error getting address:", err);
          setUserLocation({ lat: latitude, lng: longitude, address: "Current location" });
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationError("Unable to retrieve your location. Please enable location services and retry.");
        setIsLoading(false);
      }
    );
  }, [formSubmission]);

  useEffect(() => {
    getLocation();
    fetchRequests();
  }, [fetchRequests, getLocation]);

  // Subscribe to messages for selected request when details dialog is open
  useEffect(() => {
    if (!detailsOpen || !selectedRequest?.id) return;
    const unsub = subscribeMessages(selectedRequest.id, setMessages, console.error);
    return () => unsub();
  }, [detailsOpen, selectedRequest?.id]);

  // --- Toggle request details ---
  const toggleDetails = (request: Request) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  // --- Handle request status changes ---
  const handleRequestStatusChange = async (requestId: string, status: Request['status']) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a request.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update request status logic here
    } catch (err) {
      console.error("Error updating request status:", err);
      toast({
        title: "Error",
        description: "Failed to update request status.",
        variant: "destructive",
      });
    }
  };

  // --- Submit request ---
  const handleRequestSubmit = async (formData: any) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a request.",
        variant: "destructive",
      });
      return;
    }

    if (!userLocation) {
      toast({
        title: "Location Error",
        description: "Determining your location. Please wait...",
      });
      setFormSubmission(formData);
      return;
    }

    try {
      const newRequest = {
        userId: currentUser.uid,
        serviceType: formData.serviceType,
        vehicleType: formData.vehicleType,
        description: formData.description || "",
        urgency: formData.urgency || "normal",
        status: "pending" as const,
        location: userLocation,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await createRequest(newRequest);
      setRequests((prev) => [{ ...newRequest, id: "temp-" + Date.now() }, ...prev]);
      setIsRequestFormOpen(false);
      toast({ title: "Request Submitted", description: "Your service request has been submitted!" });
    } catch (err) {
      console.error("Error submitting request:", err);
      toast({
        title: "Error",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // --- Markers for map ---
  const mapMarkers = useMemo(() => {
    const markers: Array<{
      id: string;
      position: [number, number];
      type: "user" | "worker" | "request";
      title?: string;
      popup?: string;
    }> = [];

    // Workers (IDs fixed to be unique)
    [
      { id: "worker-1", pos: [30.7061236, 76.7246507], title: "Car Repair Market", rating: 4.6 },
      { id: "worker-2", pos: [30.710029, 76.806768], title: "GoMechanic - Car World Automotive", rating: 4.7 },
      { id: "worker-3", pos: [30.7268679, 76.7498934], title: "Balaji Autos", rating: 4.5 },
      { id: "worker-4", pos: [30.7249401, 76.7778609], title: "Javed Bike Point", rating: 4.4 },
      { id: "worker-5", pos: [30.685106, 76.760723], title: "Dhillon Service Station", rating: 4.6 },
    ].forEach((w) =>
      markers.push({
        id: w.id,
        position: w.pos as [number, number],
        type: "worker",
        title: w.title,
        popup: `${w.title}<br/>Available for service<br/>Rating: ${w.rating}/5`,
      })
    );

    requests.forEach((req, i) => {
      markers.push({
        id: `req-${req.id || i}`,
        position: [req.location.lat, req.location.lng],
        type: "request",
        title: `Request #${i + 1}`,
        popup: `${req.serviceType}<br/>${req.location.address || "No address"}<br/>Status: ${req.status}`,
      });
    });

    if (userLocation) {
      markers.push({
        id: "user",
        position: [userLocation.lat, userLocation.lng],
        type: "user",
        title: "Your Location",
        popup: userLocation.address,
      });
    }
    return markers;
  }, [requests, userLocation]);

  // --- Sign out ---
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      toast({ title: "Error", description: "Failed to sign out.", variant: "destructive" });
    }
  };

  // --- Safe time formatter ---
  const formatCreatedAt = (ts: any) => {
    if (!ts) return "Unknown";
    const date = ts.toDate ? ts.toDate() : ts;
    return `Submitted ${formatDistanceToNow(date, { addSuffix: true })}`;
  };

  return (
    <div className="min-h-screen w-[800px] m-auto bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40 space-y-6">
        {/* Request Form */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Request Assistance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Need help now?</p>
            <p className="text-xs text-muted-foreground">Request roadside assistance with just a few clicks</p>
            <Button className="mt-4 w-full" onClick={() => setIsRequestFormOpen(true)}>
              Request Help
            </Button>
          </CardContent>
        </Card>

        {/* Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-sm font-medium">Your Requests</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchRequests} disabled={isLoadingRequests}>
                <RefreshCw className={`h-3 w-3 ${isLoadingRequests ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Filter</span>
              <select
                className="border rounded px-2 py-1 text-xs"
                value={requestFilter}
                onChange={(e) => setRequestFilter(e.target.value as any)}
              >
                <option value="active">Active</option>
                <option value="history">History</option>
                <option value="all">All</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingRequests ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests
                  .filter((req) => {
                    if (requestFilter === 'all') return true;
                    const isHistory = req.status === 'completed' || req.status === 'cancelled' || req.status === 'rejected';
                    return requestFilter === 'history' ? isHistory : !isHistory;
                  })
                  .map((req) => (
                  <div 
                    key={req.id} 
                    className="border rounded-lg p-4 hover:bg-accent/10 cursor-pointer transition-colors"
                    onClick={() => toggleDetails(req)}
                  >
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{req.serviceType}</div>
                        <div className="text-sm text-muted-foreground">{req.vehicleType}</div>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">{formatCreatedAt(req.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Your Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-3rem)]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full"><p>Loading map...</p></div>
            ) : locationError ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                <p className="text-sm text-muted-foreground">{locationError}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={getLocation}>
                  Retry
                </Button>
              </div>
            ) : (
              <Map center={userLocation ? [userLocation.lat, userLocation.lng] : [30.7, 76.78]} zoom={13} markers={mapMarkers} />
            )}
          </CardContent>
        </Card>
      </header>

      {/* Floating Form */}
      <div className="fixed bottom-6 right-6 z-30">
        <Sheet open={isRequestFormOpen} onOpenChange={setIsRequestFormOpen}>
          <SheetTrigger asChild>
            <Button className="rounded-full w-16 h-16 p-0 shadow-lg" aria-label="Request Help">
              <Zap className="h-8 w-8" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] px-4 sm:px-6">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-2xl font-bold">Request Roadside Assistance</SheetTitle>
              <p className="text-sm text-muted-foreground">Fill out the form below to request immediate assistance</p>
            </SheetHeader>
            <div className="h-[calc(100%-4rem)] overflow-y-auto">
              <ServiceRequestForm
                selectedLocation={userLocation}
                onSuccess={(data) => handleRequestSubmit(data)}
                onCancel={() => setIsRequestFormOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Request Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{selectedRequest.serviceType}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.vehicleType} • {formatCreatedAt(selectedRequest.createdAt)}
                  </p>
                  <div className="pt-1">
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Location</h4>
                    <p className="text-sm">
                      {typeof selectedRequest.location === 'string' 
                        ? selectedRequest.location 
                        : selectedRequest.location?.address || 'Location not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedRequest.description || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Chat Section */}
              <div className="border-l pl-6">
                <div className="h-[400px] flex flex-col">
                  <h4 className="text-sm font-medium mb-4">Chat with Service Provider</h4>
                  <Chat 
                    requestId={selectedRequest.id}
                    currentUserId={currentUser?.uid || ''}
                    otherUserName={selectedRequest.assignedToName || 'Service Provider'}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
