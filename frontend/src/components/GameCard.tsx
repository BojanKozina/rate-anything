// Matches the "Status" column in the database: 1 Not started, 2 Playing, 3 Completed
export type GameStatus = 1 | 2 | 3;

// Same shape as GameDto in main.cpp
export type Game = {
  id: number;
  name: string;
  status: GameStatus;
  rating: number | null;
  cover: string | null;
};

const STATUS: Record<GameStatus, { label: string; className: string }> = {
  1: { label: "Not started", className: "bg-[#c97b8a]" },
  2: { label: "Still playing", className: "bg-[#c9bd7e]" },
  3: { label: "Completed", className: "bg-[#6fbf73]" },
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex text-[22px] leading-none" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? "text-[#f5c518]" : "text-[#6b6b6b]"}>
          {n <= rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

type GameCardProps = {
  game: Game;
  selected?: boolean;
  onClick?: () => void;
};

export default function GameCard({ game, selected = false, onClick }: GameCardProps) {
  const status = STATUS[game.status];

  return (
    <article
      onClick={onClick}
      className={`relative cursor-pointer overflow-hidden rounded-md  shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition duration-150
        hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.25)]
        `}
    >
      {game.cover ? (
        <img
          src={`/${game.cover}`} // "covers/far-cry-3.webp" -> served from public/covers/
          alt={game.name}
          loading="lazy"
          draggable={false}
          className="block aspect-[3/4] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[3/4] w-full items-center justify-center bg-black/20 text-sm text-white/60">
          No cover
        </div>
      )}

      <div className="border-t border-white/15 bg-white/10 px-3 pb-3 pt-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-xl backdrop-saturate-150">
        <h3 className="mb-2 truncate text-lg font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          {game.name}
        </h3>

        <div className="flex items-center justify-between gap-2">
          <span
            className={`whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium text-[#1d1d1d] ${status.className}`}
          >
            {status.label}
          </span>

          {game.rating !== null && <Stars rating={game.rating} />}
        </div>
      </div>
    </article>
  );
}
