import SmoothScroll from "@/components/SmoothScroll";
import Loader from "@/components/Loader";
import Nav from "@/components/Nav";
import Feed from "@/components/Feed";
import Careers from "@/components/Careers";
import Contact from "@/components/Contact";
import { getProjects } from "@/lib/project-data";

export default async function Home() {
  const projects = await getProjects();
  return (
    <>
      <Loader />
      <Nav />
      <SmoothScroll>
        <main id="top">
          <Feed projects={projects} />
          <Careers />
          <Contact />
        </main>
      </SmoothScroll>
    </>
  );
}
