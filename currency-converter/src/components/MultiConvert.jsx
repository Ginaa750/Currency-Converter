import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "../utils/format.js";

export default function MultiConvert({ base, amount, currencies, fetchAllRatesFrom }) {
  const [selected, setSelected] = useState(() =>
    ["EUR","GBP","NGN","JPY","CAD","AUD","CNY","INR","ZAR"].filter(code =>
      currencies.some(c => c.code === code)
    )
  );
  const [rates, setRates] = useState(null);
  const [date, setDate] = useState("");

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const { date, rates } = await fetchAllRatesFrom(base);
        if (ok) { setRates(rates); setDate(date); }
      } catch (e) {
        if (ok) { setRates(null); setDate(""); }
      }
    })();
    return () => { ok = false; };
  }, [base, fetchAllRatesFrom]);

  const list = useMemo(() => {
    if (!rates) return [];
    const a = Number(amount) || 0;
    return selected
      .filter(code => code !== base && rates[code])
      .map(code => ({ code, rate: rates[code], value: a * rates[code] }));
  }, [rates, selected, amount, base]);

  const toggle = (code) => {
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Multi-currency conversion</h3>
        {date && <span className="text-xs text-slate-400">as of {date}</span>}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {currencies.map(c => (
          <button
            key={c.code}
            onClick={() => toggle(c.code)}
            className={`chip ${selected.includes(c.code) ? "ring-1 ring-violet-300/60" : ""}`}
            title="Toggle currency"
          >
            {c.code}
          </button>
        ))}
      </div>

      {!rates && (
        <p className="text-sm text-slate-400">Loading rates…</p>
      )}

      {rates && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="py-2 pr-4">Currency</th>
                <th className="py-2 pr-4">Rate</th>
                <th className="py-2 pr-4">Converted</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {list.map(row => (
                <tr key={row.code} className="border-t border-white/10">
                  <td className="py-2 pr-4">{row.code}</td>
                  <td className="py-2 pr-4">{row.rate.toFixed(6)}</td>
                  <td className="py-2 pr-4">{formatMoney(row.value, row.code)}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td className="py-3 text-slate-400" colSpan="3">Select currencies above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
