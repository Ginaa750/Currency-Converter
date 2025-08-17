import { useMemo, useState } from "react";
import AmountInput from "./components/AmountInput.jsx";
import CurrencySelect from "./components/CurrencySelect.jsx";
import ResultCard from "./components/ResultCard.jsx";
import SwapButton from "./components/SwapButton.jsx";
import { useRates } from "./hooks/useRates.js";

export default function App() {
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [amount, setAmount] = useState("100");

  const {
    currencies, loadingCurrencies, currencyError,
    rate, rateDate, rateError, loadingRate,
    converted, recentPairs,
    trend, trendError, loadingTrend, fetchTrend,
  } = useRates({ from, to, amount });

  const sameCurrency = from === to;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const onSelectPair = (pair) => {
    const [f, t] = pair.split("->");
    if (f && t) { setFrom(f); setTo(t); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl sm:text-3xl font-semibold">💱 Currency Converter</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time rates via frankfurter.app
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {currencyError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700">
            {currencyError}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
            <AmountInput value={amount} onChange={setAmount} />
            <CurrencySelect
              label="From"
              value={from}
              onChange={setFrom}
              currencies={currencies}
              loading={loadingCurrencies}
            />
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4 relative">
            <div className="absolute -top-3 right-4 sm:right-6">
              <SwapButton onClick={swap} />
            </div>
            <CurrencySelect
              label="To"
              value={to}
              onChange={setTo}
              currencies={currencies}
              loading={loadingCurrencies}
            />
            <ResultCard
              from={from}
              to={to}
              amount={Number(amount) || 0}
              converted={converted}
              rate={rate}
              date={rateDate}
              loading={loadingRate}
              error={rateError}
              sameCurrency={sameCurrency}
            />
          </div>
        </section>

        {/* Recent pairs */}
        {recentPairs.length > 0 && (
          <section className="mt-6">
            <h3 className="text-sm text-slate-600 mb-2">Recent pairs</h3>
            <div className="flex flex-wrap gap-2">
              {recentPairs.map((p) => (
                <button
                  key={p}
                  onClick={() => onSelectPair(p)}
                  className="px-3 py-1.5 rounded-full text-sm border bg-white hover:bg-slate-50"
                >
                  {p}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Trend */}
        <section className="mt-8 bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">7-Day Trend (optional)</h3>
            <button
              onClick={fetchTrend}
              className="text-sm underline underline-offset-2"
              type="button"
            >
              {loadingTrend ? "Loading…" : "Refresh"}
            </button>
          </div>

          {trendError && <p className="text-rose-600 mt-3 text-sm">{trendError}</p>}
          {!trend && !trendError && !loadingTrend && (
            <p className="text-sm text-slate-500 mt-3">
              Click “Refresh” to fetch the last 7 days.
            </p>
          )}
          {trend && <MiniSparkline points={trend} />}
        </section>
      </main>

      <footer className="py-10 text-center text-xs text-slate-500">
        Built with React + Tailwind. Data from frankfurter.app
      </footer>
    </div>
  );
}

function MiniSparkline({ points }) {
  // SVG mini line chart (no libs)
  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 6, w = 560, h = 120;

  const x = (i) => pad + (i * (w - pad * 2)) / (points.length - 1 || 1);
  const y = (v) => (max === min) ? h/2 : h - pad - ((v - min) * (h - pad * 2)) / (max - min);
  const d = points.map((p, i) => `${i ? "L" : "M"} ${x(i)} ${y(p.value)}`).join(" ");

  const first = points[0], last = points[points.length - 1];
  const change = last.value - first.value;
  const changePct = first.value ? (change / first.value) * 100 : 0;

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28">
        <path d={d} fill="none" strokeWidth="2" stroke="currentColor" />
      </svg>
      <p className={`text-sm ${change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
        {change >= 0 ? "▲" : "▼"} {change >= 0 ? "+" : ""}{change.toFixed(6)} ({changePct.toFixed(2)}%)
        
      </p>
    </div>
  );
}
