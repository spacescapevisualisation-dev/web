import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="nf">
      <p className="nf-kick">404</p>
      <h1 className="nf-title">This space doesn&apos;t exist.</h1>
      <Link className="nf-link" href="/">Back to projects</Link>

      <style>{`
        .nf { min-height: 100svh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; background: #fff; color: #000; text-align: center; padding: 24px; }
        .nf-kick { font-family: var(--font-mono); font-size: 10px; letter-spacing: .22em; text-transform: uppercase; color: #797979; }
        .nf-title { font-family: var(--font-display); font-weight: 500; letter-spacing: -0.02em; font-size: clamp(26px, 5vw, 54px); }
        .nf-link { margin-top: 18px; background: #000; color: #fff; padding: 13px 26px; font-family: var(--font-mono); font-size: 10px; letter-spacing: .18em; text-transform: uppercase; }
        .nf-link:hover { opacity: .8; }
      `}</style>
    </main>
  );
}
