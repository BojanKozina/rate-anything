import { useNavigate } from 'react-router';
import TiltedCard from '@/components/TiltedCard';

import tallImage from '@/assets/TestImageTall.jpg';
import posterImage from '@/assets/TestImageTallV2.jpg';

/** The three main categories, each with the page it opens. */
const categories = [
  { label: 'Books',  image: posterImage, path: '/books' },
  { label: 'Movies', image: posterImage, path: '/movies' },
  { label: 'Games',  image: tallImage,   path: '/games' },
];


export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-wrap items-center justify-around">
      {categories.map(category => (
        <button
          key={category.label}
          type="button"
          className="cursor-target rounded-[15px] outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          data-cursor-label={`Go to ${category.label}`}
          onClick={() => navigate(category.path)}
        >
          <TiltedCard
            imageSrc={category.image}
            altText={category.label}
            imageWidth="200px"
            imageHeight="300px"
            containerWidth="200px"
            containerHeight="340px"
            rotateAmplitude={12}
            scaleOnHover={1.05}
            showMobileWarning={false}
            displayOverlayContent
            overlayContent={
              <p className="m-4 rounded-lg bg-black/40 px-3 py-1 text-lg font-semibold text-white backdrop-blur-sm">
                {category.label}
              </p>
            }
          />
        </button>
      ))}
    </div>
  );
}