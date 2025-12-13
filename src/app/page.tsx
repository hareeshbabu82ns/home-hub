import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getUserAuth } from "@/lib/auth/utils";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { InstallPWAButton } from "@/components/install-pwa-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Timer,
  IndianRupee,
  User,
  Settings,
  Shield,
  Smartphone,
  Download,
  Wifi,
  House,
} from "lucide-react";

export default async function Home() {
  const { session } = await getUserAuth();
  if (session) redirect("/dashboard");
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
        <div className="container mx-auto flex h-14 max-w-6xl items-center px-4">
          <Link className="flex items-center space-x-2" href="/">
            <Image
              src="/logo.svg"
              alt="HomeHub Logo"
              width={32}
              height={32}
              className="size-8"
            />
            <span className="font-bold">HomeHub</span>
          </Link>
          <nav className="ml-auto flex items-center gap-2 sm:gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="#features">Features</Link>
            </Button>
            <InstallPWAButton variant="outline" size="sm" />
            <Button asChild variant="outline" size="sm">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - Mobile First */}
        <section className="w-full px-4 py-8 sm:py-16 md:py-24 lg:py-32">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col items-center space-y-6 text-center lg:space-y-8">
              <div className="space-y-4">
                <div className="mx-auto mb-8 flex justify-center">
                  <Image
                    src="/logo.svg"
                    alt="HomeHub Logo"
                    width={120}
                    height={120}
                    className="animate-pulse"
                    priority
                  />
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                  Your Smart{" "}
                  <span className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">
                    HomeHub
                  </span>
                </h1>
                <p className="text-muted-foreground mx-auto max-w-2xl text-base sm:text-lg md:text-xl">
                  A Progressive Web App for managing your smart home, tracking
                  activities, and organizing your digital life. Install it on
                  any device for native app experience.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/sign-in">Get Started Free</Link>
                </Button>
                <InstallPWAButton
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto"
                />
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Link href="#features">Explore Features</Link>
                </Button>
              </div>

              {/* PWA Features Banner */}
              <div className="bg-primary/10 border-primary/20 mt-8 w-full max-w-2xl rounded-lg border p-4">
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Download className="text-primary size-4" />
                    <span>Installable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="text-primary size-4" />
                    <span>Works Offline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="text-primary size-4" />
                    <span>Mobile Ready</span>
                  </div>
                </div>
              </div>

              {/* Hero Visual */}
              <div className="mt-8 w-full max-w-4xl">
                <div className="bg-muted/30 relative mx-auto aspect-video overflow-hidden rounded-lg border shadow-2xl">
                  <div className="from-primary/20 to-secondary/20 absolute inset-0 bg-gradient-to-br" />
                  <div className="relative flex h-full items-center justify-center">
                    <div className="text-center">
                      <Image
                        src="/logo.svg"
                        alt="HomeHub Dashboard Preview"
                        width={80}
                        height={80}
                        className="mx-auto"
                      />
                      <p className="text-muted-foreground mt-4 text-sm">
                        Your Dashboard Preview
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PWA Features Section */}
        <section
          id="pwa-features"
          className="bg-muted/30 w-full px-4 py-12 sm:py-16 md:py-24"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="mb-12 space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-medium">
                📱 Progressive Web App
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                Install Once, Use Everywhere
              </h2>
              <p className="text-muted-foreground mx-auto max-w-2xl text-base sm:text-lg">
                HomeHub is a modern Progressive Web App that works on all your
                devices with native app performance.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <Download className="text-primary mb-2 size-8" />
                  <CardTitle>Easy Installation</CardTitle>
                  <CardDescription>
                    Install directly from your browser - no app store required
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Click the install button in your browser or use the Install
                    App button on this page to add HomeHub to your home screen.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Wifi className="text-primary mb-2 size-8" />
                  <CardTitle>Offline Capable</CardTitle>
                  <CardDescription>
                    Works even when you&apos;re not connected to the internet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Browse your data, view cached content, and continue working
                    even without an internet connection.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Smartphone className="text-primary mb-2 size-8" />
                  <CardTitle>Native Experience</CardTitle>
                  <CardDescription>
                    Feels like a native app on mobile and desktop
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Full screen experience, fast loading, and smooth animations
                    that rival native applications.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section - App Specific */}
        <section id="features" className="w-full px-4 py-12 sm:py-16 md:py-24">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-12 space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-medium">
                ✨ Core Features
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                Everything You Need in One Place
              </h2>
              <p className="text-muted-foreground mx-auto max-w-2xl text-base sm:text-lg">
                Streamline your daily tasks and home management with our
                comprehensive suite of tools.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <House className="text-primary mb-2 size-8" />
                  <CardTitle>Smart Home Control</CardTitle>
                  <CardDescription>
                    Manage all your smart devices from one dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Control lights, temperature, security systems, and more with
                    intuitive controls and automation.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Timer className="text-primary mb-2 size-8" />
                  <CardTitle>Time Tracking</CardTitle>
                  <CardDescription>
                    Track your time and boost productivity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Monitor how you spend your time with detailed analytics and
                    insights to improve your daily routine.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <IndianRupee className="text-primary mb-2 size-8" />
                  <CardTitle>Expense Management</CardTitle>
                  <CardDescription>
                    Keep track of your household expenses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Organize finances, set budgets, and monitor spending
                    patterns with comprehensive expense tracking.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <User className="text-primary mb-2 size-8" />
                  <CardTitle>Family Profiles</CardTitle>
                  <CardDescription>
                    Manage multiple family member profiles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Create personalized experiences for each family member with
                    custom dashboards and permissions.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Settings className="text-primary mb-2 size-8" />
                  <CardTitle>Automation</CardTitle>
                  <CardDescription>
                    Set up smart home automation rules
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Create intelligent automation workflows that adapt to your
                    lifestyle and preferences.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="text-primary mb-2 size-8" />
                  <CardTitle>Security & Privacy</CardTitle>
                  <CardDescription>
                    Your data is secure and private
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    End-to-end encryption and local data storage ensure your
                    family&apos;s information stays protected.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary/5 w-full px-4 py-12 sm:py-16 md:py-24">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                Ready to Transform Your Home?
              </h2>
              <p className="text-muted-foreground mx-auto max-w-2xl text-base sm:text-lg">
                Join thousands of families who have revolutionized their home
                management with HomeHub.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/sign-in">Start Your Journey</Link>
                </Button>
                <InstallPWAButton
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center space-x-2">
              <Image
                src="/logo.svg"
                alt="HomeHub Logo"
                width={24}
                height={24}
                className="size-6"
              />
              <span className="font-bold">HomeHub</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 HomeHub. Built with Next.js and love.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
