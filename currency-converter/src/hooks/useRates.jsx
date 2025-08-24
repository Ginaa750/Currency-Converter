import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Single provider that supports (nearly) all currencies + NGN + timeseries:
const HOST = "https://api.exchangerate.host";

function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function useRates({ from, to, amount }) {
  // currencies
  const [currencies, setCurrencies] = useState([]); // [{code, name}]
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [currencyError, setCurrencyError] = useState("");

  // single rate
  const [rate, setRate] = useState(null);
  const [rateDate, setRateDate] = useState("");
  const [rateError, setRateError] = useState("");
  const [loadingRate, setLoadingRate] = useState(false);

  // caches
  const rateCache = useRef(new Map());
  const timeseriesCache = useRef(new Map());

  // recents
  const [recentPairs, setRecentPairs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("recentPairs") || "[]"); }
    catch { return []; }
  });

  useEffect(() => {
    const pair = `${from}->${to}`;
    if (!from || !to || from === to) return;
    setRecentPairs(prev => {
      const next = Array.from(new Set([pair, ...prev])).slice(0, 8);
      localStorage.setItem("recentPairs", JSON.stringify(next));
      return next;
    });
  }, [from, to]);

  // load symbols (all currencies)
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoadingCurrencies(true);
      setCurrencyError("");
      try {
        const res = await fetch(`${HOST}/symbols`, { signal: ac.signal });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const list = Object.entries(data.symbols || {})
          .map(([code, obj]) => ({ code, name: obj.description || code }))
          .sort((a, b) => a.code.localeCompare(b.code));
        setCurrencies(list);
      } catch {
        if (!ac.signal.aborted) setCurrencyError("Failed to load currencies.");
      } finally {
        if (!ac.signal.aborted) setLoadingCurrencies(false);
      }
    })();
    return () => ac.abort();
  }, []);

  // get single rate
  const getRate = useCallback(async (f, t) => {
    if (f === t) return { rate: 1, date: new Date().toISOString().slice(0, 10) };
    const key = `${f}->${t}`;
    if (rateCache.current.has(key)) return rateCache.current.get(key);

    const res = await fetch(`${HOST}/latest?base=${encodeURIComponent(f)}&symbols=${encodeURIComponent(t)}`);
    if (!res.ok) throw new Error("rate");
    const data = await res.json();
    const r = data?.rates?.[t];
    if (r == null) throw new Error("rate");
    const value = { rate: r, date: data.date || new Date().toISOString().slice(0,10) };
    rateCache.current.set(key, value);
    return value;
  }, []);

  const refreshRate = useCallback(async () => {
    if (!from || !to) return;
    setRateError("");
    setLoadingRate(true);
    try {
      const { rate, date } = await getRate(from, to);
      setRate(rate);
      setRateDate(date);
    } catch {
      setRateError(navigator.onLine ? "Could not load exchange rate." : "You appear to be offline.");
    } finally {
      setLoadingRate(false);
    }
  }, [from, to, getRate]);

  useEffect(() => { refreshRate(); }, [refreshRate]);

  // debounced conversion
  const dAmount = useDebounced(amount, 250);
  const converted = useMemo(() => {
    const a = Number(dAmount);
    if (!Number.isFinite(a)) return 0;
    if (!rate) return from === to ? a : 0;
    return a * rate;
  }, [dAmount, rate, from, to]);

  // fetch all rates from base (for multi-convert)
  const fetchAllRatesFrom = useCallback(async (base) => {
    const res = await fetch(`${HOST}/latest?base=${encodeURIComponent(base)}`);
    if (!res.ok) throw new Error("rates");
    const data = await res.json();
    return { date: data.date || new Date().toISOString().slice(0,10), rates: data.rates || {} };
  }, []);

  // timeseries / historical trend
  const fetchTimeseries = useCallback(async (f, t, start, end) => {
    const key = `${f}->${t}:${start}:${end}`;
    if (timeseriesCache.current.has(key)) return timeseriesCache.current.get(key);

    const res = await fetch(
      `${HOST}/timeseries?start_date=${start}&end_date=${end}&base=${encodeURIComponent(f)}&symbols=${encodeURIComponent(t)}`
    );
    if (!res.ok) throw new Error("timeseries");
    const data = await res.json();
    const rates = data.rates || {};
    const points = Object.entries(rates)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([date, obj]) => ({ date, value: obj[t] }));
    timeseriesCache.current.set(key, points);
    return points;
  }, []);

  return {
    // data
    currencies, loadingCurrencies, currencyError,
    rate, rateDate, rateError, loadingRate, converted,
    recentPairs,
    // actions
    refreshRate, fetchAllRatesFrom, fetchTimeseries,
  };
}
