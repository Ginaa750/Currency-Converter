export default function SwapButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Swap currencies"
      aria-label="Swap currencies"
      className="btn inline-flex h-11 w-11 items-center justify-center rounded-full
                 bg-gradient-to-br from-brand-500 to-grape-500 text-white
                 shadow-lg shadow-brand-500/20 border border-white/10 hover:opacity-95"
    >
      ⇅
    </button>
  );
}
