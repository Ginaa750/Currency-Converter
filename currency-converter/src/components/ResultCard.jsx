import { formatMoney } from "../utils/format.js";

export default function ResultCard({
  from, to, amount, converted, rate, date,
  loading, error, sameCurrency,
}) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm space-y-2">
      {loading && <p className="text-slate-500">Fetching latest rate…</p>}
      {error && <p className="text-rose-600">{error}</p>}

      {!loading && !error && (
        <>
          <div className="text-xl font-semibold">
            {formatMoney(amount, from)} ={" "}
            <span className="text-slate-900">{formatMoney(converted, to)}</span>
          </div>
          <p className="text-sm text-slate-600">
            Rate: 1 {from} = {(sameCurrency ? 1 : rate)?.toFixed(6)} {to}
            {date && <span className="ml-2 text-slate-400">(as of {date})</span>}
          </p>
          {sameCurrency && (
            <p className="text-xs text-slate-500">
              Same currency selected — conversion is 1:1.
            </p>
          )}
        </>
      )}
    </div>
  );
}
