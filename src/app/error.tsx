"use client";

/** last-resort boundary: keep the failure quiet, branded, recoverable */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="err">
      <p className="err-kick">Something went wrong</p>
      <h1 className="err-title">The image didn&apos;t resolve.</h1>
      <button className="err-btn" onClick={reset}>Try again</button>

      <style>{`
        .err { min-height: 100svh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; background: #fff; color: #000; text-align: center; padding: 24px; }
        .err-kick { font-family: var(--font-mono); font-size: 10px; letter-spacing: .22em; text-transform: uppercase; color: #797979; }
        .err-title { font-family: var(--font-display); font-weight: 500; letter-spacing: -0.02em; font-size: clamp(26px, 5vw, 54px); }
        .err-btn { margin-top: 18px; background: #000; color: #fff; border: none; padding: 13px 26px; font-family: var(--font-mono); font-size: 10px; letter-spacing: .18em; text-transform: uppercase; cursor: pointer; }
        .err-btn:hover { opacity: .8; }
      `}</style>
    </main>
  );
}
