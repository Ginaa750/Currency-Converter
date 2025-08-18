export default function CurrencySelect({ value, onChange, currencies, loading, label }) {
  return (
    <label className="block w-full">
      {label && <span className="block text-sm text-slate-700 dark:text-slate-300 mb-1">{label}</span>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className="w-full appearance-none rounded-xl border px-3 py-2 pr-9
                     border-slate-300 bg-white text-slate-900
                     focus:outline-none focus:ring-2 focus:ring-indigo-500
                     dark:border-white/10 dark:bg-white/10 dark:text-white dark:focus:ring-indigo-400/60"
        >
          {loading && <option>Loading…</option>}
          {!loading && currencies.map((c) => (
            <option key={c.code} value={c.code} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
              {c.code} — {c.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300">▾</span>
      </div>
    </label>
  );
}
