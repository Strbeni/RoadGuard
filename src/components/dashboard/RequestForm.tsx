import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const RequestForm = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [serviceType, setServiceType] = useState('');
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [isLoading, setIsLoading] = useState(false);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        toast({ title: 'Location captured!' });
      }, (error) => {
        toast({ title: 'Error getting location', description: error.message, variant: 'destructive' });
      });
    } else {
      toast({ title: 'Geolocation is not supported by this browser.', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !serviceType || !location.lat) {
      toast({ title: 'Please fill all fields and capture location.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'requests'), {
        userId: currentUser.uid,
        serviceType,
        location,
        status: 'pending',
        createdAt: serverTimestamp(),
        statusTimeline: { created: serverTimestamp() },
      });
      toast({ title: 'Request submitted successfully!' });
      setServiceType('');
      setLocation({ lat: null, lng: null });
    } catch (error) {
      toast({ title: 'Failed to submit request', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Service Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="serviceType">Service Type</Label>
            <Select onValueChange={setServiceType} value={serviceType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tire Change">Tire Change</SelectItem>
                <SelectItem value="Battery Jump">Battery Jump</SelectItem>
                <SelectItem value="Fuel Delivery">Fuel Delivery</SelectItem>
                <SelectItem value="Towing">Towing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Location</Label>
            <div className="flex items-center gap-4">
              <Button type="button" onClick={handleGetLocation}>Get Current Location</Button>
              {location.lat && <p className="text-sm">Location captured!</p>}
            </div>
          </div>
          <Button type="submit" disabled={isLoading}>{isLoading ? 'Submitting...' : 'Submit Request'}</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RequestForm;
