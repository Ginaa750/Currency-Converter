import { formatMoney } from "../utils/format.js";

export default function ResultCard({ from, to, amount, converted, rate, date, loading, error, sameCurrency }) {
  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border p-4
                      border-slate-200 bg-white
                      dark:border-white/10 dark:bg-white/5">
        <div className="h-6 w-3/4 rounded bg-slate-200 dark:bg-white/10 mb-3"></div>
        <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-white/10"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border p-4
                      border-rose-200 bg-rose-50 text-rose-700
                      dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-5
                    border-slate-200 bg-white
                    dark:border-white/10 dark:bg-white/5">
      <div className="text-lg">
        <span className="text-slate-700 dark:text-slate-300">{formatMoney(amount, from)}</span>
        <span className="mx-2 text-slate-400">=</span>
        <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {formatMoney(converted, to)}
        </span>
      </div>

      <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
        Rate: 1 {from} = {(sameCurrency ? 1 : rate)?.toFixed(6)} {to}
        {date && <span className="ml-2 text-slate-500 dark:text-slate-400">(as of {date})</span>}
      </div>

      {sameCurrency && (
        <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          Same currency — conversion is 1:1.
        </div>
      )}
    </div>
  );
}
