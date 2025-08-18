export default function AmountInput({ value, onChange }) {
  return (
    <label className="block">
      <span className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Amount</span>
      <input
        type="number"
        inputMode="decimal"
        min="0" step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 100"
        className="w-full rounded-xl border px-3 py-2
                   border-slate-300 bg-white text-slate-900 placeholder:text-slate-400
                   focus:outline-none focus:ring-2 focus:ring-sky-500
                   dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-slate-400
                   dark:focus:ring-cyan-400/60"
      />
    </label>
  );
}
