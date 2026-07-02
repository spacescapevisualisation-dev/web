"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Contact() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".ct-title .word", {
        yPercent: 120,
        opacity: 0,
        filter: "blur(10px)",
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.07,
        scrollTrigger: { trigger: ".ct-title", start: "top 80%" },
      });
      gsap.from(".ct-item", {
        y: 26,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: ".ct-grid", start: "top 85%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const title = "Let's make the first image.".split(" ");

  return (
    <section id="contact" ref={root} className="ct">
      <span className="mono ct-kick">Contact</span>

      <h2 className="ct-title display">
        {title.map((w, i) => (
          <span key={i} className="word-mask">
            <span className="word">{w}</span>
            {i < title.length - 1 ? " " : ""}
          </span>
        ))}
      </h2>

      <div className="ct-grid">
        <a className="ct-item" data-cursor href="mailto:studio@spacescape.com">
          <span className="mono">Email</span>
          <b>studio@spacescape.com</b>
        </a>
        <a
          className="ct-item"
          data-cursor
          href="https://instagram.com/spacescape.viz"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="mono">Instagram</span>
          <b>@spacescape.viz</b>
        </a>
        <div className="ct-item">
          <span className="mono">Location</span>
          <b>Pune · India</b>
        </div>
      </div>

      <a className="ct-cta" data-cursor data-cursor-label="Send" href="mailto:studio@spacescape.com">
        <span>Start an Inquiry</span>
        <i />
      </a>

      <footer className="ct-foot">
        <span className="mono">Space Scape Visualisations</span>
        <span className="mono ct-foot-mid">Architectural Imagery · Est 2019</span>
        <span className="mono">© {new Date().getFullYear()}</span>
      </footer>

      <style>{`
        .ct { max-width: 1500px; margin: 0 auto; padding: clamp(120px, 22vh, 260px) clamp(18px, 4vw, 56px) 0; }
        .ct-kick { font-size: 10px; color: var(--bronze); }
        .ct-title { font-size: clamp(44px, 9.5vw, 150px); margin-top: 22px; color: var(--ink); line-height: 0.94; }
        .ct-grid { display: flex; flex-wrap: wrap; gap: clamp(28px, 6vw, 96px); margin-top: clamp(50px, 9vh, 96px); }
        .ct-item { display: flex; flex-direction: column; gap: 10px; }
        .ct-item span { font-size: 9px; color: var(--mut); }
        .ct-item b { font-weight: 400; font-size: clamp(18px, 2vw, 27px); color: var(--ink); transition: color .3s; }
        a.ct-item:hover b { color: var(--bronze); }
        .ct-cta { display: inline-flex; align-items: center; gap: 14px; margin-top: clamp(54px, 9vh, 90px); color: var(--bronze); font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; }
        .ct-cta i { width: 60px; height: 1px; background: var(--bronze); transition: width .5s cubic-bezier(.16,1,.3,1); }
        .ct-cta:hover i { width: 100px; }
        .ct-foot { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-top: clamp(90px, 16vh, 180px); padding: 26px 0; border-top: 1px solid var(--line); }
        .ct-foot span { font-size: 9px; color: var(--mut); }
        .ct-foot-mid { color: var(--faint); }
      `}</style>
    </section>
  );
}
