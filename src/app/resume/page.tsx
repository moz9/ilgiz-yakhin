import type { Metadata } from "next";
import { ResumeStory } from "@/components/resume-story";

export const metadata: Metadata = {
  title: "Резюме",
  description: "Опыт, компетенции и практические результаты Ильгиза Яхина.",
};

export default function ResumePage() {
  return <ResumeStory />;
}
