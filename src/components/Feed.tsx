"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { PROJECTS, projectSlug, type Project } from "@/lib/projects";

gsap.registerPlugin(ScrollTrigger);

type LenisLike = {
  velocity?: number;
  scrollTo: (t: HTMLElement | number, o?: object) => void;
};
const getLenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;

/* tiny original pictogram per project — the black tile beside each caption */
function Pictogram({ k }: { k: string }) {
  const glyph: Record<string, React.ReactNode> = {
    s1: <rect x="13" y="4" width="6" height="24" fill="#fff" />, // tower
    s2: <rect x="5" y="20" width="22" height="3" fill="#fff" />, // pavilion slab
    s3: <path d="M4 20h20v3H10v5H4z" fill="#fff" />, // cantilever
    s4: <path d="M6 26v-8a10 10 0 0 1 20 0v8h-4v-8a6 6 0 0 0-12 0v8z" fill="#fff" />, // vault
    s5: <path d="M6 26h20v-3H10v-4h12v-3H14v-4h8v-3H6z" fill="#fff" />, // terraces
    s6: <circle cx="16" cy="18" r="8" fill="none" stroke="#fff" strokeWidth="3" />, // dome
  };
  return (
    <span className="p-ico" aria-hidden>
      <svg viewBox="0 0 32 32">{glyph[k] ?? glyph.s1}</svg>
    </span>
  );
}

/**
 * One project row, big.dk style: closed it is just the centred cover;
 * clicking unfolds the row in place — height eases open over .78s and the
 * strip becomes a horizontal drag/wheel scroller through everything.
 */
