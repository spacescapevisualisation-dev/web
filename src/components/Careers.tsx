"use client";

import { site, careersHref } from "@/lib/site";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const openings = site.openings;

export default function Careers() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".careers-title .word", {
        yPercent: 120,
        opacity: 0,
        filter: "blur(10px)",
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.07,
        scrollTrigger: { trigger: ".careers-title", start: "top 80%" },
      });
      gsap.from(".careers-card", {
        y: 24,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: ".careers-grid", start: "top 85%" },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section id="careers" ref={root} className="careers">
      <span className="mono careers-kick">Careers</span>
      <h2 className="careers-title display">
        <span className="word-mask">
          <span className="word">Join</span>
        </span>
        <span className="careers-space" />
        <span className="word-mask">
          <span className="word">the</span>
        </span>
        <span className="careers-space" />
        <span className="word-mask">
          <span className="word">studio</span>
        </span>
      </h2>

      <div className="careers-grid">
        {openings.map((opening) => (
          <article key={opening.title} className="careers-card">
            <p className="mono careers-type">{opening.type}</p>
            <h3 className="careers-name">{opening.title}</h3>
            <p className="careers-blurb">{opening.blurb}</p>
          </article>
        ))}
      </div>

      <a className="careers-cta" href={careersHref}>
        {site.careersButton}
      </a>

      <style>{`
        .careers { max-width: 1500px; margin: 0 auto; padding: clamp(100px, 18vh, 220px) clamp(18px, 4vw, 56px) 0; }
        .careers-kick { font-size: 10px; color: var(--bronze); }
        .careers-title { font-size: clamp(40px, 7.8vw, 92px); margin-top: 20px; color: var(--ink); line-height: 0.94; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.12em; }
        .careers-space { display: inline-block; width: 0.12em; }
        .careers-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(20px, 3vw, 28px); margin-top: clamp(42px, 7vh, 72px); }
        .careers-card { border: 1px solid var(--line); padding: clamp(22px, 2.4vw, 28px); background: var(--bg-2); display: flex; flex-direction: column; gap: 12px; }
        .careers-cta { display: inline-flex; margin-top: clamp(24px, 3vh, 36px); font-family: var(--font-display); font-size: clamp(18px, 2.2vw, 24px); color: var(--ink); text-decoration: underline; text-underline-offset: 0.22em; }
        .careers-type { font-size: 8.5px; color: var(--mut); }
        .careers-name { font-family: var(--font-display); font-size: clamp(20px, 2vw, 24px); color: var(--ink); line-height: 1.1; }
        .careers-blurb { font-size: clamp(13px, 1.2vw, 16px); line-height: 1.6; color: var(--ink); }

        @media (max-width: 900px) {
          .careers-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
