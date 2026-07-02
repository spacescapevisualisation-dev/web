"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * big.dk-style transition: full black screen, white mark centred,
 * then the whole curtain releases upward to reveal the feed.
 */
export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    // play the intro once per browser session; skip it on refresh / return
    if (sessionStorage.getItem("ss-intro-seen")) {
      setGone(true);
      return;
    }
    sessionStorage.setItem("ss-intro-seen", "1");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set(root.current, { autoAlpha: 0 });
        setGone(true);
        return;
      }
      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => setGone(true),
      });
      tl.from(".ld-mark span", { yPercent: 130, duration: 0.85, stagger: 0.045, ease: "power4.out" })
        .to(".ld-sub", { opacity: 1, duration: 0.4 }, "-=0.3")
        .to(".ld-mark", { scale: 0.6, duration: 0.8, ease: "power3.inOut" }, "+=0.5")
        .to(".ld-sub", { opacity: 0, duration: 0.3 }, "<")
        .to(root.current, { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, "-=0.35");
    }, root);

    return () => ctx.revert();
  }, []);

  if (gone) return null;

  return (
    <div ref={root} className="ld">
      <div className="ld-inner">
        <h1 className="ld-mark display" aria-label="Space Scape">
          <span>S</span><span>P</span><span>A</span><span>C</span><span>E</span>
          <span className="ld-gap">&nbsp;</span>
          <span>S</span><span>C</span><span>A</span><span>P</span><span>E</span>
        </h1>
        <p className="ld-sub mono">Architectural Visualisation</p>
      </div>

      <style>{`
        .ld { position: fixed; inset: 0; z-index: 11000; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .ld-inner { position: relative; text-align: center; }
        .ld-mark { font-size: clamp(30px, 6vw, 72px); color: #fff; display: flex; justify-content: center; overflow: hidden; }
        .ld-mark span { display: inline-block; }
        .ld-gap { width: .4em; }
        .ld-sub { margin-top: 18px; font-size: 10px; color: rgba(255,255,255,0.55); opacity: 0; }
      `}</style>
    </div>
  );
}
