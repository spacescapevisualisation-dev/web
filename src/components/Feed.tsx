"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PROJECTS, type Project } from "@/lib/projects";

gsap.registerPlugin(ScrollTrigger);

type LenisLike = {
  velocity?: number;
  scrollTo: (t: HTMLElement | number, o?: object) => void;
};
const getLenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;

const CATS = ["All", ...Array.from(new Set(PROJECTS.map((p) => p.typology)))];

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

function SitePlan({ label }: { label: string }) {
  return (
    <div className="sp" role="img" aria-label={`Site plan, ${label}`}>
      <span className="sp-road rh" /><span className="sp-road rv" />
      <span className="sp-blk b1" /><span className="sp-blk b2" /><span className="sp-blk b3" />
      <span className="sp-blk b4" /><span className="sp-blk b5" /><span className="sp-blk b6" />
      <span className="sp-grn gA" /><span className="sp-grn gB" />
      <span className="sp-site" />
      <span className="sp-tag mono">SITE PLAN · {label}</span>
    </div>
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

  /* vertical wheel drives the open strip horizontally (until it runs out) */
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    if (!open) {
      el.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft + e.deltaY;
      if ((e.deltaY > 0 && el.scrollLeft < max - 1) || (e.deltaY < 0 && el.scrollLeft > 1)) {
        el.scrollLeft = Math.max(0, Math.min(max, next));
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open]);

  const onDown = (e: React.PointerEvent) => {
    if (!open || e.pointerType !== "mouse") return;
    const el = strip.current!;
    drag.current = { active: true, moved: false, startX: e.clientX, startLeft: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
    el.classList.add("grabbing");
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 6) drag.current.moved = true;
    strip.current!.scrollLeft = drag.current.startLeft - dx;
  };
  const onUp = () => {
    drag.current.active = false;
    strip.current?.classList.remove("grabbing");
  };

  return (
    <article id={`proj-${p.no}`} className={`p-item ar-${p.span} ${open ? "open" : ""}`}>
      <div
        className="p-strip"
        ref={strip}
        {...(open ? { "data-lenis-prevent": "" } : {})}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
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
            <div className={`scene ${p.scene}`} />
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
            <dl className="c-dl">
              <div><dt className="mono">Architecture</dt><dd>{p.architect}</dd></div>
              <div><dt className="mono">Visualisation</dt><dd>Space Scape</dd></div>
              <div><dt className="mono">Year</dt><dd>{p.year}</dd></div>
              <div><dt className="mono">Typology</dt><dd>{p.typology}</dd></div>
              <div><dt className="mono">Scale</dt><dd>{p.size}</dd></div>
              <div><dt className="mono">Status</dt><dd>{p.status}</dd></div>
            </dl>
          </div>
        </div>

        <div className="p-cell c-photo"><div className={`scene ${p.sceneB}`} /></div>

        <div className="p-cell c-text">
          <div className="cell-in">
            <span className="mono c-kick">Description</span>
            <p className="c-body">{p.desc2}</p>
          </div>
        </div>

        <div className="p-cell c-plan"><SitePlan label={p.location} /></div>

        <div className="p-cell c-end">
          <button className="c-close mono" data-cursor onClick={onToggle}>Close ✕</button>
        </div>
      </div>
    </article>
  );
}

export default function Feed() {
  const root = useRef<HTMLDivElement>(null);
  const scaler = useRef<HTMLDivElement>(null);
  const [openNo, setOpenNo] = useState<string | null>(null);
  const [cat, setCat] = useState("All");
  const [index, setIndex] = useState(false); // the tab's "everything" panel
  const [fopen, setFopen] = useState(false); // mobile filter panel (right slide-in)

  const shown = PROJECTS.filter((p) => cat === "All" || p.typology === cat);
  const listed = cat === "All" ? PROJECTS : shown;

  /* ------- big.dk motion scroll: the grid breathes out with velocity ------- */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let scale = 1;
    const tick = () => {
      const el = scaler.current;
      if (!el) return;
      const v = Math.abs(getLenis()?.velocity ?? 0);
      const target = 1 - Math.min(v * 0.008, 0.09);
      scale += (target - scale) * 0.1;
      if (Math.abs(scale - 1) < 0.0006) {
        scale = 1;
        if (el.style.transform) {
          el.style.transform = "";
          el.style.transformOrigin = "";
        }
      } else {
        const originY = window.scrollY + window.innerHeight / 2 - el.offsetTop;
        el.style.transformOrigin = `50% ${originY}px`;
        el.style.transform = `scale(${scale})`;
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  /* gentle entrance per tile */
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".p-item").forEach((item) => {
        gsap.fromTo(
          item,
          { opacity: 0.25, y: 40 },
          {
            opacity: 1, y: 0, duration: 1.0, ease: "power3.out",
            scrollTrigger: { trigger: item, start: "top 94%" },
          }
        );
      });
    }, root);
    return () => ctx.revert();
  }, [cat]);

  /* keep scroll maths honest after unfolds, and close on Escape */
  useEffect(() => {
    const t = setTimeout(() => ScrollTrigger.refresh(), 850);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenNo(null);
      setFopen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, [openNo, cat]);

  const jumpTo = useCallback((p: Project) => {
    setIndex(false);
    setOpenNo(p.no);
    requestAnimationFrame(() => {
      const el = document.getElementById(`proj-${p.no}`);
      if (!el) return;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(el, { offset: -Math.round(window.innerHeight * 0.1), duration: 1.2 });
      else el.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

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
      {/* ---- category tabs: a tab opens everything ---- */}
      <div className="catbar">
        {CATS.map((c) => (
          <button
            key={c}
            className={`cat mono ${c === cat ? "on" : ""}`}
            data-cursor
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
                if (cat !== "All" && p.typology !== cat) setCat("All");
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
        className="fbtn"
        data-cursor
        aria-expanded={fopen}
        aria-label={fopen ? "Close filters" : "Open filters"}
        onClick={() => setFopen((v) => !v)}
      >
        {fopen ? <span className="fx">✕</span> : <><i /><i /><i /><i /></>}
      </button>

      <aside className={`fpanel ${fopen ? "open" : ""}`} aria-hidden={!fopen}>
        <span className="fp-kick mono">Categories</span>
        {CATS.map((c) => (
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
                  const el = document.getElementById(`proj-${p.no}`);
                  const lenis = getLenis();
                  if (el && lenis) {
                    requestAnimationFrame(() =>
                      lenis.scrollTo(el, { offset: -Math.round(window.innerHeight * 0.08), duration: 1.1 })
                    );
                  }
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
        .fp-cat { background: none; border: none; padding: 5px 0; font-size: 10px; color: var(--mut); }
        .fp-cat.on { color: var(--ink); text-decoration: underline; text-underline-offset: 4px; }
        .fp-proj {
          background: none; border: none; text-align: left; padding: 6px 0;
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
            position: fixed; top: 0; right: 0; z-index: 6600;
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
        .projects-scaler { will-change: transform; }

        .p-item {
          /* closed / open cell heights — the whole unfold is this one variable */
          --ph: clamp(240px, 46vh, 560px);
          --ch: var(--ph);
          --gap: clamp(26px, 5vw, 84px);
          margin-bottom: clamp(30px, 6vh, 64px);
        }
        .p-item.open { --ph: clamp(340px, 70vh, 820px); }
        .ar-std  { --ar: 1.5; }
        .ar-wide { --ar: 1.7778; }
        .ar-tall { --ar: 0.8; }
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
        .p-item.open .p-strip { overflow-x: auto; cursor: grab; touch-action: pan-x pan-y; }
        .p-item.open .p-strip.grabbing { cursor: grabbing; }

        .p-lead { flex: none; display: flex; flex-direction: column; }
        .p-cover {
          position: relative; display: block; border: none; padding: 0; background: #0b0a09;
          width: var(--cover-w); height: var(--ch); overflow: hidden;
          transition: width .78s cubic-bezier(.45,0,.55,1), height .78s cubic-bezier(.45,0,.55,1);
          will-change: width, height;
        }
        .p-cover .scene { transition: scale 1.2s cubic-bezier(.16,1,.3,1); }
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
          width: 0; margin-left: 0; opacity: 0;
          transition: width .78s cubic-bezier(.45,0,.55,1), height .78s cubic-bezier(.45,0,.55,1),
                      margin-left .78s cubic-bezier(.45,0,.55,1), opacity .45s ease;
          will-change: width;
        }
        .p-item.open .p-cell { margin-left: var(--gap); opacity: 1; transition-delay: 0s, 0s, 0s, .18s; }
        .p-item.open .c-info  { width: min(78vw, 330px); }
        .p-item.open .c-photo { width: calc(var(--ch) * 1.42); }
        .p-item.open .c-text  { width: min(74vw, 370px); }
        .p-item.open .c-plan  { width: calc(var(--ch) * 1.3); }
        .p-item.open .c-end   { width: 90px; }

        .c-photo .scene, .c-plan .sp { position: absolute; inset: 0; }
        .c-photo .scene { transition: transform 1.3s cubic-bezier(.16,1,.3,1); transform: scale(1.15); }
        .p-item.open .c-photo .scene { transform: scale(1); }

        .cell-in { width: min(74vw, 330px); height: 100%; display: flex; flex-direction: column; padding: clamp(16px, 2vh, 26px); background: var(--bg-2); }
        .c-text .cell-in { width: min(74vw, 370px); justify-content: center; gap: 12px; }
        .c-kick { font-size: 8.5px; color: var(--mut); }
        .c-lede { font-size: clamp(15px, 1.4vw, 20px); line-height: 1.3; letter-spacing: -0.01em; color: var(--ink); margin: 10px 0 16px; }
        .c-dl { display: flex; flex-direction: column; margin-top: auto; }
        .c-dl > div { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-top: 1px solid var(--line-soft); }
        .c-dl dt { font-size: 8px; color: var(--mut); }
        .c-dl dd { font-family: var(--font-mono); font-size: 10px; color: var(--ink); text-align: right; }
        .c-body { font-size: clamp(13px, 1.2vw, 16px); line-height: 1.65; color: var(--ink); }

        .c-end { display: flex; align-items: center; justify-content: center; }
        .c-close { background: none; border: 1px solid var(--line); padding: 12px 10px; font-size: 9px; color: var(--ink); white-space: nowrap; writing-mode: vertical-rl; }

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
          /* phone covers: fixed 90vw width, height follows the aspect (capped) */
          .p-item { --ch: min(calc(90vw / var(--ar)), 56vh); }
          .p-item.open { --ch: clamp(280px, 48vh, 520px); }
          .p-item.open .c-photo { width: calc(var(--ch) * 1.3); }
          .p-item.open .c-plan { width: calc(var(--ch) * 1.2); }
          .p-cap { flex-direction: row; gap: 12px; margin-top: 12px; }
          .p-cap-txt { margin-top: 0; }
        }
      `}</style>
    </section>
  );
}
