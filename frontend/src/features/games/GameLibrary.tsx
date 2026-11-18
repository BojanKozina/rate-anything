import { useEffect, useState } from "react";
import GameCard, { type Game, type GameCardSize } from "@/components/GameCard";


declare global {
  interface Window {
    saucer: {
      exposed: {
        getGames: () => Promise<Game[]>;
      };
    };
  }
}

const VIEW_SIZES: { value: GameCardSize; label: string }[] = [
  { value: "big", label: "Big" },
  { value: "small", label: "Small" },
];

export default function GameLibrary() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewSize, setViewSize] = useState<GameCardSize>("big");

  useEffect(() => {
    // Promise.resolve turns a missing window.saucer (frontend run outside the app) into the error UI below.
    Promise.resolve(window.saucer?.exposed.getGames())
      .then((games) => setGames(games ?? []))
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <p className="p-6 text-red-300">Couldn't load games: {error}</p>;

  return (
    <div>
      <div className="flex justify-center gap-2 p-6 pb-0">
        {VIEW_SIZES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setViewSize(value)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition ${
              viewSize === value ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-10 p-6">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            size={viewSize}
            selected={game.id === selectedId}
            onClick={() => setSelectedId(game.id)}
          />
        ))}
      </div>
    </div>
  );
}
