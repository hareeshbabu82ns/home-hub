"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Globe, Calendar, DollarSign, Clock } from "lucide-react";

export default function LanguageRegionPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Language & Region</h1>
          <p className="text-muted-foreground">
            Configure language, locale, and regional preferences
          </p>
        </div>
      </div>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language Preferences
          </CardTitle>
          <CardDescription>
            Select your preferred language for the application interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app-language">Application Language</Label>
            <Select defaultValue="en-US">
              <SelectTrigger id="app-language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (United States)</SelectItem>
                <SelectItem value="en-GB">English (United Kingdom)</SelectItem>
                <SelectItem value="es-ES">Español (España)</SelectItem>
                <SelectItem value="fr-FR">Français (France)</SelectItem>
                <SelectItem value="de-DE">Deutsch (Deutschland)</SelectItem>
                <SelectItem value="it-IT">Italiano (Italia)</SelectItem>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="ja-JP">日本語 (日本)</SelectItem>
                <SelectItem value="ko-KR">한국어 (대한민국)</SelectItem>
                <SelectItem value="zh-CN">中文 (简体)</SelectItem>
                <SelectItem value="zh-TW">中文 (繁體)</SelectItem>
                <SelectItem value="hi-IN">हिन्दी (भारत)</SelectItem>
                <SelectItem value="te-IN">తెలుగు (భారతదేశం)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fallback-language">Fallback Language</Label>
            <Select defaultValue="en-US">
              <SelectTrigger id="fallback-language">
                <SelectValue placeholder="Select fallback language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (United States)</SelectItem>
                <SelectItem value="en-GB">English (United Kingdom)</SelectItem>
                <SelectItem value="es-ES">Español (España)</SelectItem>
                <SelectItem value="fr-FR">Français (France)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">
              Used when content is not available in your preferred language
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
            <h4 className="font-medium text-blue-800 dark:text-blue-200">
              Language Pack Status
            </h4>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              >
                English (US) - Complete
              </Badge>
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              >
                Telugu - 85% Complete
              </Badge>
              <Badge
                variant="secondary"
                className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
              >
                Hindi - Download Available
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Regional Settings
          </CardTitle>
          <CardDescription>
            Configure date, time, and number formatting preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select defaultValue="US">
                <SelectTrigger id="region">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="IN">India</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="JP">Japan</SelectItem>
                  <SelectItem value="BR">Brazil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Time Zone</Label>
              <Select defaultValue="America/New_York">
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">
                    Eastern Time (ET)
                  </SelectItem>
                  <SelectItem value="America/Chicago">
                    Central Time (CT)
                  </SelectItem>
                  <SelectItem value="America/Denver">
                    Mountain Time (MT)
                  </SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    Pacific Time (PT)
                  </SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                  <SelectItem value="Australia/Sydney">
                    Sydney (AEDT)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date-format">Date Format</Label>
              <Select defaultValue="MM/DD/YYYY">
                <SelectTrigger id="date-format">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (UK)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                  <SelectItem value="DD.MM.YYYY">
                    DD.MM.YYYY (German)
                  </SelectItem>
                  <SelectItem value="DD/MM/YY">DD/MM/YY (Short)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-format">Time Format</Label>
              <Select defaultValue="12h">
                <SelectTrigger id="time-format">
                  <SelectValue placeholder="Select time format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                  <SelectItem value="24h">24 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Number & Currency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Number & Currency Formatting
          </CardTitle>
          <CardDescription>
            Configure how numbers and currency are displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currency">Primary Currency</Label>
              <Select defaultValue="USD">
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="GBP">British Pound (£)</SelectItem>
                  <SelectItem value="JPY">Japanese Yen (¥)</SelectItem>
                  <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                  <SelectItem value="CAD">Canadian Dollar (C$)</SelectItem>
                  <SelectItem value="AUD">Australian Dollar (A$)</SelectItem>
                  <SelectItem value="CHF">Swiss Franc (CHF)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="number-format">Number Format</Label>
              <Select defaultValue="en-US">
                <SelectTrigger id="number-format">
                  <SelectValue placeholder="Select number format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">1,234.56 (US)</SelectItem>
                  <SelectItem value="en-GB">1,234.56 (UK)</SelectItem>
                  <SelectItem value="de-DE">1.234,56 (German)</SelectItem>
                  <SelectItem value="fr-FR">1 234,56 (French)</SelectItem>
                  <SelectItem value="hi-IN">1,23,456.78 (Indian)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium">Preview</h4>
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Date:</p>
                <p className="text-muted-foreground">07/19/2025</p>
              </div>
              <div>
                <p className="font-medium">Time:</p>
                <p className="text-muted-foreground">2:30 PM</p>
              </div>
              <div>
                <p className="font-medium">Number:</p>
                <p className="text-muted-foreground">1,234.56</p>
              </div>
              <div>
                <p className="font-medium">Currency:</p>
                <p className="text-muted-foreground">$1,234.56</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Week Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Calendar & Week Settings
          </CardTitle>
          <CardDescription>
            Configure calendar and week display preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first-day">First Day of Week</Label>
              <Select defaultValue="sunday">
                <SelectTrigger id="first-day">
                  <SelectValue placeholder="Select first day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunday">Sunday</SelectItem>
                  <SelectItem value="monday">Monday</SelectItem>
                  <SelectItem value="saturday">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekend">Weekend Days</Label>
              <Select defaultValue="sat-sun">
                <SelectTrigger id="weekend">
                  <SelectValue placeholder="Select weekend days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sat-sun">Saturday & Sunday</SelectItem>
                  <SelectItem value="fri-sat">Friday & Saturday</SelectItem>
                  <SelectItem value="sun-only">Sunday Only</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button>Save Changes</Button>
        <Button variant="outline">Reset to Default</Button>
      </div>
    </div>
  );
}
