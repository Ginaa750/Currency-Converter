export default function FavoritesBar({ favorites, recentPairs, onSelectPair, onToggleFavorite, activePair }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-slate-400 mb-2">Favorites</div>
        <div className="flex flex-wrap gap-2">
          {favorites.length === 0 && (
            <span className="text-xs text-slate-500">No favorites yet. Click the ★ next to a pair to save it.</span>
          )}
          {favorites.map((p) => (
            <button
              key={`fav-${p}`}
              onClick={() => onSelectPair(p)}
              className={`chip ${activePair===p ? "ring-1 ring-cyan-300/60" : ""}`}
              title="Use this pair"
            >
              ★ {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-slate-400 mb-2">Recent</div>
        <div className="flex flex-wrap gap-2">
          {recentPairs.map((p) => (
            <button
              key={`rec-${p}`}
              onClick={() => onSelectPair(p)}
              className="chip"
              title="Use this pair"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
