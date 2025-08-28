useEffect(() => {
  const ac = new AbortController();
  let alive = true;

  (async () => {
    setLoadingCurrencies(true);
    setCurrencyError("");

    const cached = ttlGet("symbols:v1");
    if (cached) {
      if (alive) setCurrencies(cached);
      if (alive) setLoadingCurrencies(false);
      return;
    }

    try {
      const res = await fetch(`${HOST}/symbols`, { signal: ac.signal });
      if (!res.ok) throw new Error(`Symbols HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.symbols) throw new Error("Symbols payload missing");

      const list = Object.entries(data.symbols)
        .map(([code, obj]) => ({ code, name: obj.description || code }))
        .sort((a, b) => a.code.localeCompare(b.code));

      if (alive) {
        setCurrencies(list);
        ttlSet("symbols:v1", list);
      }
    } catch (e) {
      if (e.name === "AbortError") return; // ignore
      if (alive) {
        console.error("Symbols fetch failed:", e);
        setCurrencyError("Failed to load currency list. Please refresh.");
      }
    } finally {
      if (alive) setLoadingCurrencies(false);
    }
  })();

  return () => {
    alive = false;
    ac.abort();
  };
}, []);
