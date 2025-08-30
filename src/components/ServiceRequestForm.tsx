import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Battery, 
  Wrench, 
  Fuel, 
  Truck, 
  AlertTriangle,
  Camera,
  MapPin,
  Clock
} from "lucide-react";

export interface ServiceRequestData {
  serviceType: string;
  vehicleType: string;
  description: string;
  urgency: 'low' | 'normal' | 'high';
  photo?: File | null;
}

interface ServiceRequestFormProps {
  selectedLocation?: { lat: number; lng: number; address?: string } | null;
  onSuccess: (request: Omit<ServiceRequestData, 'photo'>) => void;
}

const ServiceRequestForm = ({ selectedLocation, onSuccess }: ServiceRequestFormProps) => {
  const [formData, setFormData] = useState<{
    vehicleType: string;
    serviceType: string;
    description: string;
    urgency: string;
    photo: File | null;
    useCurrentLocation: boolean;
  }>({
    vehicleType: "",
    serviceType: "",
    description: "",
    urgency: "normal",
    photo: null,
    useCurrentLocation: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serviceTypes = [
    { id: 'battery', name: 'Battery Jump', icon: Battery, description: 'Dead battery assistance' },
    { id: 'tyre', name: 'Tire Change', icon: Wrench, description: 'Flat tire replacement' },
    { id: 'fuel', name: 'Fuel Delivery', icon: Fuel, description: 'Emergency fuel service' },
    { id: 'tow', name: 'Towing', icon: Truck, description: 'Vehicle towing service' },
    { id: 'other', name: 'Other Issue', icon: AlertTriangle, description: 'General assistance' }
  ];

  const vehicleTypes = [
    'Car', 'SUV', 'Truck', 'Motorcycle', 'Van'
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, photo: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.serviceType || !formData.vehicleType) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the request data
      const requestData = {
        serviceType: formData.serviceType,
        vehicleType: formData.vehicleType,
        description: formData.description,
        urgency: formData.urgency as 'low' | 'normal' | 'high',
        photo: formData.photo
      };

      // Call the onSuccess callback with the form data
      onSuccess(requestData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(90vh-100px)] overflow-y-auto">
      {/* Vehicle Type */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Vehicle Type</Label>
        <Select value={formData.vehicleType} onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select your vehicle type" />
          </SelectTrigger>
          <SelectContent>
            {vehicleTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Service Type */}
      <div className="space-y-3">
        <Label className="text-base font-medium">What do you need help with?</Label>
        <div className="grid grid-cols-1 gap-3">
          {serviceTypes.map((service) => {
            const Icon = service.icon;
            return (
              <Card 
                key={service.id}
                className={`cursor-pointer transition-all border-2 ${
                  formData.serviceType === service.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setFormData({ ...formData, serviceType: service.id })}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`p-2 rounded-lg ${
                    formData.serviceType === service.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                  {formData.serviceType === service.id && (
                    <Badge variant="secondary">Selected</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-3">
        <Label htmlFor="description" className="text-base font-medium">
          Describe the problem (optional)
        </Label>
        <Textarea
          id="description"
          placeholder="Tell us more about what happened..."
          className="min-h-[80px]"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      {/* Photo Upload */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Add a photo (optional)</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-3">
            Upload a photo to help mechanics understand the issue
          </p>
          <Input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="max-w-xs mx-auto"
          />
          {formData.photo && (
            <p className="text-sm text-primary mt-2">Photo selected: {formData.photo.name}</p>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Location</Label>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">
                  {selectedLocation 
                    ? `Custom Location (${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)})`
                    : 'Your Current Location'
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedLocation 
                    ? 'Tap on the map to change location'
                    : 'We\'ll use your current GPS location'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urgency */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Urgency Level</Label>
        <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low - Can wait up to 2 hours</SelectItem>
            <SelectItem value="normal">Normal - Within 1 hour</SelectItem>
            <SelectItem value="high">High - Need help soon (30 min)</SelectItem>
            <SelectItem value="emergency">Emergency - Immediate assistance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estimated Cost */}
      <Card className="bg-accent/10 border-accent">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-accent" />
            <span className="font-medium text-accent">Estimated Response</span>
          </div>
          <p className="text-sm">
            <span className="font-medium">15-45 minutes</span> depending on your location and urgency level.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Service fees vary by provider and will be confirmed before work begins.
          </p>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full bg-gradient-primary hover:shadow-md transition-all"
        disabled={!formData.vehicleType || !formData.serviceType || isSubmitting}
        size="lg"
      >
        {isSubmitting ? "Finding nearby mechanics..." : "Request Help Now"}
      </Button>
    </form>
  );
};

export default ServiceRequestForm;