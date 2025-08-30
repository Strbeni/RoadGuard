import { Clock, User, MapPin, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Request {
  id: string;
  userDetails: {
    name: string;
    phone: string;
    location: string;
  };
  issueType: string;
  status: "pending" | "assigned" | "in-progress" | "completed";
  timeRequested: string;
  assignedMechanic?: string;
  urgency: "low" | "medium" | "high";
}

// Mock data
const requests: Request[] = [
  {
    id: "REQ001",
    userDetails: {
      name: "John Smith",
      phone: "+1 (555) 123-4567",
      location: "Highway 101, Mile 23"
    },
    issueType: "Engine Overheating",
    status: "pending",
    timeRequested: "10 mins ago",
    urgency: "high"
  },
  {
    id: "REQ002",
    userDetails: {
      name: "Sarah Johnson",
      phone: "+1 (555) 987-6543",
      location: "Main St & 5th Ave"
    },
    issueType: "Flat Tire",
    status: "assigned",
    timeRequested: "25 mins ago",
    assignedMechanic: "AutoFix Pro",
    urgency: "medium"
  },
  {
    id: "REQ003",
    userDetails: {
      name: "Mike Davis",
      phone: "+1 (555) 456-7890",
      location: "Downtown Parking Lot"
    },
    issueType: "Battery Jump Start",
    status: "in-progress",
    timeRequested: "45 mins ago",
    assignedMechanic: "Rapid Repairs",
    urgency: "low"
  }
];

function RequestOverview() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "destructive";
      case "assigned": return "secondary";
      case "in-progress": return "default";
      case "completed": return "default";
      default: return "secondary";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "text-destructive";
      case "medium": return "text-warning";
      case "low": return "text-success";
      default: return "text-muted-foreground";
    }
  };

  const handleAssignMechanic = (requestId: string) => {
    console.log("Assign mechanic for request:", requestId);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Active Requests</span>
          <Badge variant="secondary">{requests.length} active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          <div className="p-4 space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {request.id}
                    </Badge>
                    <Badge 
                      variant={getStatusColor(request.status)}
                      className="text-xs"
                    >
                      {request.status.replace("-", " ")}
                    </Badge>
                    <div className={`flex items-center space-x-1 ${getUrgencyColor(request.urgency)}`}>
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-xs capitalize">{request.urgency}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">{request.timeRequested}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center space-x-1 mb-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium">{request.userDetails.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{request.userDetails.phone}</p>
                  </div>
                  <div>
                    <div className="flex items-center space-x-1 mb-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{request.issueType}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{request.userDetails.location}</p>
                  </div>
                </div>

                {request.assignedMechanic && (
                  <div className="bg-accent px-3 py-2 rounded text-sm">
                    <span className="text-muted-foreground">Assigned to: </span>
                    <span className="font-medium">{request.assignedMechanic}</span>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  {request.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => handleAssignMechanic(request.id)}
                    >
                      Assign Mechanic
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RequestOverview;