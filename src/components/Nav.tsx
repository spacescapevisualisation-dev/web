"use client";

import { useEffect, useRef, useState } from "react";

function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  const bar = document.querySelector(".catbar") as HTMLElement | null;
  const barHeight = bar?.getBoundingClientRect().height ?? 0;
  const mobileStrip = window.innerWidth <= 860 ? 46 : 0;
  const offset = Math.ceil(Math.max(barHeight, mobileStrip) + 18);
  const top = window.scrollY + el.getBoundingClientRect().top - offset;

  window.scrollTo({ top, behavior: "smooth" });
}

/**
 * big.dk-style chrome: the wordmark sits fixed top-left and is itself the
 * menu toggle — clicking it slides a white panel in from the left edge.
 */
export default function Nav() {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  // menu open: freeze the smooth scroll, move focus in, close on Escape;
  // on close, hand focus back to the toggle
  useEffect(() => {
    if (!open) return;
    const lenis = (window as unknown as { __lenis?: { stop?: () => void; start?: () => void } }).__lenis;
    lenis?.stop?.();
    const toggleEl = toggle.current;
    const first = panel.current?.querySelector<HTMLElement>("button, a");
    first?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start?.();
      window.removeEventListener("keydown", onKey);
      toggleEl?.focus({ preventScroll: true });
    };
  }, [open]);

  const links: [string, string][] = [
    ["Projects", "work"],
    ["Careers", "careers"],
    ["Contact", "contact"],
  ];

  return (
    <>
      <button
        ref={toggle}
        className={`logo display ${open ? "open" : ""}`}
        data-cursor
        data-cursor-label={open ? "Close" : "Menu"}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <i className="logo-lines" aria-hidden><b /><b /><b /></i><span>spacescape</span>
      </button>

      <a className="contact-top mono" href="mailto:spacescapevisualisations@gmail.com?subject=Project%20Inquiry%20%E2%80%94%20Space%20Scape">Contact us</a>

      <nav ref={panel} className={`side ${open ? "open" : ""}`} aria-hidden={!open} aria-label="Site menu">
        {links.map(([label, id], i) => (
          <button
            key={id}
            className="side-link"
            data-cursor
            tabIndex={open ? 0 : -1}
            style={{ transitionDelay: open ? `${0.06 * i + 0.14}s` : "0s" }}
            onClick={() => {
              setOpen(false);
              scrollTo(id);
            }}
          >
            {label}
          </button>
        ))}
        <a
          className="side-link side-mail"
          data-cursor
          tabIndex={open ? 0 : -1}
          style={{ transitionDelay: open ? "0.26s" : "0s" }}
          href="mailto:spacescapevisualisations@gmail.com?subject=Project%20Inquiry%20%E2%80%94%20Space%20Scape"
        >
          spacescapevisualisations@gmail.com
        </a>
        <span className="side-foot mono">Architectural Visualisation · Pune</span>
      </nav>

      {open && <button className="side-veil" aria-label="Close menu" onClick={() => setOpen(false)} />}

      <style>{`
        .logo {
          position: fixed; top: 0; left: 0; z-index: 7100;
          padding: 13px clamp(14px, 3vw, 26px);
          background: none; border: none;
          font-size: 19px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink);
          transition: opacity .3s;
        }
        .logo { display: flex; align-items: center; gap: 7px; }
        .logo-lines { display: flex; flex-direction: column; justify-content: center; gap: 2px; width: 13px; height: 14px; }
        .logo-lines b {
          display: block; width: 12px; height: 2px; flex: none;
          background: currentColor; opacity: .22; transform: scaleX(.45);
          transform-origin: left center;
          animation: logo-line 1.35s cubic-bezier(.16,1,.3,1) infinite;
        }
        .logo i b:nth-child(2) { animation-delay: .18s; }
        .logo i b:nth-child(3) { animation-delay: .36s; }
        @keyframes logo-line {
          0%, 55%, 100% { opacity: .22; transform: scaleX(.45); }
          25% { opacity: 1; transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .logo-lines b { animation: none; opacity: 1; transform: none; }
        }
        .logo:hover { opacity: .6; }
        .contact-top {
          position: fixed; top: 0; right: 0; z-index: 7100;
          display: flex; align-items: center;
          min-height: 46px; padding: 0 clamp(16px, 2.4vw, 28px);
          border: 0; background: transparent; color: var(--ink);
          font-size: 8.5px; transition: opacity .3s;
        }
        .contact-top:hover { opacity: .55; }

        .side {
          position: fixed; top: 0; bottom: 0; left: 0; z-index: 7000;
          width: min(86vw, 340px); background: #fff;
          display: flex; flex-direction: column; justify-content: center; gap: 6px;
          padding: 0 clamp(22px, 4vw, 40px);
          transform: translateX(-100%); opacity: 0;
          transition: transform .6s cubic-bezier(.45,0,.55,1), opacity .5s ease;
          border-right: 1px solid var(--line-soft);
          pointer-events: none;
        }
        .side.open { transform: translateX(0); opacity: 1; pointer-events: auto; }
        .side-mark { position: absolute; top: 58px; left: clamp(22px, 4vw, 40px); font-size: 13px; color: var(--mut); letter-spacing: .08em; }
        .side-link {
          background: none; border: none; text-align: left; padding: 7px 0;
          font-family: var(--font-display); font-size: clamp(26px, 3vw, 38px); font-weight: 400;
          letter-spacing: -0.02em; color: var(--ink); text-transform: uppercase;
          opacity: 0; transform: translateX(-16px);
          transition: opacity .5s ease, transform .55s cubic-bezier(.16,1,.3,1), color .3s;
        }
        .side.open .side-link { opacity: 1; transform: none; }
        .side-link:hover { color: var(--mut); }
        .side-mail { font-size: clamp(14px, 1.4vw, 17px); text-transform: none; margin-top: 18px; }
        .side-foot { position: absolute; bottom: 26px; left: clamp(22px, 4vw, 40px); font-size: 8.5px; color: var(--faint); }
        .side-veil { position: fixed; inset: 0; z-index: 6900; background: rgba(0,0,0,0.08); border: none; }
        @media (max-width: 860px) {
          .contact-top { padding: 0 14px; font-size: 8px; }
        }
      `}</style>
    </>
  );
}
