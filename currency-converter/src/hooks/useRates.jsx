import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Providers
const FRANKFURTER = "https://api.frankfurter.app"; // fast, no key (no NGN)
const OPEN_ER = "https://open.er-api.com/v6/latest"; // supports NGN, no key

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
  const [currencies, setCurrencies] = useState([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [currencyError, setCurrencyError] = useState("");

  // rate
  const [rate, setRate] = useState(null);
  const [rateDate, setRateDate] = useState("");
  const [rateError, setRateError] = useState("");
  const [loadingRate, setLoadingRate] = useState(false);

  // trend
  const [trend, setTrend] = useState(null);
  const [trendError, setTrendError] = useState("");
  const [loadingTrend, setLoadingTrend] = useState(false);

  // caches
  const rateCache = useRef(new Map());
  const trendCache = useRef(new Map());

  // recent pairs
  const [recentPairs, setRecentPairs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("recentPairs") || "[]"); }
    catch { return []; }
  });

  useEffect(() => {
    const pair = `${from}->${to}`;
    if (!from || !to || from === to) return;
    setRecentPairs((prev) => {
      const next = Array.from(new Set([pair, ...prev])).slice(0, 6);
      localStorage.setItem("recentPairs", JSON.stringify(next));
      return next;
    });
  }, [from, to]);

  // load currency list (ensure NGN exists)
  useEffect(() => {
    let ok = true;
    (async () => {
      setLoadingCurrencies(true);
      setCurrencyError("");
      try {
        const res = await fetch(`${FRANKFURTER}/currencies`);
        if (!res.ok) throw new Error();
        const json = await res.json(); // { USD: "United States Dollar", ... } (no NGN)
        if (!ok) return;
        const list = Object.entries(json)
          .map(([code, name]) => ({ code, name }))
          .concat([{ code: "NGN", name: "Nigerian Naira" }])
          .filter((v, i, arr) => arr.findIndex(x => x.code === v.code) === i)
          .sort((a, b) => a.code.localeCompare(b.code));
        setCurrencies(list);
      } catch {
        if (ok) setCurrencyError("Failed to load currencies.");
      } finally {
        if (ok) setLoadingCurrencies(false);
      }
    })();
    return () => { ok = false; };
  }, []);

  // fetch a rate
  const getRate = useCallback(async (f, t) => {
    if (f === t) {
      return { rate: 1, date: new Date().toISOString().slice(0, 10) };
    }

    if (f === "NGN" || t === "NGN") {
      const res = await fetch(`${OPEN_ER}/${f}`);
      if (!res.ok) throw new Error("rate");
      const data = await res.json();
      const r = data && data.rates ? data.rates[t] : undefined;
      if (!r) throw new Error("rate");
      const date = data && data.time_last_update_utc
        ? new Date(data.time_last_update_utc).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      return { rate: r, date };
    }

    const key = `${f}->${t}`;
    if (rateCache.current.has(key)) return rateCache.current.get(key);

    const res = await fetch(`${FRANKFURTER}/latest?from=${f}&to=${t}`);
    if (!res.ok) throw new Error("rate");
    const data = await res.json();
    const r = data && data.rates ? data.rates[t] : undefined;
    if (!r) throw new Error("rate");
    const value = { rate: r, date: data.date };
    rateCache.current.set(key, value);
    return value;
  }, []);

  // load current rate when from/to change
  useEffect(() => {
    let ok = true;
    (async () => {
      if (!from || !to) return;
      setRateError("");
      setLoadingRate(true);
      try {
        const v = await getRate(from, to);
        if (ok) { setRate(v.rate); setRateDate(v.date); }
      } catch {
        if (ok) setRateError(navigator.onLine ? "Could not load exchange rate." : "You appear to be offline.");
      } finally {
        if (ok) setLoadingRate(false);
      }
    })();
    return () => { ok = false; };
  }, [from, to, getRate]);

  // compute converted with debounced amount
  const debouncedAmount = useDebounced(amount, 250);
  const converted = useMemo(() => {
    const a = Number(debouncedAmount);
    if (!Number.isFinite(a)) return 0;
    if (!rate) return from === to ? a : 0;
    return a * rate;
  }, [debouncedAmount, rate, from, to]);

  // load 7d trend (skip NGN)
  const loadTrend = useCallback(async (f, t) => {
    if (f === "NGN" || t === "NGN") {
      throw new Error("Trend unavailable for NGN on this free source.");
    }
    const key = `${f}->${t}`;
    if (trendCache.current.has(key)) return trendCache.current.get(key);

    const now = new Date();
    const end = now.toISOString().slice(0, 10);
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    const startStr = start.toISOString().slice(0, 10);

    const res = await fetch(`${FRANKFURTER}/${startStr}..${end}?from=${f}&to=${t}`);
    if (!res.ok) throw new Error("trend");
    const data = await res.json();
    const points = Object.entries(data.rates)
      .sort(function(a,b){ return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; })
      .map(function(entry){ return { date: entry[0], value: entry[1][t] }; });
    trendCache.current.set(key, points);
    return points;
  }, []);

  const fetchTrend = useCallback(async () => {
    setTrendError("");
    setLoadingTrend(true);
    try {
      const pts = await loadTrend(from, to);
      setTrend(pts);
    } catch (e) {
      setTrend(null);
      setTrendError(e && e.message ? e.message : "Could not load trend.");
    } finally {
      setLoadingTrend(false);
    }
  }, [from, to, loadTrend]);

  return {
    currencies,
    loadingCurrencies,
    currencyError,
    rate,
    rateDate,
    rateError,
    loadingRate,
    converted,
    recentPairs,
    trend,
    trendError,
    loadingTrend,
    fetchTrend,
  };
}
