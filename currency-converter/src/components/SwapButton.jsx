export default function SwapButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover-float inline-flex items-center justify-center h-9 w-9 rounded-full
                 bg-gradient-to-br from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/20
                 border border-white/10 hover:opacity-95"
      title="Swap currencies"
      aria-label="Swap currencies"
    >
      ⇅
    </button>
  );
}
