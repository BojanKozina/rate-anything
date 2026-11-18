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

export const STATUS: Record<GameStatus, { label: string; className: string }> = {
  1: { label: "Not started", className: "bg-[#c97b8a]" },
  2: { label: "Still playing", className: "bg-[#c9bd7e]" },
  3: { label: "Completed", className: "bg-[#6fbf73]" },
};

export function Stars({ rating, size = "text-[22px]" }: { rating: number; size?: string }) {
  return (
    <div className={`flex ${size} leading-none`} aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? "text-[#f5c518]" : "text-[#6b6b6b]"}>
          {n <= rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

// small is a straight 2x scale-down of big (264x352 -> 132x176), same source cover. Big carries its
// info under the cover; small has no room for it, so it reveals the same block on hover instead.
const SIZES = {
  big: { width: 264, padding: "px-3 pb-3 pt-2.5", title: "mb-2 text-lg", badge: "px-3 py-1 text-xs", stars: "text-[22px]" },
  small: { width: 132, padding: "px-2.5 py-2", title: "mb-1.5 text-sm", badge: "px-1.5 py-0.5 text-[10px]", stars: "text-[13px]" },
};

export type GameCardSize = keyof typeof SIZES;

type GameCardProps = {
  game: Game;
  size?: GameCardSize;
  selected?: boolean;
  onClick?: () => void;
};

export default function GameCard({ game, size = "big", selected = false, onClick }: GameCardProps) {
  const status = STATUS[game.status];
  const s = SIZES[size];
  const lift = "shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition duration-150 group-hover:-translate-y-1 group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.25)]";

  const cover = game.cover ? (
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
  );

  const info = (
    <>
      <h3 className={`truncate font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] ${s.title}`}>
        {game.name}
      </h3>

      <div className="flex items-center justify-between gap-2">
        <span className={`whitespace-nowrap rounded-sm font-medium text-[#1d1d1d] ${status.className} ${s.badge}`}>
          {status.label}
        </span>

        {game.rating !== null && <Stars rating={game.rating} size={s.stars} />}
      </div>
    </>
  );

  if (size === "small") {
    return (
      // overflow stays visible here so the panel can hang below the cover.
      <article onClick={onClick} style={{ width: s.width }} className="group relative cursor-pointer">
        <div className={`overflow-hidden rounded-md ${lift}`}>{cover}</div>

        <div
          className={`pointer-events-none absolute left-1/2 top-full z-10 mt-1 w-44 -translate-x-1/2 origin-top
            scale-95 rounded-md border border-white/15 bg-[#1d1d1d]/95 opacity-0
            shadow-[0_8px_20px_rgba(0,0,0,0.5)] backdrop-blur-xl backdrop-saturate-150 transition duration-150
            group-hover:scale-100 group-hover:opacity-100 ${s.padding}`}
        >
          {info}
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={onClick}
      style={{ width: s.width }}
      className={`group relative cursor-pointer overflow-hidden rounded-md ${lift}`}
    >
      {cover}

      <div className={`border-t border-white/15 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-xl backdrop-saturate-150 ${s.padding}`}>
        {info}
      </div>
    </article>
  );
}
