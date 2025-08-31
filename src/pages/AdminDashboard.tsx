import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminService, type UserData, type ServiceRequest, type AnalyticsData } from "@/services/adminService";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Loader2, User, Wrench, AlertCircle, Eye, Pencil, Star } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [workers, setWorkers] = useState<UserData[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalWorkers: 0,
    totalRequests: 0,
    completedRequests: 0,
    pendingRequests: 0,
    revenue: 0
  });

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Always fetch analytics for overview tab
        if (activeTab === 'overview' || activeTab === 'users' || activeTab === 'mechanics') {
          const [usersData, workersData, analyticsData] = await Promise.all([
            adminService.getUsersByRole('user'),
            adminService.getUsersByRole('mechanic'),
            adminService.getAnalytics()
          ]);
          setUsers(usersData);
          setWorkers(workersData);
          setAnalytics(analyticsData);
        } else if (activeTab === 'requests') {
          const requestsData = await adminService.getServiceRequests();
          setRequests(requestsData);
        }
      } catch (err) {
        const error = err as Error;
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to fetch data');
        toast({
          title: "Error",
          description: error.message || "Failed to fetch data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  // Filter data based on search query
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWorkers = workers.filter(worker => 
    worker.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (worker as any).specialty?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRequests = requests.filter(request => 
    request.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (typeof request.location === 'string' ? 
      request.location.toLowerCase().includes(searchQuery.toLowerCase()) :
      `${request.location?.lat},${request.location?.lng}`.includes(searchQuery.toLowerCase())
    ) ||
    request.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM d, yyyy HH:mm');
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusMap: Record<string, { variant: 'secondary' | 'default' | 'success' | 'destructive' | 'outline', text: string }> = {
      pending: { variant: 'secondary', text: 'Pending' },
      accepted: { variant: 'default', text: 'Accepted' },
      in_progress: { variant: 'default', text: 'In Progress' },
      completed: { variant: 'success', text: 'Completed' },
      cancelled: { variant: 'destructive', text: 'Cancelled' },
    };

    const statusConfig = statusMap[status] || { variant: 'outline' as const, text: status };

    return (
      <Badge variant={statusConfig.variant}>
        {statusConfig.text}
      </Badge>
    );
  };

  if (loading && activeTab === 'overview') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage users, workers, and service requests
            </p>
          </div>
          <div className="w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-8 md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        {error && (
          <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="mechanics">Workers</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      {users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length} new this month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Wrench className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalWorkers}</div>
                    <p className="text-xs text-muted-foreground">
                      {workers.filter(w => w.status === 'active').length} active
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Service Requests</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">📋</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.pendingRequests} pending, {analytics.completedRequests} completed
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">💰</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${analytics.revenue ? (analytics.revenue / 100).toFixed(2) : '0.00'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All time revenue
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Users</CardTitle>
                    <CardDescription>Newly registered users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {users.slice(0, 5).map((user) => (
                        <div key={user.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{user.name || 'Unknown User'}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                      {users.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Requests</CardTitle>
                    <CardDescription>Latest service requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {requests.slice(0, 5).map((request) => (
                        <div key={request.id} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{request.serviceType}</p>
                            <div className="flex items-center space-x-2">
                              <StatusBadge status={request.status} />
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">View</Button>
                        </div>
                      ))}
                      {requests.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No requests found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg">Users</CardTitle>
                  <CardDescription>Manage all registered users</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="relative overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                  <User className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium">{user.name || 'Unknown User'}</p>
                                  <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm">{user.email}</p>
                                {user.phone && (
                                  <p className="text-xs text-muted-foreground">{user.phone}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={user.status === 'active' ? 'default' : 'outline'}
                                className={user.status === 'inactive' ? 'bg-destructive/10 text-destructive' : ''}
                              >
                                {user.status || 'active'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {format(new Date(user.createdAt), 'MMM d, yyyy')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" className="h-8">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="h-8">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            {searchQuery ? 'No matching users found' : 'No users found'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;