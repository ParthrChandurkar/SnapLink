import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tooltipStyle = { background: "#161b22", border: "1px solid #30363d", borderRadius: 10 };

export default function ClicksChart({ data }) {
  return (
    <div className="card p-5 sm:p-6">
      <h3 className="font-semibold text-white">Clicks over time</h3>
      <p className="mt-1 text-sm text-slate-500">Daily visits to this link</p>
      <div className="mt-6 h-72">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid stroke="#30363d" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="date" stroke="#8b949e" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} stroke="#8b949e" tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#f0f6fc" }} />
              <Line type="monotone" dataKey="clicks" stroke="#38bdf8" strokeWidth={3} dot={{ r: 3, fill: "#0d1117", strokeWidth: 2 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </div>
    </div>
  );
}

function EmptyChart() {
  return <div className="grid h-full place-items-center rounded-xl border border-dashed border-line text-sm text-slate-600">Clicks will appear here</div>;
}

