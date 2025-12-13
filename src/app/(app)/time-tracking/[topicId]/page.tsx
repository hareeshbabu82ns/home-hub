import { redirect } from "next/navigation";
import { getUserAuth } from "@/lib/auth/utils";
import { fetchTimeTopic } from "../actions";
import { TopicDetailsClient } from "./topic-details-client";
import type { Metadata } from "next";

interface TopicDetailsPageProps {
  params: Promise<{
    topicId: string;
  }>;
}

export async function generateMetadata({
  params,
}: TopicDetailsPageProps): Promise<Metadata> {
  const { topicId } = await params;
  const topic = await fetchTimeTopic(topicId);

  return {
    title: topic ? `${topic.name} - Time Tracking` : "Topic Details",
    description: topic
      ? `View and manage time tracking sessions for ${topic.name}`
      : "Time tracking topic details",
  };
}

export default async function TopicDetailsPage({
  params,
}: TopicDetailsPageProps) {
  const { topicId } = await params;
  const { session } = await getUserAuth();
  if (!session) {
    redirect("/sign-in");
  }

  const topic = await fetchTimeTopic(topicId);

  if (!topic) {
    redirect("/time-tracking");
  }

  return <TopicDetailsClient topic={topic} />;
}
