import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MountainIcon from "@/components/MountainIcon";
import {
  Timer,
  IndianRupee,
  User,
  Settings,
  Shield,
  Smartphone,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
        <div className="container mx-auto flex h-14 max-w-6xl items-center px-4">
          <Link className="flex items-center space-x-2" href="/">
            <MountainIcon className="size-6" />
            <span className="font-bold">HomeHub</span>
          </Link>
          <nav className="ml-auto flex items-center gap-2 sm:gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="#features">Features</Link>
            </Button>
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
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                  Your Personal{" "}
                  <span className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">
                    Management Hub
                  </span>
                </h1>
                <p className="text-muted-foreground mx-auto max-w-2xl text-base sm:text-lg md:text-xl">
                  Organize your financial life, track your time, and manage your
                  digital presence with HomeHub - your all-in-one personal
                  productivity platform.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/sign-in">Get Started Free</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Link href="#features">Explore Features</Link>
                </Button>
              </div>

              {/* Hero Visual */}
              <div className="mt-8 w-full max-w-4xl">
                <div className="bg-muted/30 relative mx-auto aspect-video overflow-hidden rounded-lg border shadow-2xl">
                  <div className="from-primary/20 to-secondary/20 absolute inset-0 bg-gradient-to-br" />
                  <div className="relative flex h-full items-center justify-center">
                    <div className="text-center">
                      <MountainIcon className="text-primary mx-auto size-20" />
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
        {/* Features Section - App Specific */}
        <section
          id="features"
          className="bg-muted/30 w-full px-4 py-12 sm:py-16 md:py-24"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="mb-12 space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-medium">
                ✨ Core Features
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                Everything you need to stay organized
              </h2>
              <p className="text-muted-foreground mx-auto max-w-2xl sm:text-lg">
                HomeHub brings together all your personal management tools in
                one secure, easy-to-use platform designed for modern life.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Loan Management */}
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900">
                      <IndianRupee className="size-5 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-lg">Loan Management</CardTitle>
                  </div>
                  <CardDescription>
                    Track personal loans, EMIs, and financial commitments with
                    automated reminders and payment schedules.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>• Payment tracking & reminders</li>
                    <li>• Interest calculations</li>
                    <li>• Payment history</li>
                    <li>• Multiple loan support</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Time Tracking */}
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                      <Timer className="size-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-lg">Time Tracking</CardTitle>
                  </div>
                  <CardDescription>
                    Monitor your productivity with detailed time tracking for
                    projects, work sessions, and personal activities.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>• Project time tracking</li>
                    <li>• Activity categorization</li>
                    <li>• Productivity insights</li>
                    <li>• Export reports</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Account Management */}
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900">
                      <User className="size-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-lg">Account Hub</CardTitle>
                  </div>
                  <CardDescription>
                    Centralized profile management with secure authentication
                    and personalized settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>• Profile customization</li>
                    <li>• Security settings</li>
                    <li>• OAuth integration</li>
                    <li>• Email management</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Settings & Customization */}
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900">
                      <Settings className="size-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <CardTitle className="text-lg">Smart Settings</CardTitle>
                  </div>
                  <CardDescription>
                    Customize your experience with theme preferences,
                    notifications, and workspace configurations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>• Dark/Light themes</li>
                    <li>• Notification preferences</li>
                    <li>• Dashboard layouts</li>
                    <li>• Data export options</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Security & Privacy */}
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900">
                      <Shield className="size-5 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-lg">Security First</CardTitle>
                  </div>
                  <CardDescription>
                    Your data is protected with enterprise-grade security, OAuth
                    authentication, and privacy controls.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>• OAuth 2.0 authentication</li>
                    <li>• Encrypted data storage</li>
                    <li>• Session management</li>
                    <li>• Privacy controls</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Mobile Experience */}
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="rounded-lg bg-teal-100 p-2 dark:bg-teal-900">
                      <Smartphone className="size-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <CardTitle className="text-lg">Mobile Optimized</CardTitle>
                  </div>
                  <CardDescription>
                    Responsive design ensures a seamless experience across all
                    your devices, from phone to desktop.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>• Progressive Web App</li>
                    <li>• Touch-friendly interface</li>
                    <li>• Offline capabilities</li>
                    <li>• Cross-device sync</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full border-t px-4 py-12 sm:py-16 md:py-24">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                  Ready to organize your life?
                </h2>
                <p className="text-muted-foreground mx-auto max-w-2xl sm:text-lg">
                  Join thousands of users who have transformed their personal
                  productivity with HomeHub. Start your journey today.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/sign-in">Start Free Today</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Link href="/extras/scrap-web">View Demo</Link>
                </Button>
              </div>

              <div className="pt-6 text-center">
                <p className="text-muted-foreground text-sm">
                  ✓ Free to start • ✓ No credit card required • ✓ Cancel anytime
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-muted/30 w-full border-t px-4 py-6 sm:py-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center space-x-2">
              <MountainIcon className="size-5" />
              <span className="text-sm font-medium">HomeHub</span>
            </div>
            <p className="text-muted-foreground text-xs">
              © 2024 HomeHub by TerabitsIO. All rights reserved.
            </p>
            <nav className="flex gap-4 text-xs">
              <Link className="underline-offset-4 hover:underline" href="#">
                Privacy Policy
              </Link>
              <Link className="underline-offset-4 hover:underline" href="#">
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
