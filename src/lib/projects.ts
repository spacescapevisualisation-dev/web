export type Project = {
  slug?: string;
  order?: number;
  no: string;
  name: string;
  location: string;
  year: string;
  category: string;
  /** the architect / design studio who authored the design — always credited */
  architect: string;
  developer?: string;
  typology: string;
  discipline?: "Exterior" | "Interior";
  status: string;
  size: string;
  desc: string;
  desc2: string;
  featured: boolean;
  /** placeholder render gradient keys (s1..s6) until real imagery is dropped in */
  scene: string;
  sceneB: string;
  /** image paths (under /public); the scene gradients remain as graceful fallbacks */
  mainImageUrl?: string;
  secondaryImageUrl?: string;
  tertiaryImageUrl?: string;
  quaternaryImageUrl?: string;
  additionalImageUrls?: string[];
  imageAlt?: string;
  align: "left" | "right" | "full";
  /** grid tile size for the works grid */
  span: "tall" | "wide" | "std";
};

export const projectSlug = (project: Pick<Project, "slug" | "name">) =>
  project.slug || project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
