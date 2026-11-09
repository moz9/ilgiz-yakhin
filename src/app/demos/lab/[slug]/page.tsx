import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { allProjects, getProject } from "@/lib/projects";
import { ShowcaseHost } from "@/components/showcases/registry";

export function generateStaticParams() {
  return allProjects.filter((project) => project.live).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = getProject((await params).slug);
  return project ? { title: `${project.title} — живое демо`, robots: { index: false } } : {};
}

/** The live demo on the whole screen: the "open full screen" link and the source of case frames. */
export default async function ShowcasePage({ params }: { params: Promise<{ slug: string }> }) {
  const project = getProject((await params).slug);
  if (!project?.live) notFound();
  return <main className="showcase-full" aria-label={project.title}>
    <ShowcaseHost slug={project.slug} mode="full" />
    <Link className="button showcase-back" href={`/projects/${project.slug}`} data-lg="button"><ArrowLeft aria-hidden="true" />{project.title}</Link>
  </main>;
}
