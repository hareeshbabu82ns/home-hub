import { redirect } from "next/navigation";
import { getUserAuth } from "@/lib/auth/utils";
import { fetchTimeTopic } from "../actions";
import { TopicDetailsClient } from "./topic-details-client";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: TopicDetailsPageProps): Promise<Metadata> {
  const topic = await fetchTimeTopic(params.topicId);

  return {
    title: topic ? `${topic.name} - Time Tracking` : "Topic Details",
    description: topic
      ? `View and manage time tracking sessions for ${topic.name}`
      : "Time tracking topic details",
  };
}

interface TopicDetailsPageProps {
  params: {
    topicId: string;
  };
}

export default async function TopicDetailsPage({
  params,
}: TopicDetailsPageProps) {
  const { session } = await getUserAuth();
  if (!session) {
    redirect("/sign-in");
  }

  const topic = await fetchTimeTopic(params.topicId);

  if (!topic) {
    redirect("/time-tracking");
  }

  return <TopicDetailsClient topic={topic} />;
}
