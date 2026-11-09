import { TrackForm } from "../components/track-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewTrackPage() {
  return (
    <main className="space-y-6 p-4">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/tracks">
            <ArrowLeft className="mr-2 size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create New Track</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Track Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TrackForm
            track={{
              id: "new",
              title: "",
              description: "",
              userId: "",
              createdAt: new Date(),
              updatedAt: new Date(),
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
