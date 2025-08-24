import { useEffect, useMemo, useState } from "react";
import AlertsPanel from "./components/AlertsPanel.jsx";


/** Provider: all currencies, no key */
const ERH = "https://api.exchangerate.host"; // /symbols, /latest

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return true; // default to dark
  });
  useEffect(() => {
    const root = document.documentElement;
    if (dark) { root.classList.add("dark");  localStorage.setItem("theme","dark"); }
    else      { root.classList.remove("dark"); localStorage.setItem("theme","light"); }
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark(v => !v)}
      className="rounded-xl border px-3 py-2 text-xs border-white/10 bg-white/10 text-white hover:bg-white/15"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {dark ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}

function formatMoney(value, currency = "USD") {
  const n = Number(value);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency", currency, maximumFractionDigits: 6,
    }).format(Number.isFinite(n) ? n : 0);
  } catch {
    return `${currency} ${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
  }
}

function flag(code) {
  const map = { USD:"🇺🇸", EUR:"🇪🇺", GBP:"🇬🇧", NGN:"🇳🇬", JPY:"🇯🇵", CAD:"🇨🇦", AUD:"🇦🇺", CNY:"🇨🇳", INR:"🇮🇳", ZAR:"🇿🇦" };
  return map[code] || "🌐";
}

const QUICK = ["USD","EUR","GBP","NGN","JPY","CAD","AUD","CNY","INR","ZAR"];

export default function App() {
  // UI state
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("NGN");

  // data state
  const [symbols, setSymbols] = useState([]);
  const [loadingSymbols, setLoadingSymbols] = useState(true);
  const [symbolsErr, setSymbolsErr] = useState("");

  const [rate, setRate] = useState(null);
  const [rateDate, setRateDate] = useState("");
  const [rateErr, setRateErr] = useState("");
  const [loadingRate, setLoadingRate] = useState(false);

  // multi-convert state
  const [targets, setTargets] = useState(QUICK);
  const [allRates, setAllRates] = useState(null);
  const [allDate, setAllDate] = useState("");
  const [loadingAll, setLoadingAll] = useState(false);
  const [allErr, setAllErr] = useState("");

  // ---------- load ALL currencies ----------
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingSymbols(true);
      setSymbolsErr("");
      try {
        const res = await fetch(`${ERH}/symbols`);
        if (!res.ok) throw new Error();
        const data = await res.json(); // { symbols: { USD: {description}, ... } }
        const list = Object.entries(data.symbols)
          .map(([code, obj]) => ({ code, name: obj.description }))
          .sort((a, b) => a.code.localeCompare(b.code));
        if (alive) setSymbols(list);
      } catch {
        if (alive) setSymbolsErr("Failed to load currencies.");
      } finally {
        if (alive) setLoadingSymbols(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ---------- fetch single rate (any currency pair) ----------
  async function fetchRate(base, sym) {
    if (base === sym) {
      return { rate: 1, date: new Date().toISOString().slice(0,10) };
    }
    const res = await fetch(`${ERH}/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(sym)}`);
    if (!res.ok) throw new Error("rate");
    const data = await res.json(); // { date, rates: { [sym]: number } }
    const r = data?.rates?.[sym];
    if (r == null) throw new Error("rate");
    return { rate: r, date: data.date };
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!from || !to) return;
      setRateErr("");
      setLoadingRate(true);
      try {
        const { rate, date } = await fetchRate(from, to);
        if (alive) { setRate(rate); setRateDate(date); }
      } catch {
        if (alive) setRateErr(navigator.onLine ? "Could not load exchange rate." : "You appear to be offline.");
      } finally {
        if (alive) setLoadingRate(false);
      }
    })();
    return () => { alive = false; };
  }, [from, to]);

  const converted = useMemo(() => {
    const a = Number(amount);
    if (!Number.isFinite(a)) return 0;
    if (!rate) return from === to ? a : 0;
    return a * rate;
  }, [amount, rate, from, to]);

  const swap = () => { setFrom(to); setTo(from); };

  // ---------- Multi-convert (all targets from base) ----------
  const toggleTarget = (code) => {
    setTargets(prev => prev.includes(code) ? prev.filter(x => x !== code) : [...prev, code]);
  };

  const fetchAllFromBase = async () => {
    setLoadingAll(true); setAllErr(""); setAllRates(null);
    try {
      const res = await fetch(`${ERH}/latest?base=${encodeURIComponent(from)}`);
      if (!res.ok) throw new Error("all");
      const data = await res.json(); // { date, rates: {...} }
      setAllRates(data.rates);
      setAllDate(data.date);
    } catch {
      setAllErr("Failed to fetch all rates for base.");
      setAllRates(null);
    } finally {
      setLoadingAll(false);
    }
  };

  const rows = useMemo(() => {
    if (!allRates) return [];
    const a = Number(amount) || 0;
    return targets
      .filter(code => code !== from && allRates[code] != null)
      .map(code => ({ code, value: a * allRates[code] }));
  }, [allRates, amount, targets, from]);

  return (
    <div className="min-h-screen bg-grid-dark text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl
                            bg-gradient-to-br from-cyan-500 to-violet-500 text-white shadow-lg">
              💱
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Currency Converter</h1>
              <p className="text-xs text-slate-400">All currencies • Dark-first • exchangerate.host</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Main Card */}
        <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/30 p-8">
          {symbolsErr && (
            <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-200">
              {symbolsErr}
            </div>
          )}

          {/* Amount */}
          <label className="block mb-6">
            <span className="block text-sm text-slate-300 mb-2">Amount</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 100"
              className="w-full rounded-2xl border border-white/10 bg-white/10 text-white placeholder:text-slate-400 px-4 py-3
                         focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
            />
          </label>

          {/* Selectors */}
          <div className="grid gap-6 sm:grid-cols-2 mb-6">
            <div>
              <div className="mb-2 text-sm text-slate-300">From</div>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{flag(from)}</div>
                <Select value={from} onChange={setFrom} options={symbols} loading={loadingSymbols} />
              </div>
            </div>
            <div className="relative">
              <div className="mb-2 text-sm text-slate-300">To</div>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{flag(to)}</div>
                <Select value={to} onChange={setTo} options={symbols} loading={loadingSymbols} />
              </div>
              <div className="absolute -top-6 right-0">
                <button
                  onClick={swap}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full
                             bg-gradient-to-br from-cyan-500 to-violet-500 text-white
                             shadow-lg border border-white/10 hover:opacity-95"
                  title="Swap"
                >
                  ⇅
                </button>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6">
            {loadingRate ? (
              <div>
                <div className="h-6 w-3/4 rounded bg-white/10 mb-3"></div>
                <div className="h-4 w-1/2 rounded bg-white/10"></div>
              </div>
            ) : rateErr ? (
              <div className="text-rose-200">{rateErr}</div>
            ) : (
              <>
                <div className="text-xl md:text-2xl">
                  <span className="text-slate-300">{formatMoney(Number(amount) || 0, from)}</span>
                  <span className="mx-2 text-slate-500">=</span>
                  <span className="text-2xl md:text-3xl font-semibold bg-clip-text text-transparent
                                   bg-gradient-to-r from-cyan-300 to-violet-300">
                    {formatMoney(converted, to)}
                  </span>
                </div>
                <div className="mt-3 text-sm text-slate-400">
                  Rate: 1 {from} = {(from === to ? 1 : rate)?.toFixed(6)} {to}
                  {rateDate && <span className="ml-2 text-slate-500">(as of {rateDate})</span>}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Multi-Currency Conversion */}
        <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/30 p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Multi-currency conversion</h3>
            <div className="text-xs text-slate-400">{from} base{allDate ? ` • ${allDate}` : ""}</div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {QUICK.map(code => (
              <button key={code} onClick={()=>toggleTarget(code)}
                      className={`px-3 py-1.5 rounded-full border text-xs
                                  ${targets.includes(code) ? "bg-white/15 border-white/20" : "bg-white/10 border-white/10 hover:bg-white/15"}`}>
                {code}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-5">
            <button onClick={fetchAllFromBase} disabled={loadingAll}
                    className="rounded-lg border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-2 text-sm">
              {loadingAll ? "Loading…" : "Convert"}
            </button>
            {allErr && <span className="text-sm text-rose-300">{allErr}</span>}
          </div>

          {rows.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {rows.map(r => (
                <div key={r.code} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
                  <span className="text-slate-300">{r.code}</span>
                  <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-violet-300">
                    {formatMoney(r.value, r.code)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Pick some target currencies and click Convert.</p>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          React + Tailwind • Dark-first • All currencies via exchangerate.host
        </p>
      </div>
    </div>
  );
}

function Select({ value, onChange, options, loading }) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full appearance-none rounded-2xl border px-4 py-3 pr-10 text-base
                   border-white/10 bg-white/10 text-white
                   focus:outline-none focus:ring-2 focus:ring-violet-400/70"
      >
        {loading && <option>Loading…</option>}
        {!loading && options.map(opt => (
          <option key={opt.code} value={opt.code} className="bg-slate-900 text-white">
            {opt.code} — {opt.name}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">▾</span>
    </div>
  );
}
