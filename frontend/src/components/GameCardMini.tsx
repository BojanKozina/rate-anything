import { STATUS, Stars, type Game } from "@/components/GameCard";

type GameCardMiniProps = {
  game: Game;
  onClick?: () => void;
};

export default function GameCardMini({ game, onClick }: GameCardMiniProps) {
  const status = STATUS[game.status];

  return (
    <article onClick={onClick} style={{ width: 66 }} className="group relative cursor-pointer">
      <div className="overflow-hidden rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition duration-150 group-hover:-translate-y-1 group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
        {game.cover ? (
          <img
            src={`/${game.cover}`}
            alt={game.name}
            loading="lazy"
            draggable={false}
            className="block aspect-[3/4] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[3/4] w-full items-center justify-center bg-black/20 text-xs text-white/60">
            No cover
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 w-36 -translate-x-1/2 origin-top scale-95 rounded-md border border-white/15 bg-[#1d1d1d]/95 px-2.5 py-2 opacity-0 shadow-[0_8px_20px_rgba(0,0,0,0.5)] backdrop-blur-xl backdrop-saturate-150 transition duration-150 group-hover:scale-100 group-hover:opacity-100">
        <h3 className="mb-1.5 truncate text-xs font-bold text-white">{game.name}</h3>
        <div className="flex flex-col items-start gap-1.5">
          <span className={`whitespace-nowrap rounded-sm px-1.5 py-0.5 text-[10px] font-medium text-[#1d1d1d] ${status.className}`}>
            {status.label}
          </span>
          {game.rating !== null && <Stars rating={game.rating} size="text-[13px]" />}
        </div>
      </div>
    </article>
  );
}
