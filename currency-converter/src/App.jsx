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
  const [to, setTo] = useState("NGN");
  const [amount, setAmount] = useState("100");

  const {
    currencies, loadingCurrencies, currencyError,
    rate, rateDate, rateError, loadingRate,
    converted, recentPairs,
    trend, trendError, loadingTrend, fetchTrend, // trend optional
  } = useRates({ from, to, amount });

  const sameCurrency = from === to;
  const swap = () => { setFrom(to); setTo(from); };
  const onSelectPair = (pair) => { const [f, t] = pair.split("->"); setFrom(f); setTo(t); };

  return (
    <div className="min-h-screen bg-grid-dark text-slate-100 flex items-center justify-center px-4">
      {/* center the app: one beautiful glass card */}
      <div className="w-full max-w-3xl">
        {/* header row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl
                            bg-gradient-to-br from-brand-500 to-grape-500 text-white shadow-lg shadow-brand-500/20">
              <span className="text-lg">💱</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Currency Converter</h1>
              <p className="text-xs text-slate-400">Real-time rates • NGN supported</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="card">
          {currencyError && (
            <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200">
              {currencyError}
            </div>
          )}

          {/* amount */}
          <div className="mb-8">
            <AmountInput value={amount} onChange={setAmount} />
          </div>

          {/* selectors + swap */}
          <div className="grid gap-6 sm:grid-cols-2 mb-8">
            <div>
              <div className="mb-2 text-sm text-slate-300">From</div>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{flagFromCode(from)}</div>
                <CurrencySelect
                  value={from}
                  onChange={setFrom}
                  currencies={currencies}
                  loading={loadingCurrencies}
                />
              </div>
            </div>

            <div className="relative">
              <div className="mb-2 text-sm text-slate-300">To</div>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{flagFromCode(to)}</div>
                <CurrencySelect
                  value={to}
                  onChange={setTo}
                  currencies={currencies}
                  loading={loadingCurrencies}
                />
              </div>

              <div className="absolute -top-6 right-0">
                <SwapButton onClick={swap} />
              </div>
            </div>
          </div>

          {/* result */}
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

          {/* recent pairs (optional garnish) */}
          {recentPairs.length > 0 && (
            <div className="mt-8">
              <div className="text-xs text-slate-400 mb-3">Recent pairs</div>
              <div className="flex flex-wrap gap-3">
                {recentPairs.map((p) => (
                  <button
                    key={p}
                    onClick={() => onSelectPair(p)}
                    className="btn px-4 py-2 rounded-full text-sm border border-white/10 bg-white/10 hover:bg-white/15"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Built with React + Tailwind • Dark-first • Neon accents
        </p>
      </div>
    </div>
  );
}
