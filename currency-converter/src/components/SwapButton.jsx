export default function SwapButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-full hover:opacity-90"
      title="Swap currencies"
      type="button"
    >
      ⇅ Swap
    </button>
  );
}
