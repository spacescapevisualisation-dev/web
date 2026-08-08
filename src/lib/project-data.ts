import { PROJECTS, projectSlug, type Project } from "@/lib/projects";
import { sanityClient } from "@/sanity/client";
import { projectsQuery } from "@/sanity/queries";

type CmsProject = Partial<Project> & { slug?: string };

const sceneKeys = ["s1", "s4", "s3", "s2", "s5", "s6"];

function normalize(project: CmsProject, index: number): Project | null {
  if (!project.name || !project.location || !project.year) return null;
  const fallback = PROJECTS.find((item) => projectSlug(item) === project.slug) || PROJECTS[index % PROJECTS.length];
  return {
    ...fallback,
    ...project,
    no: String(project.no || index + 1).padStart(2, "0"),
    scene: project.scene || sceneKeys[index % sceneKeys.length],
    sceneB: project.sceneB || sceneKeys[(index + 3) % sceneKeys.length],
    align: project.align || "left",
    span: project.span || "std",
    featured: project.featured ?? false,
  };
}

function mergeWithBundled(cmsProjects: Project[]): Project[] {
  if (!cmsProjects.length) return PROJECTS;
  const cmsBySlug = new Map(cmsProjects.map((project) => [projectSlug(project), project]));
  const migrated = PROJECTS.map((project) => cmsBySlug.get(projectSlug(project)) || project);
  const additions = cmsProjects.filter(
    (project) => !PROJECTS.some((fallback) => projectSlug(fallback) === projectSlug(project)),
  );
  return [...migrated, ...additions].sort((a, b) => {
    const fallbackA = PROJECTS.findIndex((item) => projectSlug(item) === projectSlug(a));
    const fallbackB = PROJECTS.findIndex((item) => projectSlug(item) === projectSlug(b));
    return (a.order ?? (fallbackA < 0 ? 999 : fallbackA)) - (b.order ?? (fallbackB < 0 ? 999 : fallbackB));
  });
}

export async function getProjects(): Promise<Project[]> {
  if (!sanityClient) return PROJECTS;
  try {
    const result = await sanityClient.fetch<CmsProject[]>(projectsQuery);
    const sanityProjects = result.map(normalize).filter((project): project is Project => Boolean(project));
    return mergeWithBundled(sanityProjects);
  } catch (error) {
    console.warn("Sanity content unavailable; using bundled projects.", error);
    return PROJECTS;
  }
}
