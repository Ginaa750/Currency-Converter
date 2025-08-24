export default function TrendChart({ points }) {
  if (!points?.length) return null;

  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 10, w = 640, h = 180;
  const x = (i) => pad + (i * (w - pad * 2)) / (points.length - 1 || 1);
  const y = (v) => (max === min) ? h/2 : h - pad - ((v - min) * (h - pad * 2)) / (max - min);
  const d = points.map((p, i) => `${i ? "L" : "M"} ${x(i)} ${y(p.value)}`).join(" ");

  const first = points[0], last = points[points.length - 1];
  const change = last.value - first.value;
  const changePct = first.value ? (change / first.value) * 100 : 0;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44">
        <defs>
          <linearGradient id="stroke" x1="0" x2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <path d={d} fill="none" strokeWidth="2.5" stroke="url(#stroke)" />
      </svg>
      <p className={`text-sm ${change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
        {change >= 0 ? "▲" : "▼"} {change >= 0 ? "+" : ""}{change.toFixed(6)} ({changePct.toFixed(2)}%)
      </p>
    </div>
  );
}
