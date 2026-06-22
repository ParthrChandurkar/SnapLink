import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#38bdf8", "#818cf8", "#34d399", "#fbbf24", "#fb7185"];

export default function DeviceChart({ data }) {
  return (
    <div className="card p-5 sm:p-6">
      <h3 className="font-semibold text-white">Device breakdown</h3>
      <p className="mt-1 text-sm text-slate-500">How your audience visits</p>
      <div className="mt-6 h-64">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="clicks" nameKey="device" cx="50%" cy="46%" innerRadius={48} outerRadius={78} paddingAngle={3} stroke="none">
                {data.map((entry, index) => <Cell key={entry.device} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 10 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "#8b949e" }} />
            </PieChart>
          </ResponsiveContainer>
        ) : <div className="grid h-full place-items-center rounded-xl border border-dashed border-line text-sm text-slate-600">Device data will appear here</div>}
      </div>
    </div>
  );
}

