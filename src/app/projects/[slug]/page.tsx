import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projectSlug } from "@/lib/projects";
import { getProjects } from "@/lib/project-data";
import "./project.css";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getProjects()).map((project) => ({ slug: projectSlug(project) }));
}

type ProjectPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const projects = await getProjects();
  const { slug } = await params;
  const project = projects.find((item) => projectSlug(item) === slug);
  return project ? { title: project.name, description: project.desc } : {};
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const projects = await getProjects();
  const { slug } = await params;
  const project = projects.find((item) => projectSlug(item) === slug);
  if (!project) notFound();

  const index = projects.indexOf(project);
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  return (
    <>
      <main className="project-page" id="work">
        <header className="project-nav">
          <Link href="/#work" className="mono" data-cursor data-cursor-label="Back">← All projects</Link>
          <span className="mono">Space Scape</span>
        </header>

        <section className="project-hero">
          <div className={`scene ${project.scene}`} style={project.mainImageUrl ? { backgroundImage: `url("${project.mainImageUrl}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} aria-hidden />
          <span className="project-number mono">{project.no} / {String(projects.length).padStart(2, "0")}</span>
          <div className="project-title">
            <p className="mono">{project.category}</p>
            <h1>{project.name}</h1>
            <p>{project.location}</p>
          </div>
        </section>

        <section className="project-intro">
          <div className="project-summary">
            <p className="project-lede">{project.desc}</p>
            <dl className="project-credits">
              <div><dt className="mono">Architect</dt><dd>{project.architect}</dd></div>
              {project.developer && <div><dt className="mono">Developer</dt><dd>{project.developer}</dd></div>}
            </dl>
          </div>
          <dl className="project-facts">
            <div><dt className="mono">Visualisation</dt><dd>Space Scape</dd></div>
            <div><dt className="mono">Year</dt><dd>{project.year}</dd></div>
            <div><dt className="mono">Typology</dt><dd>{project.typology}</dd></div>
            <div><dt className="mono">Scale</dt><dd>{project.size}</dd></div>
            <div><dt className="mono">Status</dt><dd>{project.status}</dd></div>
          </dl>
        </section>

        <section className="project-image-wide" aria-label={`Second view of ${project.name}`}>
          <div className={`scene ${project.sceneB}`} style={project.secondaryImageUrl ? { backgroundImage: `url("${project.secondaryImageUrl}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} aria-hidden />
        </section>

        {project.tertiaryImageUrl && <section className="project-image-wide" aria-label={`Third view of ${project.name}`}>
          <div className={`scene ${project.scene}`} style={{ backgroundImage: `url("${project.tertiaryImageUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }} aria-hidden />
        </section>}

        {project.quaternaryImageUrl && <section className="project-image-wide" aria-label={`Fourth view of ${project.name}`}>
          <div className={`scene ${project.sceneB}`} style={{ backgroundImage: `url("${project.quaternaryImageUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }} aria-hidden />
        </section>}

        {project.additionalImageUrls?.map((imageUrl, imageIndex) => (
          <section className="project-image-wide" aria-label={`Gallery view ${imageIndex + 5} of ${project.name}`} key={imageUrl}>
            <div className={`scene ${project.scene}`} style={{ backgroundImage: `url("${imageUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }} aria-hidden />
          </section>
        ))}

        <section className="project-story">
          <span className="mono">The project</span>
          <p>{project.desc2}</p>
        </section>

        <nav className="project-pager" aria-label="Other projects">
          <Link href={`/projects/${projectSlug(previous)}`} data-cursor data-cursor-label="Previous">
            <span className="mono">← Previous</span><strong>{previous.name}</strong>
          </Link>
          <Link href={`/projects/${projectSlug(next)}`} data-cursor data-cursor-label="Next">
            <span className="mono">Next →</span><strong>{next.name}</strong>
          </Link>
        </nav>
      </main>
    </>
  );
}
