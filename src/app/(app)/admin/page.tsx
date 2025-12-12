import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Settings } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/admin/users">
            <Button>Manage Users</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Registration Settings
          </CardTitle>
          <CardDescription>
            Control who can sign up with domain and email restrictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/admin/registration">
            <Button>Manage Registration</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
