import type React from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  MapPin,
  Brain,
  Wrench,
  ShieldCheck,
  Clock,
  Car,
  Navigation,
  Zap,
  Star,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Icon from "./hero.png"

// ===== Metric Component =====
function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2 shadow-sm hover:shadow-md transition-all">
      <div className="rounded-md bg-blue-700 p-2">
        <Icon className="h-4 w-4 text-white" aria-hidden="true" />
      </div>
      <div className="leading-tight">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold text-foreground">{value}</div>
      </div>
    </div>
  )
}

// ===== Feature Component =====
function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType
  title: string
  desc: string
}) {
  return (
    <Card className="border-border bg-card hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-blue-700 p-2">
            <Icon className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <CardTitle className="text-foreground">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  )
}

// ===== Index Page =====
function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header / Navbar */}
      <header className="border-b border-border sticky top-0 z-50 backdrop-blur-md bg-background/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-md bg-primary p-2">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight">RoadGuard</span>
          </div>
          {/* Navigation */}
          <nav className="flex items-center gap-2">
            <Button
              variant="outline"
              asChild
              className="border-border bg-transparent hover:bg-muted transition-colors"
            >
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground hover:opacity-90">
              <Link to="/signup/user">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="border-b border-border bg-[radial-gradient(ellipse_at_top,rgba(255,0,0,0.15),transparent_60%)]">
          <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">
            <div className="grid items-center gap-8 md:grid-cols-2">
              {/* Hero Text */}
              <div className="space-y-6 animate-fadeIn">
                <h1 className="text-balance text-4xl font-extrabold leading-tight md:text-6xl">
                  Roadside Help <br />
                  <span className="text-accent">When You Need It</span>
                </h1>
                <p className="text-pretty text-lg text-muted-foreground max-w-xl">
                  Get immediate assistance for battery jumps, tire changes, fuel delivery, and towing. 
                  Trusted mechanics are ready to help 24/7 with live tracking and quick response.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="lg" asChild className="bg-accent text-accent-foreground shadow-lg hover:opacity-90">
                    <Link to="/signup/user">Request Help Now</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="border-border bg-transparent text-foreground hover:bg-muted"
                  >
                    <Link to="/signup/mechanic">Join as Mechanic</Link>
                  </Button>
                </div>

                {/* Metrics */}
                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                  <Metric icon={Clock} label="Avg ETA" value="15–30 min" />
                  <Metric icon={MapPin} label="Providers Nearby" value="18 online" />
                  <Metric icon={Navigation} label="Live Tracking" value="Enabled" />
                </div>
              </div>

              {/* Map-like Preview */}
              <Card className="border-border bg-card shadow-md hover:shadow-xl transition-all">
                <CardContent className="p-4">
                  <div className="overflow-hidden rounded-md border border-border">
                    <img
                      src={Icon}
                      alt="Live map preview with route and nearby providers"
                      className="h-auto w-full object-cover"
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    SOS active
                    <span className="inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                    Nearby mechanics
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-center text-3xl font-bold mb-10">Why Choose RoadGuard?</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Feature
              icon={AlertTriangle}
              title="Real-Time SOS"
              desc="Trigger assistance instantly with high-visibility alerts and continuous status updates."
            />
            <Feature
              icon={MapPin}
              title="Nearby Mechanics"
              desc="We automatically locate trusted providers close to you for faster response."
            />
            <Feature
              icon={Brain}
              title="Predictive Suggestions"
              desc="AI recommends the best providers based on proximity, ratings, and availability."
            />
            <Feature
              icon={Wrench}
              title="DIY Quick Fixes"
              desc="Guided checklists for minor issues to get you moving safely if you can self-resolve."
            />
          </div>
        </section>

        {/* Services Grid */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-center text-2xl font-bold md:text-3xl">Services We Provide</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
              From jump starts to towing, we’ve got you covered — day or night.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Battery Jump", icon: Zap },
                { label: "Tire Change", icon: Wrench },
                { label: "Fuel Delivery", icon: Car },
                { label: "Towing Service", icon: Navigation },
                { label: "Lockout Help", icon: ShieldCheck },
                { label: "Engine Diagnostics", icon: Brain },
                { label: "Emergency Repairs", icon: AlertTriangle },
                { label: "24/7 Support", icon: Clock },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center rounded-md bg-blue-700 p-2">
                      <item.icon className="h-5 w-5 text-white" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                  <span
                    className="h-2 w-2 rounded-full bg-primary opacity-60 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Safety Strip */}
        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-center text-2xl font-bold md:text-3xl mb-10">Trusted by Thousands</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <ShieldCheck className="h-5 w-5 text-blue-700" aria-hidden="true" />
                  Vetted & Insured
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Every mechanic is verified, rated, and insured for your safety and peace of mind.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Clock className="h-5 w-5 text-blue-700" aria-hidden="true" />
                  Faster Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Smart dispatching reduces waiting with live ETAs and real-time tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Brain className="h-5 w-5 text-blue-700" aria-hidden="true" />
                  AI-Powered Choices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get data-driven recommendations for the most reliable nearby providers.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border bg-accent/10">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-10 text-center shadow-lg">
              <h3 className="text-3xl font-bold md:text-4xl">Stuck on the road?</h3>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground text-lg">
                Tap below to share your location and get immediate help from a nearby, trusted provider.
              </p>
              <div className="mt-8 flex justify-center">
                <Button size="lg" asChild className="bg-primary text-primary-foreground hover:opacity-90 shadow-lg">
                  <Link to="/signup">🚨 SOS — Request Help</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted-foreground">
          © 2024 RoadGuard — Safe, reliable roadside assistance. Built for drivers, trusted by mechanics.
        </div>
      </footer>
    </div>
  )
}

export default Index;
