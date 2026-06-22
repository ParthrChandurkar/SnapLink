import { lazy, Suspense, useState } from "react";
import Shortener from "./components/Shortener";

const Dashboard = lazy(() => import("./components/Dashboard"));

function Logo() {
  return (
    <div className="flex items-center gap-3" aria-label="SnapLink home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-canvas shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1.14-1.14" />
        </svg>
      </span>
      <span className="text-xl font-bold tracking-tight">Snap<span className="text-accent">Link</span></span>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("shorten");
  const [shortcode, setShortcode] = useState(() => localStorage.getItem("snaplink:lastCode") || "");

  function handleCreated(link) {
    setShortcode(link.shortcode);
    localStorage.setItem("snaplink:lastCode", link.shortcode);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(circle_at_50%_-20%,rgba(56,189,248,0.16),transparent_58%)]" />
      <header className="relative z-10 border-b border-line/70 bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Logo />
          <nav className="flex rounded-xl border border-line bg-panel p-1" aria-label="Main navigation">
            {[
              ["shorten", "Shorten"],
              ["analytics", "Analytics"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${view === id ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        {view === "shorten" ? (
          <Shortener onCreated={handleCreated} onViewAnalytics={() => setView("analytics")} />
        ) : (
          <Suspense fallback={<div className="card grid min-h-72 place-items-center text-sm text-slate-500">Loading analytics…</div>}>
            <Dashboard initialShortcode={shortcode} />
          </Suspense>
        )}
      </main>

      <footer className="relative z-10 border-t border-line/60 px-5 py-8 text-center text-sm text-slate-500">
        Fast links, useful signals. Built on AWS serverless infrastructure.
      </footer>
    </div>
  );
}
