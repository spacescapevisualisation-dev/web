import fs from "node:fs";
import path from "node:path";
import { projectSlug, type Project } from "@/lib/projects";

/**
 * Projects live as one JSON file each in /content/projects, edited through
 * Decap CMS at /admin. This runs at build time only (static export).
 */
const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");
const sceneKeys = ["s1", "s4", "s3", "s2", "s5", "s6"];

type ProjectFile = Partial<Project> & { draft?: boolean };

const clean = (value?: string) => (typeof value === "string" && value.trim() ? value.trim() : undefined);

function normalize(data: ProjectFile, fileSlug: string, index: number): Project | null {
  if (!clean(data.name) || data.draft) return null;
  const gallery = (data.additionalImageUrls || [])
    .map((item) => (typeof item === "string" ? item : (item as { image?: string })?.image))
    .filter((item): item is string => Boolean(clean(item)));

  return {
    ...data,
    slug: clean(data.slug) || fileSlug,
    name: data.name!.trim(),
    location: data.location || "",
    year: String(data.year ?? ""),
    category: data.category || "",
    architect: data.architect || "",
    developer: clean(data.developer),
    typology: data.typology || "Residential",
    discipline: data.discipline || "Exterior",
    status: data.status || "Completed",
    size: data.size || "",
    desc: data.desc || "",
    desc2: data.desc2 || data.desc || "",
    featured: data.featured ?? true,
    scene: data.scene || sceneKeys[index % sceneKeys.length],
    sceneB: data.sceneB || sceneKeys[(index + 3) % sceneKeys.length],
    mainImageUrl: clean(data.mainImageUrl),
    secondaryImageUrl: clean(data.secondaryImageUrl),
    tertiaryImageUrl: clean(data.tertiaryImageUrl),
    quaternaryImageUrl: clean(data.quaternaryImageUrl),
    additionalImageUrls: gallery.length ? gallery : undefined,
    align: data.align || "left",
    span: data.span || "std",
    no: "",
  };
}

let cache: Project[] | null = null;

export async function getProjects(): Promise<Project[]> {
  if (cache) return cache;
  const files = fs.existsSync(PROJECTS_DIR)
    ? fs.readdirSync(PROJECTS_DIR).filter((file) => file.endsWith(".json")).sort()
    : [];

  const projects = files
    .map((file, index) => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, file), "utf8")) as ProjectFile;
        return normalize(data, file.replace(/\.json$/, ""), index);
      } catch (error) {
        console.warn(`Skipping unreadable project file ${file}`, error);
        return null;
      }
    })
    .filter((project): project is Project => Boolean(project))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.name.localeCompare(b.name));

  // Unique URLs: if two entries collide, the later one gets a numeric suffix.
  const seen = new Set<string>();
  cache = projects.map((project, i) => {
    let slug = projectSlug(project);
    for (let n = 2; seen.has(slug); n++) slug = `${projectSlug(project)}-${n}`;
    seen.add(slug);
    return { ...project, slug, no: String(i + 1).padStart(2, "0") };
  });
  return cache;
}
