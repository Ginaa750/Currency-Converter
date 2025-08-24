import { formatMoney } from "../utils/format.js";
<AlertsPanel from={from} to={to} rate={rate} onRefresh={refreshRate} />

export default function ResultCard({
  from, to, amount, converted, rate, date, loading, error, sameCurrency,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border p-6 md:p-7 border-white/10 bg-white/5">
        <div className="h-6 w-3/4 rounded bg-white/10 mb-3"></div>
        <div className="h-4 w-1/2 rounded bg-white/10"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border p-6 border-rose-500/30 bg-rose-500/10 text-rose-200">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-6 md:p-7 border-white/10 bg-white/5">
      <div className="text-xl md:text-2xl">
        <span className="text-slate-300">{formatMoney(amount, from)}</span>
        <span className="mx-2 text-slate-500">=</span>
        <span className="text-2xl md:text-3xl font-semibold bg-clip-text text-transparent
                         bg-gradient-to-r from-brand-300 to-grape-300">
          {formatMoney(converted, to)}
        </span>
      </div>

      <div className="mt-3 text-sm text-slate-400">
        Rate: 1 {from} = {(sameCurrency ? 1 : rate)?.toFixed(6)} {to}
        {date && <span className="ml-2 text-slate-500">(as of {date})</span>}
      </div>

      {sameCurrency && (
        <div className="mt-3 text-sm text-amber-300">
          Same currency — conversion is 1:1.
        </div>
      )}
    </div>
  );
}
