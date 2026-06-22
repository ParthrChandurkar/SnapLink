import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function GeoChart({ data }) {
  return (
    <div className="card p-5 sm:p-6">
      <h3 className="font-semibold text-white">Clicks by country</h3>
      <p className="mt-1 text-sm text-slate-500">Geographic distribution</p>
      <div className="mt-6 h-64">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.slice(0, 8)} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
              <CartesianGrid stroke="#30363d" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="country" stroke="#8b949e" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} stroke="#8b949e" tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip cursor={{ fill: "rgba(56,189,248,.05)" }} contentStyle={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 10 }} />
              <Bar dataKey="clicks" fill="#38bdf8" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="grid h-full place-items-center rounded-xl border border-dashed border-line text-sm text-slate-600">Country data will appear here</div>}
      </div>
    </div>
  );
}

