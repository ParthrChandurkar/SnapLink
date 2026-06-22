import { useCallback, useEffect, useState } from "react";
import { getAnalytics } from "../api";
import ClicksChart from "./ClicksChart";
import DeviceChart from "./DeviceChart";
import GeoChart from "./GeoChart";

export default function Dashboard({ initialShortcode }) {
  const [input, setInput] = useState(initialShortcode);
  const [shortcode, setShortcode] = useState(initialShortcode);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async (code) => {
    if (!code) return;
    setLoading(true);
    setError("");
    try {
      const data = await getAnalytics(code);
      setAnalytics(data);
      localStorage.setItem("snaplink:lastCode", code);
    } catch (requestError) {
      setAnalytics(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Loading remote data is the external synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAnalytics(shortcode);
  }, [shortcode, loadAnalytics]);

  function handleSubmit(event) {
    event.preventDefault();
    const cleanCode = input.trim();
    if (cleanCode === shortcode) loadAnalytics(cleanCode);
    else setShortcode(cleanCode);
  }

  const stats = analytics ? [
    ["Total links", analytics.total_links.toLocaleString()],
    ["Total clicks", analytics.total_clicks.toLocaleString()],
    ["Top country", analytics.top_country],
    ["Top device", analytics.top_device],
  ] : [];

  return (
    <section>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">ANALYTICS</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Link performance</h1>
          <p className="mt-2 text-slate-500">A clean view of who clicked, where, and how.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full gap-2 lg:max-w-md">
          <label htmlFor="analytics-code" className="sr-only">Shortcode</label>
          <input
            id="analytics-code"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Enter a shortcode"
            maxLength={32}
            required
            className="min-w-0 flex-1 rounded-xl border border-line bg-panel px-4 py-3 text-sm text-white placeholder:text-slate-600"
          />
          <button type="submit" disabled={loading} className="rounded-xl bg-accent px-5 text-sm font-bold text-canvas hover:bg-sky-300 disabled:opacity-60">
            {loading ? "Loading…" : "Load"}
          </button>
        </form>
      </div>

      {error && <div role="alert" className="mt-8 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-300">{error}</div>}

      {!analytics && !error && !loading && (
        <div className="card mt-10 grid min-h-72 place-items-center p-8 text-center">
          <div>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-accent/10 text-accent">↗</div>
            <h2 className="mt-4 font-semibold text-white">Enter a shortcode to begin</h2>
            <p className="mt-2 text-sm text-slate-500">Create a link first, or paste the six-character code above.</p>
          </div>
        </div>
      )}

      {analytics && (
        <div className="mt-10">
          <div className="mb-5 flex min-w-0 items-center gap-2 text-sm text-slate-500">
            <span className="shrink-0 rounded-md bg-accent/10 px-2 py-1 font-mono text-accent">/{analytics.shortcode}</span>
            <span aria-hidden="true">→</span>
            <span className="truncate">{analytics.original_url}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(([label, value], index) => (
              <article key={label} className="card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{label}</p>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ["#38bdf8", "#818cf8", "#34d399", "#fbbf24"][index] }} />
                </div>
                <p className="mt-3 truncate text-2xl font-bold text-white">{value}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-5">
            <div className="xl:col-span-3"><ClicksChart data={analytics.clicks_over_time} /></div>
            <div className="xl:col-span-2"><DeviceChart data={analytics.devices} /></div>
          </div>
          <div className="mt-4"><GeoChart data={analytics.clicks_by_country} /></div>
        </div>
      )}
    </section>
  );
}
