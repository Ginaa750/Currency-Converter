export default function CurrencySelect({ value, onChange, currencies, loading, label }) {
  return (
    <label className="block w-full">
      {label && <span className="block text-sm text-slate-300 mb-2">{label}</span>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className="w-full appearance-none rounded-2xl border px-4 py-3 pr-10 text-base
                     border-white/10 bg-white/10 text-white
                     focus:outline-none focus:ring-2 focus:ring-grape-400/70"
        >
          {loading && <option>Loading…</option>}
          {!loading &&
            currencies.map((c) => (
              <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                {c.code} — {c.name}
              </option>
            ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
          ▾
        </span>
      </div>
    </label>
  );
}
