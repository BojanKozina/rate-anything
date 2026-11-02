import { useEffect, useState } from "react";
import GameCard, { type Game } from "@/components/GameCard";


declare global {
  interface Window {
    saucer: {
      exposed: {
        getGames: () => Promise<Game[]>;
      };
    };
  }
}

export default function GameLibrary() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.saucer.exposed
      .getGames()
      .then(setGames)
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <p className="p-6 text-red-300">Couldn't load games: {error}</p>;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-10 p-6">
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          selected={game.id === selectedId}
          onClick={() => setSelectedId(game.id)}
        />
      ))}
    </div>
  );
}
