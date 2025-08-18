import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement; // <html>
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((v) => !v)}
      className="ml-3 rounded-lg border px-3 py-1.5 text-xs
                 border-slate-200 bg-white/70 hover:bg-white
                 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
    >
      {dark ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
