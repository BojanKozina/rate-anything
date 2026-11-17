import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import TiltedCard from '@/components/TiltedCard';
import ColorBends from '@/components/ColorBends';
import GradientASCII from '@/components/GradientASCII';
import Grainient from '@/components/Grainient';
import GameLibrary from '@/features/games/GameLibrary';
import type { Game } from '@/components/GameCard';

import tallImage from '@/assets/TestImageTall.jpg';
import posterImage from '@/assets/TestImageTallV2.jpg';

const GREETINGS = [
  'Welcome back.',
  'What are we rating today?',
  'Any new recommendations?',
  'Picking up where you left off?',
  'Something worth a five today?',
];

// Each section owns a full background (Home falls through to the app's PatternWaves) and an accent
// for its ring and heading. ColorBends is the one with no usable built-in palette — its own default
// is an empty array, which renders black — so it gets the purple the ReactBits demo ships with.
const colorBends = () => <ColorBends className="h-full w-full" colors={['#A855F7']} />;

const JOURNEY = [
  { id: 'home',   label: 'Home',   Background: null,         accent: '#e8e8e8', image: null,        blurb: '' },
  { id: 'movies', label: 'Movies', Background: Grainient,    accent: '#ffb703', image: posterImage, blurb: 'Every film and show you have sat through.' },
  { id: 'books',  label: 'Books',  Background: colorBends,   accent: '#219ebc', image: posterImage, blurb: 'Everything you have read, rated and shelved.' },
  { id: 'games',  label: 'Games',  Background: GradientASCII, accent: '#8ecae6', image: tallImage,  blurb: 'Your library, from backlog to finished.' },
];

/** Wheel distance, in pixels, swallowed silently at a section edge before the prompt even appears,
 *  so running off the end of a section does not immediately arm anything. */
const ARM_DISTANCE = 80;
/** Further wheel distance, once armed, needed to fill the ring and cross over. */
const GATE_DISTANCE = 700;
const TRANSITION_MS = 900;
/** Dead time after landing, so leftover momentum cannot carry you straight through the next section. */
const COOLDOWN_MS = 400;

/** Cover of a random game the user has already rated, or null if there is none yet. */
function pickRatedCover(games: Game[]) {
  const rated = games.filter(game => game.rating !== null && game.cover);
  if (!rated.length) return null;
  return `/${rated[Math.floor(Math.random() * rated.length)].cover}`;
}

const RING_RADIUS = 11;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const RING_BOX = 26; // ring on top, label centred underneath it

