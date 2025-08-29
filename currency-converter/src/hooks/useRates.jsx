import { useCallback, useEffect, useMemo, useState } from "react";

const HOST = "https://api.exchangerate.host";          // primary
const FALLBACK = "https://open.er-api.com/v6/latest";  // fallback (by base)
const TTL_MS = 15 * 60 * 1000; // 15 minutes

function ttlGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { t, v } = JSON.parse(raw);
    if (Date.now() - t > TTL_MS) { localStorage.removeItem(key); return null; }
    return v;
  } catch { return null; }
}
function ttlSet(key, v) { try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch {} }
function withTimeout(promise, ms, label = "timeout") {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(label)), ms)),
  ]);
}
function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => { const id = setTimeout(() => setV(value), ms); return () => clearTimeout(id); }, [value, ms]);
  return v;
}

// fallback list if /symbols fails (still covers many)
const STATIC_SYMBOLS = [
  "USD","EUR","GBP","NGN","JPY","CAD","AUD","CNY","INR","ZAR","CHF","SEK","NOK",
  "DKK","AED","SAR","GHS","KES","UGX","BRL","MXN","TRY","PLN","CZK","HUF","HKD",
  "SGD","NZD","RUB"
].map(code => ({ code, name: code }));

export function useRates({ from, to, amount }) {
  const normFrom = (from || "").trim().toUpperCase();
  const normTo   = (to   || "").trim().toUpperCase();

  // symbols/currencies
  const [currencies, setCurrencies] = useState([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [currencyError, setCurrencyError] = useState("");

  // single pair
  const [rate, setRate] = useState(null);
  const [rateDate, setRateDate] = useState("");
  const [rateError, setRateError] = useState("");
  const [loadingRate, setLoadingRate] = useState(false);

  // recent pairs
  const [recentPairs, setRecentPairs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("recentPairs") || "[]"); } catch { return []; }
  });

  // debug
  const [lastRequest, setLastRequest] = useState("");
  const [lastError, setLastError] = useState("");

  // Load ALL symbols (with cache + timeout + fallback)
  useEffect(() => {
    const ac = new AbortController();
    let alive = true;

    (async () => {
      setLoadingCurrencies(true);
      setCurrencyError("");

      const cached = ttlGet("symbols:v3");
      if (cached) {
        if (alive) { setCurrencies(cached); setLoadingCurrencies(false); }
        return;
      }

      try {
        const url = `${HOST}/symbols`;
        setLastRequest(url);
        const res = await withTimeout(fetch(url, { signal: ac.signal }), 6000, "symbols timeout");
        if (!res.ok) throw new Error(`Symbols HTTP ${res.status}`);
        const data = await res.json();
        const list = Object.entries(data?.symbols || {})
          .map(([code, obj]) => ({ code, name: obj?.description || code }))
          .sort((a, b) => a.code.localeCompare(b.code));
        if (alive) {
          setCurrencies(list);
          ttlSet("symbols:v3", list);
        }
      } catch (e) {
        if (e.name === "AbortError") return;
        setLastError(e?.message || String(e));
        console.warn("Symbols failed; using STATIC_SYMBOLS:", e);
        if (alive) {
          setCurrencies(STATIC_SYMBOLS);
          setCurrencyError("Using a fallback currency list (network issue).");
        }
      } finally {
        if (alive) setLoadingCurrencies(false);
      }
    })();

    return () => { alive = false; ac.abort(); };
  }, []);

  // Track recent pairs
  useEffect(() => {
    const pair = `${normFrom}->${normTo}`;
    if (!normFrom || !normTo || normFrom === normTo) return;
    setRecentPairs(prev => {
      const next = Array.from(new Set([pair, ...prev])).slice(0, 8);
      localStorage.setItem("recentPairs", JSON.stringify(next));
      return next;
    });
  }, [normFrom, normTo]);

  // Get a single rate (primary + fallback + TTL + timeout)
  const getRate = useCallback(async (f, t) => {
    if (!f || !t) throw new Error("Invalid pair");
    if (f === t) return { rate: 1, date: new Date().toISOString().slice(0,10) };

    const cacheKey = `rate:${f}->${t}`;
    const cached = ttlGet(cacheKey);
    if (cached) return cached;

    // Primary
    try {
      const url = `${HOST}/latest?base=${encodeURIComponent(f)}&symbols=${encodeURIComponent(t)}`;
      setLastRequest(url);
      const res = await withTimeout(fetch(url, { headers: { Accept: "application/json" } }), 6000, "primary timeout");
      if (!res.ok) throw new Error(`Primary HTTP ${res.status}`);
      const data = await res.json();
      const r = data?.rates?.[t];
      if (r == null) throw new Error("Primary missing rate");
      const value = { rate: r, date: data.date || new Date().toISOString().slice(0,10) };
      ttlSet(cacheKey, value);
      return value;
    } catch (e1) {
      setLastError(e1?.message || String(e1));
      console.warn("Primary failed:", e1);
      // Fallback
      try {
        const url2 = `${FALLBACK}/${encodeURIComponent(f)}`;
        setLastRequest(url2);
        const res2 = await withTimeout(fetch(url2, { headers: { Accept: "application/json" } }), 6000, "fallback timeout");
        if (!res2.ok) throw new Error(`Fallback HTTP ${res2.status}`);
        const data2 = await res2.json();
        const r2 = data2?.rates?.[t];
        if (r2 == null) throw new Error("Fallback missing rate");
        const date2 = data2?.time_last_update_utc
          ? new Date(data2.time_last_update_utc).toISOString().slice(0,10)
          : new Date().toISOString().slice(0,10);
        const value = { rate: r2, date: date2 };
        ttlSet(cacheKey, value);
        return value;
      } catch (e2) {
        setLastError(e2?.message || String(e2));
        console.error("Fallback failed:", e2);
        throw e1;
      }
    }
  }, []);

  const refreshRate = useCallback(async () => {
    if (!normFrom || !normTo) return;
    setRateError("");
    setLastError("");
    setLoadingRate(true);
    try {
      const { rate, date } = await getRate(normFrom, normTo);
      setRate(rate);
      setRateDate(date);
    } catch (e) {
      console.error("Fetch rate failed:", e);
      setRate(null);
      setRateDate("");
      setRateError(navigator.onLine ? "Could not load exchange rate." : "You appear to be offline.");
    } finally {
      setLoadingRate(false);
    }
  }, [normFrom, normTo, getRate]);

  useEffect(() => { refreshRate(); }, [refreshRate]);

  // debounced conversion
  const dAmount = useDebounced(amount, 200);
  const converted = useMemo(() => {
    const a = Number(dAmount);
    if (!Number.isFinite(a)) return 0;
    if (!rate) return normFrom === normTo ? a : 0;
    return a * rate;
  }, [dAmount, rate, normFrom, normTo]);

  // optional: all rates from a base
  const fetchAllRatesFrom = useCallback(async (base) => {
    const b = (base || "").trim().toUpperCase();
    if (!b) throw new Error("Base required");
    const cacheKey = `all:${b}`;
    const cached = ttlGet(cacheKey);
    if (cached) return cached;

    const url = `${HOST}/latest?base=${encodeURIComponent(b)}`;
    setLastRequest(url);
    const res = await withTimeout(fetch(url, { headers: { Accept: "application/json" } }), 6000, "all timeout");
    if (!res.ok) throw new Error(`All-rates HTTP ${res.status}`);
    const data = await res.json();
    const payload = { date: data.date || new Date().toISOString().slice(0,10), rates: data.rates || {} };
    ttlSet(cacheKey, payload);
    return payload;
  }, []);

  return {
    currencies, loadingCurrencies, currencyError,
    rate, rateDate, rateError, loadingRate, converted,
    recentPairs,
    refreshRate, fetchAllRatesFrom,
    lastRequest, lastError,
  };
}

// helper you can call to clear stale caches while testing
export function clearRateCache() {
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith("symbols:") || k.startsWith("rate:") || k.startsWith("all:")) {
      localStorage.removeItem(k);
    }
  });
}
