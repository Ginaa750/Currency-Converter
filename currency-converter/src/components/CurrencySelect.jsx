export default function CurrencySelect({
  label = "Currency",
  value,
  onChange,
  currencies,
  loading,
}) {
  return (
    <label className="block">
      <span className="block text-sm text-slate-600 mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
      >
        {loading && <option>Loading…</option>}
        {!loading &&
          currencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name}
            </option>
          ))}
      </select>
    </label>
  );
}
