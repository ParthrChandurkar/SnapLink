import { useState } from "react";
import { shortenUrl } from "../api";

export default function Shortener({ onCreated, onViewAnalytics }) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setCopied(false);
    setLoading(true);
    try {
      const link = await shortenUrl(url.trim());
      setResult(link);
      onCreated(link);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(result.short_url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Clipboard access was blocked. Select and copy the link manually.");
    }
  }

  return (
    <section className="mx-auto max-w-4xl pt-4 text-center sm:pt-10">
      <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Serverless URL intelligence
      </span>
      <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
        Short links. <span className="text-accent">Clear insights.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
        Turn unwieldy URLs into shareable links, then understand every click without the clutter.
      </p>

      <form onSubmit={handleSubmit} className="card mt-10 p-3 sm:flex sm:gap-3 sm:p-4">
        <label htmlFor="long-url" className="sr-only">Long URL</label>
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-line bg-canvas/70 px-4">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1.14-1.14" />
          </svg>
          <input
            id="long-url"
            type="url"
            required
            maxLength={2048}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://your-very-long-url.com/goes-here"
            className="h-14 w-full min-w-0 bg-transparent text-sm text-white placeholder:text-slate-600 sm:text-base"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-3 h-14 w-full rounded-xl bg-accent px-7 font-bold text-canvas transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0 sm:w-auto"
        >
          {loading ? "Snapping…" : "Shorten URL"}
        </button>
      </form>

      {error && <p role="alert" className="mt-4 text-sm text-rose-400">{error}</p>}

      {result && (
        <div className="card mt-6 p-5 text-left sm:p-6" aria-live="polite">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your short link</p>
              <a href={result.short_url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-lg font-semibold text-accent hover:underline">
                {result.short_url}
              </a>
              <p className="mt-1 truncate text-sm text-slate-500">{result.original_url}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={copyLink} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-accent/50 hover:text-accent">
                {copied ? "Copied!" : "Copy link"}
              </button>
              <button type="button" onClick={onViewAnalytics} className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600">
                View analytics
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
        {[
          ["01", "Instant", "Six-character links generated in milliseconds."],
          ["02", "Observable", "Country, device, browser and referrer analytics."],
          ["03", "Serverless", "Secure AWS infrastructure that scales on demand."],
        ].map(([number, title, copy]) => (
          <div key={number} className="rounded-xl border border-line/70 bg-panel/40 p-5">
            <span className="font-mono text-xs text-accent">{number}</span>
            <h2 className="mt-3 font-semibold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

