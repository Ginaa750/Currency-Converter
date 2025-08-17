import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const BASE = "https://api.frankfurter.app";

// tiny debounce
function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export function useRates({ from, to, amount }) {
  // currencies
  const [currencies, setCurrencies] = useState([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [currencyError, setCurrencyError] = useState("");

  // rate + meta
  const [rate, setRate] = useState(null);
  const [rateDate, setRateDate] = useState("");
  const [rateError, setRateError] = useState("");
  const [loadingRate, setLoadingRate] = useState(false);

  // trend
  const [trend, setTrend] = useState(null);
  const [trendError, setTrendError] = useState("");
  const [loadingTrend, setLoadingTrend] = useState(false);

  // caches
  const rateCache = useRef(new Map());   // "USD->EUR" -> {rate, date}
  const trendCache = useRef(new Map());  // "USD->EUR" -> [{date, value}]

  // recent pairs
  const [recentPairs, setRecentPairs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recentPairs") || "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => {
    const pair = `${from}->${to}`;
    if (!from || !to || from === to) return;
    setRecentPairs((prev) => {
      const set = new Set([pair, ...prev]);
      const list = Array.from(set).slice(0, 5);
      localStorage.setItem("recentPairs", JSON.stringify(list));
      return list;
    });
  }, [from, to]);

  // load currencies once
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoadingCurrencies(true);
      setCurrencyError("");
      try {
        const res = await fetch(`${BASE}/currencies`);
        if (!res.ok) throw new Error("Failed to load currencies");
        const json = await res.json(); // { USD: "United States Dollar", ... }
        if (ignore) return;
        const list = Object.entries(json)
          .map(([code, name]) => ({ code, name }))
          .sort((a, b) => a.code.localeCompare(b.code));
        setCurrencies(list);
      } catch (e) {
        if (!ignore) setCurrencyError("Could not load currencies.");
      } finally {
        if (!ignore) setLoadingCurrencies(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  // debounced amount to avoid constant refetch while typing
  const dAmount = useDebounced(amount, 300);

  const getRate = useCallback(async (from, to) => {
    if (from === to) return { rate: 1, date: new Date().toISOString().slice(0,10) };
    const key = `${from}->${to}`;
    if (rateCache.current.has(key)) return rateCache.current.get(key);

    const res = await fetch(`${BASE}/latest?from=${from}&to=${to}`);
    if (!res.ok) throw new Error("Rate fetch failed");
    const json = await res.json(); // { date, rates: { [to]: number } }
    const r = json.rates?.[to];
    if (!r) throw new Error("No rate for target currency");
    const value = { rate: r, date: json.date };
    rateCache.current.set(key, value);
    return value;
  }, []);

  // load current rate (depends on from/to)
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!from || !to) return;
      setRateError("");
      setLoadingRate(true);
      try {
        const { rate, date } = await getRate(from, to);
        if (!ignore) {
          setRate(rate);
          setRateDate(date);
        }
      } catch (e) {
        if (!ignore) setRateError(
          navigator.onLine ? "Could not load exchange rate." : "You appear to be offline."
        );
      } finally {
        if (!ignore) setLoadingRate(false);
      }
    })();
    return () => { ignore = true; };
  }, [from, to, getRate]);

  // compute converted value when amount/rate changes
  const converted = useMemo(() => {
    const n = Number(dAmount);
    if (!Number.isFinite(n)) return 0;
    if (!rate) return from === to ? n : 0;
    return n * rate;
  }, [dAmount, rate, from, to]);

  // load 7-day trend on demand
  const loadTrend = useCallback(async (from, to) => {
    const key = `${from}->${to}`;
    if (trendCache.current.has(key)) return trendCache.current.get(key);

    const now = new Date();
    const end = now.toISOString().slice(0,10);
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
    const start = startDate.toISOString().slice(0,10);

    const res = await fetch(`${BASE}/${start}..${end}?from=${from}&to=${to}`);
    if (!res.ok) throw new Error("Trend fetch failed");
    const json = await res.json(); // { rates: { "YYYY-MM-DD": { [to]: number } } }
    const points = Object.entries(json.rates)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([date, obj]) => ({ date, value: obj[to] }));
    trendCache.current.set(key, points);
    return points;
  }, []);

  const fetchTrend = useCallback(async () => {
    setTrendError("");
    setLoadingTrend(true);
    try {
      const points = await loadTrend(from, to);
      setTrend(points);
    } catch (e) {
      setTrendError("Could not load trend.");
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