function ProjectRow({
  p,
  open,
  onToggle,
}: {
  p: Project;
  open: boolean;
  onToggle: () => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, moved: false, startX: 0, startLeft: 0 });
  const wheelTarget = useRef(0);
  const wheelRaf = useRef(0);

  /* While open, vertical wheel input travels through the project sideways.
     At either horizontal boundary the event is released, handing control
     straight back to normal vertical page scrolling. */
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    if (!open) {
      cancelAnimationFrame(wheelRaf.current);
      wheelTarget.current = 0;
      el.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    wheelTarget.current = el.scrollLeft;
    const animateWheel = () => {
      const distance = wheelTarget.current - el.scrollLeft;
      if (Math.abs(distance) < 0.5) {
        el.scrollLeft = wheelTarget.current;
        wheelRaf.current = 0;
        return;
      }
      el.scrollLeft += distance * 0.22;
      wheelRaf.current = requestAnimationFrame(animateWheel);
    };
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      const canMoveForward = event.deltaY > 0 && wheelTarget.current < max - 1;
      const canMoveBack = event.deltaY < 0 && wheelTarget.current > 1;
      if (!canMoveForward && !canMoveBack) return;

      wheelTarget.current = Math.max(0, Math.min(max, wheelTarget.current + event.deltaY * 1.9));
      if (!wheelRaf.current) wheelRaf.current = requestAnimationFrame(animateWheel);
      event.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(wheelRaf.current);
      wheelRaf.current = 0;
      el.removeEventListener("wheel", onWheel);
    };
  }, [open]);

  /* On touch screens the animated hint teaches the horizontal gesture; drop
     it after the visitor has moved through the strip. */
  useEffect(() => {
    const el = strip.current;
    if (!el || !open) return;
    const item = el.closest(".p-item");

    const knows = () => {
      try {
        return !!sessionStorage.getItem("ss-swipe-known");
      } catch {
        return false;
      }
    };
    const learn = () => {
      try {
        sessionStorage.setItem("ss-swipe-known", "1");
      } catch {
        /* fine — they'll just see the hint again next session */
      }
    };

    let nudging = false;
    let rest = 0; // where the auto-slide parks the strip
    const onScroll = () => {
      if (!nudging && Math.abs(el.scrollLeft - rest) > 36) {
        item?.classList.add("was-scrolled");
        learn();
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    if (knows()) item?.classList.add("was-scrolled");

    const touch = window.matchMedia("(hover: none)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stopNudge = () => {
      nudging = false;
      cancelAnimationFrame(raf);
    };
    if (touch) {
      // once the unfold settles, ease the strip a little way in and leave it
      // there — the cut-off panel edge is the invitation to keep going
      const SLIDE = 0;
      timer = setTimeout(() => {
        if (el.scrollLeft > 4) return; // already exploring on their own
        rest = SLIDE;
        nudging = true;
        if (reduce) {
          el.scrollLeft = SLIDE;
          requestAnimationFrame(() => {
            nudging = false;
          });
          return;
        }
        const t0 = performance.now();
        const tick = (now: number) => {
          if (!nudging) return;
          const p = Math.min(1, (now - t0) / 800);
          el.scrollLeft = SLIDE * (1 - Math.pow(1 - p, 3)); // ease-out, no return
          if (p >= 1) {
            nudging = false;
            return;
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }, 950);
      el.addEventListener("pointerdown", stopNudge, { passive: true });
      el.addEventListener("touchstart", stopNudge, { passive: true });
    }

    return () => {
      clearTimeout(timer);
      stopNudge();
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerdown", stopNudge);
      el.removeEventListener("touchstart", stopNudge);
    };
  }, [open]);

  const onDown = (e: React.PointerEvent) => {
    const el = strip.current;
    if (!open || e.pointerType !== "mouse" || !el) return;
    // Links and buttons keep their native click behavior instead of starting
    // the strip drag gesture (notably the "View full project" CTA).
    if ((e.target as HTMLElement).closest("a, button")) return;
    cancelAnimationFrame(wheelRaf.current);
    wheelRaf.current = 0;
    wheelTarget.current = el.scrollLeft;
    drag.current = { active: true, moved: false, startX: e.clientX, startLeft: el.scrollLeft };
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already released — drag still works, just uncaptured */
    }
    el.classList.add("grabbing");
  };
  const onMove = (e: React.PointerEvent) => {
    const el = strip.current;
    if (!drag.current.active || !el) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 6) drag.current.moved = true;
    el.scrollLeft = drag.current.startLeft - dx;
  };
  const onUp = () => {
    drag.current.active = false;
    strip.current?.classList.remove("grabbing");
  };

  return (
    <article id={`proj-${p.no}`} className={`p-item project-${projectSlug(p)} ar-${p.span} ${open ? "open" : ""}`}>
      <div
        className="p-strip"
        ref={strip}
        {...(open ? { "data-lenis-prevent": "" } : {})}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onPointerCancel={onUp}
      >
        {/* lead: cover + caption, the only thing visible when closed */}
        <div className="p-lead">
          <button
            className="p-cover"
            data-cursor
            data-cursor-label={open ? "Close" : "Open"}
            aria-expanded={open}
            aria-label={`${open ? "Collapse" : "Expand"} ${p.name} by ${p.architect}`}
            onClick={() => {
              if (drag.current.moved) return; // it was a drag, not a click
              onToggle();
            }}
          >
            <div
              className={`scene ${p.scene}`}
              style={p.mainImageUrl ? { backgroundImage: `url("${p.mainImageUrl}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
              role="img"
              aria-label={p.imageAlt || p.name}
            />
            <span className="p-no mono">{p.no}</span>
          </button>
          <div className="p-cap">
            <Pictogram k={p.scene} />
            <div className="p-cap-txt">
              <h3 className="p-name">{p.name}</h3>
              <p className="p-loc">{p.location}</p>
            </div>
          </div>
        </div>

        {/* everything else, revealed by the unfold */}
        <div className="p-cell c-info">
          <div className="cell-in">
            <span className="mono c-kick">{p.category}</span>
            <p className="c-lede">{p.desc}</p>
            <dl className="c-credits">
              <div><dt className="mono">Architect</dt><dd>{p.architect}</dd></div>
              {p.developer && <div><dt className="mono">Developer</dt><dd>{p.developer}</dd></div>}
            </dl>
            <dl className="c-dl">
              <div><dt className="mono">Visualisation</dt><dd>Space Scape</dd></div>
              <div><dt className="mono">Year</dt><dd>{p.year}</dd></div>
              <div><dt className="mono">Typology</dt><dd>{p.typology}</dd></div>
              <div><dt className="mono">Scale</dt><dd>{p.size}</dd></div>
              <div><dt className="mono">Status</dt><dd>{p.status}</dd></div>
            </dl>
          </div>
        </div>

        <div className="p-cell c-photo"><div
          className={`scene ${p.sceneB}`}
          style={p.secondaryImageUrl ? { backgroundImage: `url("${p.secondaryImageUrl}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
          role="img"
          aria-label={`Additional view of ${p.name}`}
        /></div>

        {p.tertiaryImageUrl && <div className="p-cell c-photo c-photo-tertiary"><div
          className={`scene ${p.scene}`}
          style={{ backgroundImage: `url("${p.tertiaryImageUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }}
          role="img"
          aria-label={`Amenities and community experience at ${p.name}`}
        /></div>}

        {p.quaternaryImageUrl && <div className="p-cell c-photo c-photo-quaternary"><div
          className={`scene ${p.sceneB}`}
          style={{ backgroundImage: `url("${p.quaternaryImageUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }}
          role="img"
          aria-label={`Additional interior view of ${p.name}`}
        /></div>}

        {p.additionalImageUrls?.map((imageUrl, imageIndex) => (
          <div className="p-cell c-photo c-photo-additional" key={imageUrl}><div
            className={`scene ${p.scene}`}
            style={{ backgroundImage: `url("${imageUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }}
            role="img"
            aria-label={`Gallery view ${imageIndex + 5} of ${p.name}`}
          /></div>
        ))}

        <div className="p-cell c-text">
          <div className="cell-in">
            <span className="mono c-kick">Description</span>
            <p className="c-body">{p.desc2}</p>
          </div>
        </div>

        <div className="p-cell c-end">
          <Link
            className="c-project mono"
            href={`/projects/${projectSlug(p)}`}
            data-cursor
            data-cursor-label="View"
          >
            View full project <span aria-hidden>→</span>
          </Link>
          <button className="c-close mono" data-cursor onClick={onToggle}>Close ✕</button>
        </div>
      </div>
      <span className="swipe-hint mono" aria-hidden>Swipe →</span>
    </article>
  );
}

export default function Feed({ projects = PROJECTS }: { projects?: Project[] }) {
  const root = useRef<HTMLDivElement>(null);
  const scaler = useRef<HTMLDivElement>(null);
  const [openNo, setOpenNo] = useState<string | null>(null);
  const [cat, setCat] = useState("All");
  const [index, setIndex] = useState(false); // the tab's "everything" panel
  const [fopen, setFopen] = useState(false); // mobile filter panel (right slide-in)
  const fpanelRef = useRef<HTMLElement>(null);
  const fbtnRef = useRef<HTMLButtonElement>(null);
  const isProjectOpen = useRef(false);
  const wheelImpulse = useRef(0);

  useEffect(() => {
    isProjectOpen.current = openNo !== null;
  }, [openNo]);

  /* Lenis deliberately ignores wheel events inside an expanded horizontal
     strip. Keep a small independent impulse so those same gestures still
     drive the gallery's velocity-scale response. */
  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      wheelImpulse.current = Math.min(14, Math.max(wheelImpulse.current, Math.abs(event.deltaY) * 0.025));
    };
    window.addEventListener("wheel", onWheel, { passive: true, capture: true });
    return () => window.removeEventListener("wheel", onWheel, { capture: true });
  }, []);

  // filter panel open: move focus in; on close, hand it back to the funnel
  useEffect(() => {
    if (!fopen) return;
    const btn = fbtnRef.current;
    fpanelRef.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
    return () => btn?.focus({ preventScroll: true });
  }, [fopen]);

  const cats = ["All", "Exterior", "Interior"];
  const shown = projects.filter((p) => cat === "All" || (p.discipline || "Exterior") === cat);
  const listed = cat === "All" ? projects : shown;

  const getStickyOffset = () => {
    const bar = document.querySelector(".catbar") as HTMLElement | null;
    const barHeight = bar?.getBoundingClientRect().height ?? 0;
    const mobileStrip = window.innerWidth <= 860 ? 46 : 0;
    return Math.ceil(Math.max(barHeight, mobileStrip) + 18);
  };

  const scrollProjectIntoView = useCallback((projectNo: string) => {
    const goTo = () => {
      const el = document.getElementById(`proj-${projectNo}`);
      if (!el || !el.classList.contains("open")) return;
      const cover = el.querySelector<HTMLElement>(".p-cover");
      if (!cover) return;
      const rect = cover.getBoundingClientRect();
      const safeTop = getStickyOffset();
      const safeBottom = window.innerHeight - 24;
      let correction = 0;

      // Keep the user's current framing whenever the cover is already visible.
      // Only move by the smallest amount required to clear the fixed header or
      // bring the lower edge back into view after the height animation.
      if (rect.top < safeTop) correction = rect.top - safeTop;
      else if (rect.bottom > safeBottom) correction = rect.bottom - safeBottom;
      if (Math.abs(correction) < 3) return;

      const top = window.scrollY + correction;
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(top, { duration: 1.15 });
      } else {
        window.scrollTo({ top, behavior: "smooth" });
      }
    };

    // The cover and scaler finish opening in 780ms. Positioning before that
    // measures an in-between size and intermittently clips the project.
    window.setTimeout(() => window.requestAnimationFrame(goTo), 820);
  }, []);

  /* ------- big.dk motion scroll: the grid breathes out with velocity ------- */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let scale = window.innerWidth <= 720 ? 1 : window.innerWidth <= 1024 ? 0.86 : 0.76;
    const tick = () => {
      const el = scaler.current;
      if (!el) return;
      const v = Math.max(Math.abs(getLenis()?.velocity ?? 0), wheelImpulse.current);
      wheelImpulse.current *= 0.97;
      const rest = window.innerWidth <= 720 ? 1 : window.innerWidth <= 1024 ? 0.86 : 0.76;
      const compression = window.innerWidth <= 720
        ? 0
        : isProjectOpen.current
          ? Math.min(v * 0.0018, 0.025)
          : Math.min(v * 0.0068, 0.095);
      const target = (isProjectOpen.current ? 1 : rest) - compression;
      // Compress quickly with the wheel, then breathe back more slowly.
      const ease = target < scale ? 0.17 : 0.085;
      scale += (target - scale) * ease;

      const originY = window.scrollY + window.innerHeight * 0.5 - el.offsetTop;
      el.style.transformOrigin = `50% ${originY}px`;
      el.style.transform = `scale(${scale})`;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  /* keep scroll maths honest after unfolds, and close on Escape */
  useEffect(() => {
    const t = setTimeout(() => ScrollTrigger.refresh(), 850);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenNo(null);
      setFopen(false);
      setIndex(false);
    };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, [openNo, cat]);

  const jumpTo = useCallback((p: Project) => {
    setIndex(false);
    setOpenNo(p.no);
    scrollProjectIntoView(p.no);
  }, [scrollProjectIntoView]);

  const onTab = (c: string) => {
    if (c === cat) {
      setIndex((v) => !v); // same tab again: toggle the full index
    } else {
      setCat(c);
      setIndex(true);
      setOpenNo(null);
    }
  };

  return (
    <section id="work" ref={root} className="feed">
      <h1 className="sr-only">Space Scape — Architectural Visualisation Projects</h1>

      {/* ---- category tabs: a tab opens everything ---- */}
      <div className="catbar" role="navigation" aria-label="Project categories">
        {cats.map((c) => (
          <button
            key={c}
            className={`cat mono ${c === cat ? "on" : ""}`}
            data-cursor
            aria-current={c === cat || undefined}
            aria-expanded={c === cat && index}
            onClick={() => onTab(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className={`cat-index ${index ? "open" : ""}`} aria-hidden={!index}>
        <div className="ci-in">
          {listed.map((p, i) => (
            <button
              key={p.no}
              className="ci-item"
              data-cursor
              style={{ transitionDelay: index ? `${0.05 * i + 0.08}s` : "0s" }}
              tabIndex={index ? 0 : -1}
              onClick={() => {
                if (cat !== "All" && (p.discipline || "Exterior") !== cat) setCat("All");
                jumpTo(p);
              }}
            >
              <span className="ci-name display">{p.name}</span>
              <span className="ci-meta mono">{p.location} · {p.year}</span>
            </button>
          ))}
        </div>
      </div>
      {index && <button className="ci-veil" aria-label="Close index" onClick={() => setIndex(false)} />}

      {/* ---- mobile chrome: funnel icon top-right → categories slide in from the right ---- */}
      <button
        ref={fbtnRef}
        className="fbtn"
        data-cursor
        aria-expanded={fopen}
        aria-label={fopen ? "Close filters" : "Open filters"}
        onClick={() => setFopen((v) => !v)}
      >
        {fopen ? <span className="fx">✕</span> : <><i /><i /><i /><i /></>}
      </button>

      <aside ref={fpanelRef} className={`fpanel ${fopen ? "open" : ""}`} aria-hidden={!fopen} aria-label="Filter projects">
        <span className="fp-kick mono">Categories</span>
        {cats.map((c) => (
          <button
            key={c}
            className={`fp-cat mono ${c === cat ? "on" : ""}`}
            tabIndex={fopen ? 0 : -1}
            onClick={() => {
              setCat(c);
              setOpenNo(null);
              setIndex(false);
            }}
          >
            {c}
          </button>
        ))}
        <span className="fp-kick mono fp-kick2">Projects</span>
        {shown.map((p) => (
          <button
            key={p.no}
            className="fp-proj"
            tabIndex={fopen ? 0 : -1}
            onClick={() => {
              setFopen(false);
              jumpTo(p);
            }}
          >
            {p.name}
          </button>
        ))}
      </aside>
      {fopen && <button className="fp-veil" aria-label="Close filters" onClick={() => setFopen(false)} />}

      {/* ---- the feed, clipped like big.dk's projects-container ---- */}
      <div className="projects-container">
        <div className="projects-scaler" ref={scaler}>
          {shown.map((p) => (
            <ProjectRow
              key={p.no}
              p={p}
              open={openNo === p.no}
              onToggle={() => {
                const opening = openNo !== p.no;
                setOpenNo(opening ? p.no : null);
                if (opening) {
                  scrollProjectIntoView(p.no);
                }
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        .feed { padding-top: clamp(88px, 12vh, 128px); }

        /* ---------- category tabs ---------- */
        .catbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 6500;
          display: flex; justify-content: center; align-items: center;
          gap: clamp(4px, 1vw, 10px);
          padding: 15px clamp(12px, 3vw, 24px);
          background: rgba(255,255,255,0.94); backdrop-filter: blur(6px);
          overflow-x: auto; scrollbar-width: none;
        }
        .catbar::-webkit-scrollbar { display: none; }
        .cat {
          flex: none; background: none; border: none; padding: 6px 12px;
          font-size: 10px; color: var(--mut); transition: color .3s;
        }
        .cat:hover { color: var(--ink); }
        .cat.on { color: var(--ink); text-decoration: underline; text-underline-offset: 5px; }

        /* ---------- mobile chrome: white strip, funnel filter, right panel ---------- */
        .fbtn { display: none; }
        .fpanel {
          position: fixed; top: 0; right: 0; bottom: 0; z-index: 6550;
          width: min(70vw, 250px); background: #fff;
          border-left: 1px solid var(--line-soft);
          padding: 58px 24px 30px; overflow-y: auto;
          display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
          transform: translateX(100%); opacity: 0;
          transition: transform .55s cubic-bezier(.45,0,.55,1), opacity .4s ease;
        }
        .fpanel.open { transform: none; opacity: 1; }
        .fp-kick { font-size: 8.5px; color: var(--faint); margin-bottom: 8px; }
        .fp-kick2 { margin-top: 28px; }
        .fp-cat { min-height: 44px; display: flex; align-items: center; background: none; border: none; padding: 8px 0; font-size: 10px; color: var(--mut); }
        .fp-cat.on { color: var(--ink); text-decoration: underline; text-underline-offset: 4px; }
        .fp-proj {
          min-height: 44px; display: flex; align-items: center;
          background: none; border: none; text-align: left; padding: 8px 0;
          font-family: var(--font-display); font-size: 16px; letter-spacing: -0.01em; color: var(--ink);
        }
        .fp-veil { position: fixed; inset: 0; z-index: 6500; background: rgba(0,0,0,0.1); border: none; }
        @media (min-width: 861px) { .fpanel, .fp-veil { display: none; } }

        @media (max-width: 860px) {
          .catbar { display: none; }
          /* white strip under the fixed chrome, like big.dk's phone header */
          .feed::before {
            content: ""; position: fixed; top: 0; left: 0; right: 0; height: 46px;
            background: rgba(255,255,255,0.94); backdrop-filter: blur(6px); z-index: 6450;
          }
          .fbtn {
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
            position: fixed; top: 0; right: 96px; z-index: 6600;
            min-height: 46px; padding: 14px 20px; background: none; border: none;
          }
          .fbtn i { display: block; height: 2px; background: #000; }
          .fbtn i:nth-child(1) { width: 15px; }
          .fbtn i:nth-child(2) { width: 11px; }
          .fbtn i:nth-child(3) { width: 8px; }
          .fbtn i:nth-child(4) { width: 5px; }
          .fx { font-size: 13px; line-height: 1; color: #000; }
        }

        /* the tab's full index — everything, listed */
        .cat-index {
          position: fixed; top: 0; left: 0; right: 0; z-index: 6400;
          background: rgba(255,255,255,0.98); backdrop-filter: blur(10px);
          padding: 78px clamp(18px, 5vw, 72px) 34px;
          max-height: 80vh; overflow-y: auto;
          clip-path: inset(0 0 100% 0);
          transition: clip-path .7s cubic-bezier(.45,0,.55,1);
          border-bottom: 1px solid var(--line-soft);
        }
        .cat-index.open { clip-path: inset(0 0 0 0); }
        .ci-in { display: flex; flex-direction: column; }
        .ci-item {
          display: flex; align-items: baseline; justify-content: space-between; gap: 18px;
          background: none; border: none; text-align: left; padding: 10px 0;
          border-top: 1px solid var(--line-soft);
          opacity: 0; transform: translateY(14px);
          transition: opacity .5s ease, transform .6s cubic-bezier(.16,1,.3,1);
        }
        .cat-index.open .ci-item { opacity: 1; transform: none; }
        .ci-name { font-size: clamp(22px, 4vw, 44px); color: var(--ink); transition: opacity .3s; }
        .ci-item:hover .ci-name { opacity: .45; }
        .ci-meta { font-size: 9px; color: var(--mut); white-space: nowrap; }
        .ci-veil { position: fixed; inset: 0; z-index: 6300; background: transparent; border: none; }

        /* ---------- the feed ---------- */
        .projects-container { overflow-x: hidden; }
        .projects-scaler {
          transform: scale(.76); transform-origin: 50% 0;
          will-change: transform;
          backface-visibility: hidden;
        }

        .p-item {
          /* closed / open cell heights — the whole unfold is this one variable */
          scroll-margin-top: clamp(88px, 10vh, 120px);
          --ph: clamp(220px, 40vh, 470px);
          --ch: var(--ph);
          --gap: clamp(26px, 5vw, 84px);
          position: relative;
          margin-bottom: clamp(30px, 6vh, 64px);
        }
        .p-item.open { --ph: clamp(340px, 70vh, 820px); }
        /* covers come in two shapes only: square, or a small 4:3 rectangle */
        .ar-std  { --ar: 1; }
        .ar-wide { --ar: 1.3333; }
        .ar-tall { --ar: 1; }
        .p-item { --cover-w: calc(var(--ch) * var(--ar)); }

        .p-strip {
          display: flex; align-items: flex-start;
          overflow-x: hidden; overflow-y: hidden;
          padding-left: max(5vw, calc(50% - var(--cover-w) / 2));
          padding-right: 6vw;
          scrollbar-width: none;
          transition: padding-left .78s cubic-bezier(.45,0,.55,1);
        }
        .p-strip::-webkit-scrollbar { display: none; }
        .p-item.open .p-strip { overflow-x: auto; cursor: default; touch-action: pan-x pan-y; }
        .p-item.open .p-strip.grabbing { cursor: default; }

        .p-lead { flex: none; display: flex; flex-direction: column; }
        .p-cover {
          position: relative; display: block; border: none; padding: 0; background: #0b0a09;
          width: var(--cover-w); height: var(--ch); overflow: hidden;
          transition: width .78s cubic-bezier(.45,0,.55,1), height .78s cubic-bezier(.45,0,.55,1);
          will-change: width, height;
          transform: translateZ(0); backface-visibility: hidden;
        }
        .p-cover .scene { inset: -1px; transition: scale 1.2s cubic-bezier(.16,1,.3,1); }
        @media (hover: hover) { .p-item:not(.open) .p-cover:hover .scene { scale: 1.04; } }
        .p-no { position: absolute; top: 14px; left: 16px; z-index: 3; font-size: 9px; color: rgba(255,255,255,0.7); }

        /* desktop: pictogram above the text (big.dk md+); phones row them */
        .p-cap { display: flex; flex-direction: column; align-items: flex-start; margin-top: 18px; }
        .p-cap-txt { margin-top: 16px; }
        .p-ico { flex: none; width: clamp(30px, 3.4vh, 50px); height: clamp(30px, 3.4vh, 50px); background: #000; display: block; }
        .p-ico svg { width: 100%; height: 100%; display: block; }
        .p-name { font-family: var(--font-display); font-weight: 400; font-size: clamp(15px, 1.6vw, 19px); line-height: 1.1; color: var(--ink); letter-spacing: -0.01em; }
        .p-loc { margin-top: 5px; font-size: clamp(10px, 1vw, 14px); color: var(--mut); text-transform: uppercase; letter-spacing: 0.06em; }

        /* panels: collapsed to nothing until the row opens */
        .p-cell {
          flex: none; position: relative; height: var(--ch); overflow: hidden;
          width: 0; margin-left: 0; opacity: 0; background: var(--bg);
          transition: width .78s cubic-bezier(.45,0,.55,1), height .78s cubic-bezier(.45,0,.55,1),
                      margin-left .78s cubic-bezier(.45,0,.55,1), opacity .45s ease;
          will-change: width;
          transform: translateZ(0); backface-visibility: hidden;
        }
        .p-item.open .p-cell { margin-left: var(--gap); opacity: 1; transition-delay: 0s, 0s, 0s, .18s; }
        .p-item.open .c-info  { width: min(82vw, 360px); }
        .p-item.open .c-photo { width: calc(var(--ch) * 1.42); }
        .p-item.open .c-photo-tertiary, .p-item.open .c-photo-quaternary { width: var(--ch); }
        .p-item.open .c-photo-additional { width: calc(var(--ch) * 1.5); }
        .p-item.open.project-megaverse .c-photo-tertiary { width: calc(var(--ch) * .75); }
        .p-item.open.project-krushna-kunj .c-photo-tertiary { width: calc(var(--ch) * .75); }
        .p-item.open .c-text  { width: min(74vw, 370px); }
        .p-item.open .c-plan  { width: calc(var(--ch) * 1.3); }
        .p-item.open .c-end   { width: min(76vw, 280px); }

        .c-photo .scene { position: absolute; inset: -1px; }
        .c-plan .sp { position: absolute; inset: 0; }
        .c-photo .scene { transition: transform 1.3s cubic-bezier(.16,1,.3,1); transform: scale(1.15); }
        .p-item.open .c-photo .scene { transform: scale(1); }

        .cell-in { width: min(78vw, 360px); height: 100%; display: flex; flex-direction: column; padding: clamp(18px, 2.4vh, 28px); background: var(--bg-2); }
        .c-text .cell-in { width: min(74vw, 370px); justify-content: center; gap: 12px; }
        .c-kick { font-size: 8px; line-height: 1.4; color: var(--mut); }
        .c-lede { max-width: 30ch; font-size: clamp(14px, 1.25vw, 18px); line-height: 1.42; letter-spacing: -0.005em; color: var(--ink); margin: 12px 0 20px; }
        .c-credits { display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px; }
        .c-credits > div { display: grid; grid-template-columns: 86px minmax(0, 1fr); align-items: baseline; gap: 18px; }
        .c-credits dt { font-size: 7.5px; line-height: 1.4; color: var(--mut); }
        .c-credits dd { font-size: clamp(15px, 1.35vw, 18px); line-height: 1.2; letter-spacing: -.012em; color: var(--ink); overflow-wrap: anywhere; }
        .c-dl { display: flex; flex-direction: column; margin-top: auto; }
        .c-dl > div { display: grid; grid-template-columns: minmax(86px, .8fr) minmax(0, 1.2fr); align-items: baseline; gap: 18px; padding: 7px 0; border-top: 1px solid var(--line-soft); }
        .c-dl dt { font-size: 7.5px; line-height: 1.4; color: var(--mut); }
        .c-dl dd { font-family: var(--font-mono); font-size: 9px; line-height: 1.4; color: var(--ink); text-align: left; overflow-wrap: anywhere; }
        .c-body { max-width: 42ch; font-size: clamp(13px, 1.1vw, 15px); line-height: 1.58; color: var(--ink); }

        /* touch-only nudge chip: appears after the unfold, leaves once they swipe */
        .swipe-hint {
          position: absolute; right: 4vw; top: calc(var(--ch) - 44px); z-index: 4;
          background: #000; color: #fff; padding: 9px 13px; font-size: 8.5px;
          opacity: 0; transform: translateX(10px); pointer-events: none;
          transition: opacity .5s ease, transform .6s cubic-bezier(.16,1,.3,1);
        }
        .p-item.open .swipe-hint { opacity: 1; transform: none; transition-delay: .95s; }
        .p-item.open:not(.was-scrolled) .swipe-hint { animation: hint-nudge 1.7s ease-in-out 2.2s infinite; }
        .p-item.was-scrolled .swipe-hint,
        .p-item:not(.open) .swipe-hint { opacity: 0; transition-delay: 0s; animation: none; }
        @keyframes hint-nudge {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-7px); }
        }
        @media (hover: hover) and (pointer: fine) { .swipe-hint { display: none; } }
        @media (prefers-reduced-motion: reduce) { .swipe-hint { animation: none !important; } }
        @media (prefers-reduced-motion: reduce) {
          .projects-scaler:has(.p-item.open) { transform: scale(1); }
        }

        .c-end { display: flex; flex-direction: column; align-items: stretch; justify-content: space-between; background: #000; color: #fff; }
        .c-project { flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 24px; font-size: 10px; }
        .c-project span { align-self: flex-end; font-family: var(--font-display); font-size: 42px; font-weight: 300; transition: transform .35s ease; }
        .c-project:hover span { transform: translateX(7px); }
        .c-close { background: none; border: 1px solid var(--line); padding: 12px 10px; font-size: 9px; color: var(--ink); white-space: nowrap; writing-mode: vertical-rl; }
        .c-end .c-close { align-self: flex-end; margin: 0 16px 16px 0; color: #fff; border-color: rgba(255,255,255,.35); writing-mode: horizontal-tb; }

        /* ---------- site plan ---------- */
        .sp { position: relative; background: #f1f0ec; overflow: hidden; }
        .sp::before { content: ""; position: absolute; inset: 0; background:
          repeating-linear-gradient(90deg, transparent 0 48px, rgba(0,0,0,0.045) 48px 49px),
          repeating-linear-gradient(0deg, transparent 0 48px, rgba(0,0,0,0.045) 48px 49px); }
        .sp-road { position: absolute; background: #fff; box-shadow: 0 0 0 1px rgba(0,0,0,0.07); }
        .sp-road.rh { left: 0; right: 0; top: 62%; height: 42px; }
        .sp-road.rv { top: 0; bottom: 0; left: 24%; width: 38px; transform: skewX(-12deg); }
        .sp-blk { position: absolute; background: #fff; border: 1px solid rgba(0,0,0,0.16); }
        .sp-blk.b1 { left: 30%; top: 14%; width: 16%; height: 13%; }
        .sp-blk.b2 { left: 52%; top: 10%; width: 22%; height: 16%; transform: rotate(3deg); }
        .sp-blk.b3 { left: 78%; top: 20%; width: 14%; height: 22%; }
        .sp-blk.b4 { left: 34%; top: 34%; width: 12%; height: 18%; }
        .sp-blk.b5 { left: 60%; top: 40%; width: 18%; height: 14%; transform: rotate(-4deg); }
        .sp-blk.b6 { left: 10%; top: 70%; width: 20%; height: 16%; }
        .sp-grn { position: absolute; background: rgba(120,150,96,0.3); border: 1px solid rgba(90,120,70,0.32); }
        .sp-grn.gA { left: 50%; top: 30%; width: 30%; height: 30%; transform: rotate(2deg); }
        .sp-grn.gB { left: 80%; top: 64%; width: 14%; height: 20%; }
        .sp-site { position: absolute; left: 30%; top: 12%; width: 46%; height: 54%; border: 1.5px dashed #c0392b; transform: rotate(-4deg); }
        .sp-tag { position: absolute; left: 14px; bottom: 12px; font-size: 9px; color: #6a6a6a; background: rgba(255,255,255,0.72); padding: 5px 9px; }

        @media (max-width: 720px) {
          .projects-scaler { transform: none; }
          /* phone covers: fixed 90vw width, height follows the aspect (capped) */
          .p-item { --ch: min(calc(90vw / var(--ar)), 56vh); }
          .p-item.open { --ch: clamp(280px, 48vh, 520px); }
          .p-item.open { margin-bottom: clamp(64px, 10vh, 96px); }
          .p-item.open .c-photo { width: calc(var(--ch) * 1.3); }
          .p-item.open .c-plan { width: calc(var(--ch) * 1.2); }
          .p-cap { flex-direction: row; gap: 12px; margin-top: 12px; }
          .p-cap-txt { margin-top: 0; }
          .p-item.open .c-info, .c-info .cell-in { width: 88vw; }
          .c-info .cell-in { padding: 14px 16px; }
          .c-info .c-lede { font-size: 13px; line-height: 1.34; margin: 8px 0 12px; }
          .c-info .c-credits { gap: 6px; margin-bottom: 10px; }
          .c-info .c-credits dd { font-size: 15px; }
          .c-info .c-dl > div { padding: 5px 0; }
        }
        @media (min-width: 721px) and (max-width: 1024px) {
          .projects-scaler { transform: scale(.86); }
        }
      `}</style>
    </section>
  );
}
