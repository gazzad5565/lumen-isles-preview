"use client";

import { useParams } from "next/navigation";
import { LessonRunner } from "@/components/lesson/LessonRunner";

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  return <LessonRunner lessonId={decodeURIComponent(params.id)} />;
}
