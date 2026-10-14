import TiltedCard from '@/components/TiltedCard'
import tallImage from '@/assets/TestImageTall.jpg';
import posterImage from '@/assets/TestImageTallV2.jpg';

/** The three main categories shown on the home screen. */
const categories = [
  { label: 'Books', image: posterImage },
  { label: 'Movies', image: posterImage },
  { label: 'Games', image: tallImage },
];


export function Cards (){


return (

<div className="flex h-full flex-wrap items-center justify-around">
            {categories.map(category => (
              <button
                key={category.label}
                type="button"
                className="cursor-target rounded-[15px] outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                data-cursor-label={`Go to ${category.label}`}
                onClick={() => console.log(`Open ${category.label}`)}
              >
                <TiltedCard
                  imageSrc={category.image}
                  altText={category.label}
                  captionText={category.label}
                  imageWidth="200px"
                  imageHeight="300px"
                  containerWidth="200px"
                  containerHeight="340px"
                  rotateAmplitude={12}
                  scaleOnHover={1.05}
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

