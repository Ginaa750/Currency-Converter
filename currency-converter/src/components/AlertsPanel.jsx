import { useEffect, useMemo, useRef, useState } from "react";

function keyFor(from, to) {
  return `alert:${from}->${to}`;
}

export default function AlertsPanel({ from, to, rate, onRefresh }) {
  const [enabled, setEnabled] = useState(false);
  const [dir, setDir] = useState("above"); // "above" | "below"
  const [threshold, setThreshold] = useState("");
  const [autocheck, setAutocheck] = useState(true); // poll every 60s
  const timer = useRef(null);

  // Load saved alert when pair changes
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(keyFor(from, to)) || "null");
      if (saved) {
        setEnabled(true);
        setDir(saved.dir);
        setThreshold(String(saved.threshold));
        setAutocheck(saved.autocheck ?? true);
      } else {
        setEnabled(false);
        setDir("above");
        setThreshold("");
        setAutocheck(true);
      }
    } catch {
      setEnabled(false);
    }
  }, [from, to]);

  // Auto-check every 60s (optional)
  useEffect(() => {
    if (!enabled || !autocheck) return;
    // kick one immediate refresh so users see status right away
    onRefresh?.();
    timer.current = setInterval(() => onRefresh?.(), 60000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [enabled, autocheck, onRefresh, from, to]);

  const triggered = useMemo(() => {
    const thr = Number(threshold);
    if (!enabled || !Number.isFinite(thr) || rate == null) return false;
    return (dir === "above" ? rate >= thr : rate <= thr);
  }, [enabled, threshold, rate, dir]);

  const save = () => {
    const thr = Number(threshold);
    if (!Number.isFinite(thr)) return;
    const payload = { dir, threshold: thr, autocheck };
    localStorage.setItem(keyFor(from, to), JSON.stringify(payload));
    setEnabled(true);
  };

  const remove = () => {
    localStorage.removeItem(keyFor(from, to));
    setEnabled(false);
  };

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 backdrop-blur-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Rate alert</h3>
        <div className="text-xs text-slate-400">{from} → {to}</div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-3">
        <label className="block">
          <span className="block text-xs text-slate-400 mb-1">Direction</span>
          <select
            value={dir}
            onChange={(e)=>setDir(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/10 text-white px-3 py-2 text-sm"
          >
            <option value="above">At or above</option>
            <option value="below">At or below</option>
          </select>
        </label>

        <label className="block">
          <span className="block text-xs text-slate-400 mb-1">Threshold</span>
          <input
            type="number"
            step="any"
            value={threshold}
            onChange={(e)=>setThreshold(e.target.value)}
            placeholder="e.g. 1500"
            className="w-full rounded-lg border border-white/10 bg-white/10 text-white px-3 py-2 text-sm"
          />
        </label>

        <div className="flex items-end gap-2">
          <button
            onClick={save}
            className="rounded-lg border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-2 text-sm"
          >
            Save alert
          </button>
          <button
            onClick={remove}
            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onRefresh}
          className="rounded-lg border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-2 text-xs"
        >
          Refresh rate
        </button>

        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={autocheck}
            onChange={(e)=>setAutocheck(e.target.checked)}
          />
          Auto-check every 60s
        </label>

        <span className="text-xs text-slate-400">
          Current: {rate != null ? rate.toFixed(6) : "—"}
        </span>
      </div>

      {enabled && (
        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm
            ${triggered
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : "border-white/10 bg-white/5 text-slate-300"}`}>
          {triggered
            ? <>🔔 Alert triggered: 1 {from} is {dir} {threshold} {to}.</>
            : <>Alert saved. You’ll be notified here when the condition is met.</>}
        </div>
      )}
    </div>
  );
}
