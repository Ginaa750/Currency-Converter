export default function AmountInput({ value, onChange }) {
  return (
    <label className="block">
      <span className="block text-sm text-slate-600 mb-1">Amount</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 100"
        className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
    </label>
  );
}