/** The prompt that replaces scrolling at a section edge. Clicking it skips the fill. */
function Gate({ label, progress, accent, dir, onSkip }: {
  label: string; progress: number; accent: string; dir: 1 | -1; onSkip: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSkip}
      // motion owns transform, so the centring offset lives here, not in a Tailwind -translate class.
      initial={{ opacity: 0, y: dir > 0 ? 10 : -10, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: dir > 0 ? 10 : -10, x: '-50%' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={dir > 0 ? { bottom: '5.5rem' } : { top: '3rem' }} // sits just above the dock
      className="absolute left-1/2 z-30 flex cursor-pointer flex-col items-center gap-2 outline-none
        focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <svg width={RING_BOX} height={RING_BOX} viewBox={`0 0 ${RING_BOX} ${RING_BOX}`} className="shrink-0 -rotate-90" aria-hidden>
        <circle cx={RING_BOX / 2} cy={RING_BOX / 2} r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
        <circle
          cx={RING_BOX / 2} cy={RING_BOX / 2} r={RING_RADIUS} fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 120ms linear' }}
        />
      </svg>

      <span className="whitespace-nowrap text-xs font-medium tracking-wide text-white/55 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
        {label}
      </span>
    </motion.button>
  );
}

export default function HomePage() {
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const [gamesCover, setGamesCover] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [gate, setGate] = useState<{ dir: 1 | -1; distance: number } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  // Mirrors `gate` so the wheel handler can accumulate without reading stale state. Deciding inside
  // a setGate updater instead would mutate refs in a render React can discard, wedging the gate.
  const gateRef = useRef<{ dir: 1 | -1; distance: number } | null>(null);
  const reduceMotion = useReducedMotion();

  const armGate = (value: { dir: 1 | -1; distance: number } | null) => {
    gateRef.current = value;
    setGate(value);
  };

  const section = JOURNEY[index];

  useEffect(() => {
    // Promise.resolve also covers running the frontend outside the app, where window.saucer is missing.
    Promise.resolve(window.saucer?.exposed.getGames())
      .then(games => setGamesCover(games ? pickRatedCover(games) : null))
      .catch(() => setGamesCover(null)) // hub still works on the placeholder cover
      .finally(() => setReady(true));
  }, []);

  // Keyed by section id: during a transition the outgoing layer is still mounted next to this one.
  const scroller = useCallback(
    () => rootRef.current?.querySelector<HTMLElement>(`[data-scroller="${section.id}"]`) ?? null,
    [section.id],
  );

  const go = useCallback((to: number, from: 1 | -1) => {
    if (busy.current) return;
    busy.current = true;
    gateRef.current = null;
    setGate(null);
    setDir(from);
    setIndex((to + JOURNEY.length) % JOURNEY.length); // the journey wraps in both directions
    window.setTimeout(
      () => { busy.current = false; },
      reduceMotion ? 0 : TRANSITION_MS + COOLDOWN_MS,
    );
  }, [reduceMotion]);

  // The wheel drives the gate once the section itself has nothing left to scroll.
  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (busy.current) { event.preventDefault(); return; }

      const el = scroller();
      const down = event.deltaY > 0;

      const edge = !el || (down
        ? el.scrollTop + el.clientHeight >= el.scrollHeight - 2
        : el.scrollTop <= 2);

      if (!edge) {
        if (gateRef.current) armGate(null); // back inside the content: let it scroll, drain the ring
        return;
      }

      event.preventDefault();

      const heading: 1 | -1 = down ? 1 : -1;
      const carried = gateRef.current?.dir === heading ? gateRef.current.distance : 0;
      const distance = carried + Math.abs(event.deltaY);

      if (distance >= ARM_DISTANCE + GATE_DISTANCE) {
        go(index + heading, heading);
        return;
      }
      armGate({ dir: heading, distance });
    };

    const node = rootRef.current;
    node?.addEventListener('wheel', onWheel, { passive: false });
    return () => node?.removeEventListener('wheel', onWheel);
  }, [go, index, scroller]);

  // Land at the edge you came from, so reversing feels continuous rather than teleporting.
  useLayoutEffect(() => {
    const el = scroller();
    if (el) el.scrollTop = dir > 0 ? 0 : el.scrollHeight;
  }, [index, dir, scroller]);

  // The first ARM_DISTANCE of a gate is absorbed silently; only past it does the prompt show.
  const armed = Boolean(gate && gate.distance > ARM_DISTANCE);
  const progress = gate ? Math.min(1, Math.max(0, (gate.distance - ARM_DISTANCE) / GATE_DISTANCE)) : 0;
  const next = JOURNEY[(index + 1) % JOURNEY.length];
  const previous = JOURNEY[(index - 1 + JOURNEY.length) % JOURNEY.length];

  return (
    <div ref={rootRef} className="relative h-full overflow-hidden">
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={section.id}
          custom={dir}
          variants={{
            enter: (d: number) => reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 1.07, clipPath: `circle(0% at 50% ${d > 0 ? 94 : 6}%)` },
            center: (d: number) => reduceMotion
              ? { opacity: 1 }
              : { opacity: 1, scale: 1, clipPath: `circle(140% at 50% ${d > 0 ? 94 : 6}%)` },
            exit: () => reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.94, filter: 'blur(8px)' },
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: reduceMotion ? 0 : TRANSITION_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-10"
        >
          {/* Outside the scroller, so the background stays put while the content moves over it.
              The opaque base matters: these render with alpha, so without it the app's PatternWaves
              shows through and reads as a dot pattern laid over the stage. */}
          {section.Background && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#0b0909]">
              <section.Background />
            </div>
          )}

          <div
            data-scroller={section.id}
            className="absolute inset-0 overflow-y-auto overscroll-contain [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin]"
          >
          {section.id === 'home' ? (
            // pb reserves the dock-plus-gate strip, so the cards centre above it instead of
            // growing into it once the window gets short.
            <div className="flex min-h-full flex-col items-center justify-center gap-12 pb-36">
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-3xl font-semibold text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
              >
                {greeting}
              </motion.h1>

              {ready && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                  className="flex flex-wrap items-center justify-center gap-6"
                >
                  {JOURNEY.slice(1).map((entry, offset) => (
                    <button
                      key={entry.id}
                      type="button"
                      className="cursor-target rounded-[15px] outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                      data-cursor-label={`Go to ${entry.label}`}
                      onClick={() => go(offset + 1, 1)}
                    >
                      <TiltedCard
                        imageSrc={entry.id === 'games' ? gamesCover ?? entry.image! : entry.image!}
                        altText={entry.label}
                        // Fixed px on a tall window, but vh-capped so a short one (the app's
                        // 800x600 minimum) shrinks the cards instead of running them into the gate.
                        imageWidth="min(260px, 27vh)"
                        imageHeight="min(390px, 41vh)"
                        containerWidth="min(260px, 27vh)"
                        containerHeight="min(420px, 44vh)"
                        rotateAmplitude={12}
                        scaleOnHover={1.05}
                        showMobileWarning={false}
                        displayOverlayContent
                        overlayContent={
                          <p className="m-4 rounded-lg bg-black/40 px-3 py-1 text-lg font-semibold text-white backdrop-blur-sm">
                            {entry.label}
                          </p>
                        }
                      />
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          ) : (
            <div className="min-h-full">
              <div className="flex flex-col items-center justify-center gap-4 px-8 pb-10 pt-24 text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  // White, not the accent: the backgrounds are vivid and light in places, and an
                  // accent-coloured heading disappears into GradientASCII's bright blue.
                  className="text-7xl font-bold text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.85),0_1px_4px_rgba(0,0,0,0.6)]"
                >
                  {section.label}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="max-w-md text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]"
                >
                  {section.blurb}
                </motion.p>
              </div>

              {/* Movies and Books borrow the games library until they have content of their own. */}
              <GameLibrary />

              <div className="h-40" />{/* room for the dock and the gate prompt below the last row */}
            </div>
          )}
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {armed && gate?.dir === 1 && (
          <Gate
            key="down"
            dir={1}
            label={`Keep scrolling to explore ${next.label}`}
            progress={progress}
            accent={next.accent}
            onSkip={() => go(index + 1, 1)}
          />
        )}
        {armed && gate?.dir === -1 && (
          <Gate
            key="up"
            dir={-1}
            label={`Keep scrolling to return to ${previous.label}`}
            progress={progress}
            accent={previous.accent}
            onSkip={() => go(index - 1, -1)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
