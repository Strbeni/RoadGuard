import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, MapPin, Zap, Users, Clock, Star } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-accent rounded-full p-2">
              <Shield className="h-6 w-6 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold text-primary-foreground">RoadGuard</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="text-black border-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-accent hover:bg-accent-light text-accent-foreground">
              <Link to="/signup/user">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground">
            Roadside Help
            <br />
            <span className="text-accent">When You Need It</span>
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Get immediate assistance for battery jumps, tire changes, fuel delivery, and towing. 
            Trusted mechanics are ready to help 24/7.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild className="bg-accent hover:bg-accent-light text-accent-foreground shadow-accent">
              <Link to="/signup/user">Request Help Now</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-black border-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link to="/signup/mechanic">Join as Mechanic</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-card/95 backdrop-blur-sm shadow-lg">
            <CardHeader className="text-center">
              <div className="bg-primary rounded-full p-3 w-fit mx-auto mb-3">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle>Quick Response</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Average response time of 15-30 minutes. Get help fast when you're stranded.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm shadow-lg">
            <CardHeader className="text-center">
              <div className="bg-accent rounded-full p-3 w-fit mx-auto mb-3">
                <MapPin className="h-6 w-6 text-accent-foreground" />
              </div>
              <CardTitle>Live Tracking</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Track your mechanic's location in real-time and get accurate ETAs.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm shadow-lg">
            <CardHeader className="text-center">
              <div className="bg-success rounded-full p-3 w-fit mx-auto mb-3">
                <Star className="h-6 w-6 text-success-foreground" />
              </div>
              <CardTitle>Trusted Mechanics</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                All mechanics are vetted, rated, and insured for your safety and peace of mind.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Services */}
        <div className="text-center space-y-8">
          <h2 className="text-3xl font-bold text-primary-foreground">Services We Provide</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Battery Jump',
              'Tire Change', 
              'Fuel Delivery',
              'Towing Service',
              'Lockout Help',
              'Engine Diagnostics',
              'Emergency Repairs',
              '24/7 Support'
            ].map((service, index) => (
              <div key={index} className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg p-4">
                <span className="text-primary-foreground font-medium">{service}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16 space-y-6">
          <h2 className="text-3xl font-bold text-primary-foreground">Ready to Get Started?</h2>
          <p className="text-primary-foreground/90 text-lg">
            Join thousands of drivers who trust RoadGuard for their roadside assistance needs.
          </p>
          <Button size="lg" asChild className="bg-accent hover:bg-accent-light text-accent-foreground shadow-accent">
            <Link to="/signup">Create Account</Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-primary-foreground/20 p-6">
        <div className="max-w-6xl mx-auto text-center text-primary-foreground/70 text-sm">
          <p>&copy; 2024 RoadGuard. Your trusted roadside assistance platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
