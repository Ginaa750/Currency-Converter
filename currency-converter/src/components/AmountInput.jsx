export default function AmountInput({ value, onChange }) {
  return (
    <label className="block">
      <span className="block text-sm text-slate-300 mb-2">Amount</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 100"
        className="w-full rounded-2xl border px-4 py-3 text-base leading-relaxed
                   border-white/10 bg-white/10 text-white placeholder:text-slate-400
                   focus:outline-none focus:ring-2 focus:ring-brand-400/70"
      />
    </label>
  );
}
