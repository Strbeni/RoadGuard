import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

const Profile = () => {
  const [userData, setUserData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    language: "en",
    employer: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setFormData({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            language: data.language || "en",
            employer: data.employer || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, toast]);

  const handleUpdateProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        ...formData,
        updatedAt: new Date(),
      });
      
      setUserData({ ...userData, ...formData });
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>User not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
          <div className="space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateProfile}>Save Changes</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-muted-foreground">{userData.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <p className="text-muted-foreground">{userData.email}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {userData.phone || "Not provided"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <p className="text-muted-foreground capitalize">
                    {userData.role}
                  </p>
                </div>

                {userData.role === "mechanic" && (
                  <div className="space-y-2">
                    <Label htmlFor="employer">Employer</Label>
                    {isEditing ? (
                      <Input
                        id="employer"
                        value={formData.employer}
                        onChange={(e) =>
                          setFormData({ ...formData, employer: e.target.value })
                        }
                      />
                    ) : (
                      <p className="text-muted-foreground">
                        {userData.employer || "Not specified"}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  {isEditing ? (
                    <Select
                      value={formData.language}
                      onValueChange={(value) =>
                        setFormData({ ...formData, language: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-muted-foreground capitalize">
                      {formData.language}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {userData.role === "mechanic" && (
            <Card>
              <CardHeader>
                <CardTitle>Work History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    View your work history and completed jobs.
                  </p>
                  <Button asChild variant="outline">
                    <Link to="/work-history">View Work History</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
