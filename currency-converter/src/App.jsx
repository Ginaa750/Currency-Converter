import { useEffect, useMemo, useState } from "react";
import { useRates, clearRateCache } from "./hooks/useRates.jsx";

export default function App() {
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("NGN");
  const [amount, setAmount] = useState("100");

  const {
    currencies, loadingCurrencies, currencyError,
    rate, rateDate, rateError, loadingRate, converted,
    recentPairs, refreshRate, fetchAllRatesFrom,
    lastRequest, lastError,
  } = useRates({ from, to, amount });

  const same = from === to;

  return (
    <div className="min-h-screen grid place-items-center px-5 py-10 bg-grid-light dark:bg-grid-dark text-slate-900 dark:text-slate-100 relative overflow-hidden">
      {/* soft pink glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-pink-500/20 blur-3xl"></div>
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl"></div>

      <div className="w-full max-w-6xl">
        {/* HEADER */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 grid place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white shadow-lg shadow-pink-500/30">
              💱
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gradient">Pink FX Studio</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">All currencies · real-time rates</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        {/* GRID */}
        <div className="grid xl:grid-cols-3 gap-8">
          {/* LEFT: Inputs */}
          <section className="card xl:col-span-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]"></span>
              Live Conversion
            </h2>

            <div className="mt-6 space-y-6">
              {/* Amount */}
              <label className="block">
                <span className="block text-sm mb-2 text-slate-700 dark:text-slate-200">Amount</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="field"
                  placeholder="e.g. 100"
                />
              </label>

              {/* From/To */}
              <div className="grid sm:grid-cols-2 gap-5">
                <Select
                  label="From"
                  value={from}
                  onChange={setFrom}
                  currencies={currencies}
                  loading={loadingCurrencies}
                />
                <div className="relative">
                  <Select
                    label="To"
                    value={to}
                    onChange={setTo}
                    currencies={currencies}
                    loading={loadingCurrencies}
                  />
                  <button
                    className="swap-btn"
                    type="button"
                    title="Swap currencies"
                    onClick={() => { setFrom(to); setTo(from); }}
                  >
                    ⇅
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* MIDDLE: Result + Alert */}
          <section className="card space-y-6 xl:col-span-1">
            {/* Converted Result */}
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
              {loadingRate ? (
                <Skeleton />
              ) : rateError ? (
                <p className="text-rose-300">{rateError}</p>
              ) : (
                <>
                  <p className="text-sm text-slate-300">Converted Amount</p>
                  <div className="mt-1 text-4xl font-black tracking-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-300 to-fuchsia-300">
                      {Number.isFinite(converted) ? converted.toFixed(4) : "0.0000"} {to}
                    </span>
                  </div>

                  <div className="mt-3 text-sm text-slate-300">
                    Rate: <b className="text-white">{same ? 1 : rate?.toFixed(6)}</b> ({from} → {to})
                    {rateDate && <span className="ml-1 opacity-70">· {rateDate}</span>}
                  </div>

                  {same && <p className="mt-2 text-xs text-amber-300">Same currency — 1:1.</p>}
                </>
              )}
            </div>

            {/* Rate Alert */}
            <RateAlert
              base={from}
              quote={to}
              currentRate={same ? 1 : rate}
              onRefresh={refreshRate}
            />

            {/* Quick pairs */}
            {!!recentPairs.length && (
              <div>
                <p className="text-xs text-slate-400 mb-2">Recent pairs</p>
                <div className="flex flex-wrap gap-2">
                  {recentPairs.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        const [f, t] = p.split("->");
                        setFrom(f); setTo(t);
                      }}
                      className="chip"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              <button onClick={refreshRate} className="cta" type="button">Refresh</button>
              <button
                onClick={() => { clearRateCache(); location.reload(); }}
                className="ghost"
                type="button"
                title="Clear cache and reload"
              >
                Clear cache
              </button>
              <a className="ghost" href="https://api.exchangerate.host/#/" target="_blank" rel="noreferrer">API Docs</a>
            </div>

            {/* Debug while testing (remove later) */}
            <DebugBar
              lastRequest={lastRequest}
              lastError={lastError}
              rateError={rateError}
              currenciesLen={currencies?.length || 0}
              currencyError={currencyError}
            />
          </section>

          {/* RIGHT: Multi-Convert */}
          <section className="card xl:col-span-1">
            <MultiConvertPanel
              base={from}
              amount={Number(amount) || 0}
              fetchAllRatesFrom={fetchAllRatesFrom}
              currencies={currencies}
            />
          </section>
        </div>

        <footer className="mt-10 text-center text-xs text-slate-500 dark:text-slate-400">
          Built with React + Tailwind · Pink theme · All currencies supported
        </footer>
      </div>
    </div>
  );
}

/* ---------- Components ---------- */

function Select({ label, value, onChange, currencies, loading }) {
  return (
    <label className="block">
      <span className="block text-sm mb-2 text-slate-700 dark:text-slate-200">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className="field pr-10"
        >
          {loading && <option>Loading…</option>}
          {!loading && currencies.map((c) => (
            <option key={c.code} value={c.code} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
              {c.code} — {c.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
      </div>
    </label>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 w-24 rounded bg-white/10"></div>
      <div className="h-9 w-48 rounded bg-white/10"></div>
      <div className="h-4 w-56 rounded bg-white/10"></div>
    </div>
  );
}

function DebugBar({ lastRequest, lastError, rateError, currenciesLen, currencyError }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-[11px] text-pink-100/80 space-y-1">
      <div><b className="text-pink-100">Symbols loaded:</b> {currenciesLen}</div>
      <div><b className="text-pink-100">Symbols status:</b> {currencyError || "OK"}</div>
      <div><b className="text-pink-100">Last request:</b> {lastRequest || "—"}</div>
      <div><b className="text-pink-100">Rate error:</b> {rateError || "—"}</div>
      <div><b className="text-pink-100">Low-level error:</b> {lastError || "—"}</div>
    </div>
  );
}

/* ---------- NEW: Multi-Convert Panel ---------- */

function MultiConvertPanel({ base, amount, fetchAllRatesFrom, currencies }) {
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState("");

  const visible = useMemo(() => {
    const list = Object.entries(data?.rates || {})
      .map(([code, r]) => ({ code, rate: r, total: (amount || 0) * r }))
      .sort((a, b) => a.code.localeCompare(b.code));
    if (!query.trim()) return list.slice(0, 30); // show first 30 by default
    const q = query.trim().toUpperCase();
    return list.filter(x => x.code.includes(q)).slice(0, 60);
  }, [data, amount, query]);

  useEffect(() => {
    if (!base) return;
    let ok = true;
    (async () => {
      setLoadingAll(true);
      setError("");
      try {
        const res = await fetchAllRatesFrom(base);
        if (ok) setData(res);
      } catch (e) {
        if (ok) setError("Could not load all rates.");
      } finally {
        if (ok) setLoadingAll(false);
      }
    })();
    return () => { ok = false; };
  }, [base, fetchAllRatesFrom]);

  return (
    <div>
      <h3 className="text-lg font-semibold">Multi-Convert</h3>
      <p className="text-xs text-slate-300 mt-1">Convert {amount || 0} {base} into many currencies at once.</p>

      <div className="mt-4 flex gap-2">
        <input
          className="field flex-1"
          placeholder="Search currency code (e.g., EUR, NGN, GBP)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="ghost">{base}</span>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 max-h-80 overflow-auto">
        {loadingAll ? (
          <div className="p-4 text-sm text-slate-300">Loading all rates…</div>
        ) : error ? (
          <div className="p-4 text-sm text-rose-300">{error}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white/10 backdrop-blur">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Rate</th>
                <th className="px-4 py-3 font-semibold">Converted</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(({ code, rate, total }) => (
                <tr key={code} className="border-t border-white/5">
                  <td className="px-4 py-2">{code}</td>
                  <td className="px-4 py-2">{rate?.toFixed(6)}</td>
                  <td className="px-4 py-2">{Number.isFinite(total) ? total.toFixed(4) : "0.0000"}</td>
                </tr>
              ))}
              {!visible.length && (
                <tr><td className="px-4 py-4 text-slate-400" colSpan={3}>No matches.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ---------- NEW: Rate Alert ---------- */

function RateAlert({ base, quote, currentRate, onRefresh }) {
  const [target, setTarget] = useState("");
  const [direction, setDirection] = useState("at-or-above"); // 'at-or-above' | 'at-or-below'
  const [active, setActive] = useState(false);
  const [fired, setFired] = useState(false);
  const [pollMs, setPollMs] = useState(30000); // 30s

  // check condition whenever rate changes
  useEffect(() => {
    if (!active || !currentRate || !target) return;
    const t = Number(target);
    if (!Number.isFinite(t)) return;
    const ok = direction === "at-or-above" ? currentRate >= t : currentRate <= t;
    if (ok && !fired) {
      setFired(true);
      // subtle toast
      alert(`Alert: ${base}/${quote} is ${currentRate.toFixed(6)} (target ${direction.replaceAll("-", " ")} ${t})`);
    }
  }, [currentRate, target, direction, active, fired, base, quote]);

  // simple polling while active
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      onRefresh?.();
    }, Math.max(5000, pollMs));
    return () => clearInterval(id);
  }, [active, pollMs, onRefresh]);

  const arm = () => {
    if (!target) return;
    setFired(false);
    setActive(true);
  };
  const disarm = () => setActive(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
      <h3 className="text-lg font-semibold">Rate Alert</h3>
      <p className="text-xs text-slate-300 mt-1">Notify me when {base}/{quote} hits a target.</p>

      <div className="mt-4 grid md:grid-cols-3 gap-3">
        <label className="block">
          <span className="block text-xs mb-1 text-slate-300">Direction</span>
          <select className="field pr-8" value={direction} onChange={(e) => setDirection(e.target.value)}>
            <option value="at-or-above">At or above</option>
            <option value="at-or-below">At or below</option>
          </select>
        </label>

        <label className="block">
          <span className="block text-xs mb-1 text-slate-300">Target Rate</span>
          <input
            className="field"
            placeholder="e.g. 1600"
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="block text-xs mb-1 text-slate-300">Check every</span>
          <select className="field pr-8" value={pollMs} onChange={(e) => setPollMs(Number(e.target.value))}>
            <option value={15000}>15 seconds</option>
            <option value={30000}>30 seconds</option>
            <option value={60000}>1 minute</option>
          </select>
        </label>
      </div>

      <div className="mt-3 flex gap-3">
        {!active ? (
          <button className="cta" onClick={arm} disabled={!target}>Start Alert</button>
        ) : (
          <button className="ghost" onClick={disarm}>Stop Alert</button>
        )}
        <div className="text-xs text-slate-300 self-center">
          Current: {currentRate ? currentRate.toFixed(6) : "—"}
        </div>
      </div>

      {active && (
        <div className="mt-2 text-xs text-pink-200">
          Monitoring {base}/{quote}… you’ll get a popup when the target condition is met.
        </div>
      )}
    </div>
  );
}

/* ---------- Theme Toggle ---------- */

function ThemeToggle() {
  // initialize from storage or system
  if (!localStorage.getItem("theme")) {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    document.documentElement.classList.toggle("dark", prefersDark);
  } else {
    document.documentElement.classList.toggle("dark", localStorage.getItem("theme") === "dark");
  }

  const toggle = () => {
    const root = document.documentElement;
    const dark = root.classList.contains("dark");
    root.classList.toggle("dark", !dark);
    localStorage.setItem("theme", !dark ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-2 text-xs"
      type="button"
      aria-label="Toggle theme"
    >
      🌓 Theme
    </button>
  );
}
