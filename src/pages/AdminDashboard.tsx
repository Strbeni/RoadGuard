import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("requests");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for requests
  const requests = [
    { id: 1, customer: "John Doe", type: "Flat Tire", status: "Pending", location: "123 Main St", createdAt: "2023-05-15" },
    { id: 2, customer: "Jane Smith", type: "Battery Jump", status: "In Progress", location: "456 Oak Ave", createdAt: "2023-05-16" },
  ];

  // Mock data for mechanics
  const mechanics = [
    { id: 1, name: "Mike Johnson", status: "Available", rating: 4.8, completedJobs: 124 },
    { id: 2, name: "Sarah Williams", status: "On Job", rating: 4.9, completedJobs: 89 },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search..."
            className="w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button>+ New Mechanic</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Service Requests</TabsTrigger>
          <TabsTrigger value="mechanics">Mechanics</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <span className="h-4 w-4 text-muted-foreground">📋</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Mechanics</CardTitle>
                <span className="h-4 w-4 text-muted-foreground">🔧</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">+2 from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <span className="h-4 w-4 text-muted-foreground">⏳</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15</div>
                <p className="text-xs text-muted-foreground">+3 since yesterday</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
                <span className="h-4 w-4 text-muted-foreground">⏱️</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12m 34s</div>
                <p className="text-xs text-muted-foreground">-2m from last month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Service Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.id}</TableCell>
                      <TableCell>{request.customer}</TableCell>
                      <TableCell>{request.type}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {request.status}
                        </span>
                      </TableCell>
                      <TableCell>{request.location}</TableCell>
                      <TableCell>{request.createdAt}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mechanics">
          <Card>
            <CardHeader>
              <CardTitle>Mechanics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Completed Jobs</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mechanics.map((mechanic) => (
                    <TableRow key={mechanic.id}>
                      <TableCell>{mechanic.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          mechanic.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {mechanic.status}
                        </span>
                      </TableCell>
                      <TableCell>{mechanic.rating} ⭐</TableCell>
                      <TableCell>{mechanic.completedJobs}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;