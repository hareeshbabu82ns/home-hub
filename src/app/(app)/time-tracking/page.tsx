import { Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchTimeTopics } from "./actions";
import { TimeTrackingClient } from "./components/time-tracking-client";
import { TopicDialog } from "./components/topic-dialog";

export default async function TimeTrackingPage() {
  const topics = await fetchTimeTopics();

  return (
    <main className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-purple-500">
            <Clock className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Time Tracking</h1>
            <p className="text-muted-foreground text-sm">
              Track time across your topics
            </p>
          </div>
        </div>

        <TopicDialog
          trigger={
            <Button className="gap-2">
              <Plus className="size-4" />
              New Topic
            </Button>
          }
        />
      </div>

      {/* Main Content */}
      <TimeTrackingClient initialTopics={topics} />
    </main>
  );
}
