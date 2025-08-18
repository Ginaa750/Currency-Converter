import { useState } from "react";
import AmountInput from "./components/AmountInput.jsx";
import CurrencySelect from "./components/CurrencySelect.jsx";
import SwapButton from "./components/SwapButton.jsx";
import ResultCard from "./components/ResultCard.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import { useRates } from "./hooks/useRates.jsx";



function flagFromCode(code = "") {
  const map = { USD:"🇺🇸", EUR:"🇪🇺", GBP:"🇬🇧", NGN:"🇳🇬", JPY:"🇯🇵", CAD:"🇨🇦", AUD:"🇦🇺", CNY:"🇨🇳", INR:"🇮🇳", ZAR:"🇿🇦" };
  return map[code] || "🌐";
}

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
  const swap = () => { setFrom(to); setTo(from); };
  const onSelectPair = (pair) => { const [f, t] = pair.split("->"); setFrom(f); setTo(t); };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b1220] dark:text-slate-100">
      {/* top glow (only visible in dark) */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-500/20 to-transparent blur-2xl hidden dark:block" />

      <header className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-slate-200
                         dark:bg-white/5 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl
                            bg-slate-900 text-white
                            dark:bg-gradient-to-br dark:from-cyan-400 dark:to-indigo-500 dark:text-white">
              <span className="text-lg">💱</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold">Currency Converter</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Real-time rates (NGN supported)</p>
            </div>
          </div>

          <div className="flex items-center">
            <a
              href="https://frankfurter.app/docs/"
              target="_blank" rel="noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg border
                         border-slate-200 bg-white/70 hover:bg-white
                         dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
            >
              API Docs
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {currencyError && (
          <div className="mb-4 p-3 rounded-xl border bg-rose-50 text-rose-700 border-rose-200
                          dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30">
            {currencyError}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          {/* Left card */}
          <div className="relative rounded-3xl border p-6
                          border-slate-200 bg-white shadow-sm
                          dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl dark:shadow-2xl dark:shadow-black/30">
            <div className="relative space-y-6">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500/80"></span>
                Live Conversion
              </div>

              <AmountInput value={amount} onChange={setAmount} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">From</div>
                  <div className="flex items-center gap-2">
                    <div className="text-xl">{flagFromCode(from)}</div>
                    <CurrencySelect
                      value={from}
                      onChange={setFrom}
                      currencies={currencies}
                      loading={loadingCurrencies}
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">To</div>
                  <div className="flex items-center gap-2">
                    <div className="text-xl">{flagFromCode(to)}</div>
                    <CurrencySelect
                      value={to}
                      onChange={setTo}
                      currencies={currencies}
                      loading={loadingCurrencies}
                    />
                  </div>

                  <div className="absolute -top-5 right-0">
                    <SwapButton onClick={swap} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right card */}
          <div className="rounded-3xl border p-6 space-y-6
                          border-slate-200 bg-white shadow-sm
                          dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl dark:shadow-2xl dark:shadow-black/30">
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

            {recentPairs.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Recent pairs</div>
                <div className="flex flex-wrap gap-2">
                  {recentPairs.map((p) => (
                    <button
                      key={p}
                      onClick={() => onSelectPair(p)}
                      className="px-3 py-1.5 rounded-full text-xs border
                                 border-slate-200 bg-white hover:bg-slate-50
                                 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border p-4
                            border-slate-200 bg-slate-50
                            dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">7-Day Trend</h3>
                <button
                  onClick={fetchTrend}
                  className="text-xs underline underline-offset-2 hover:text-slate-900 dark:hover:text-white"
                  type="button"
                >
                  {loadingTrend ? "Loading…" : "Refresh"}
                </button>
              </div>

              {trendError && <p className="text-sm mt-3 text-amber-700 dark:text-amber-300">{trendError}</p>}
              {!trend && !trendError && !loadingTrend && (
                <p className="text-sm mt-3 text-slate-600 dark:text-slate-400">
                  Click “Refresh” to fetch the last 7 days.
                </p>
              )}
              {trend && <MiniSparkline points={trend} />}
            </div>
          </div>
        </section>
      </main>

      <footer className="px-4 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
        Built with React + Tailwind • Light/Dark supported
      </footer>
    </div>
  );
}

function MiniSparkline({ points }) {
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
        <defs>
          <linearGradient id="stroke" x1="0" x2="1">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <path d={d} fill="none" strokeWidth="2.5" stroke="url(#stroke)" />
      </svg>
      <p className={`text-sm ${change >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
        {change >= 0 ? "▲" : "▼"} {change >= 0 ? "+" : ""}{change.toFixed(6)} ({changePct.toFixed(2)}%)
      </p>
    </div>
  );
}
