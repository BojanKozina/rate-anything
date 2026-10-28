import FlexCarousel from '@/components/FlexCarousel';
import { useNavigate } from 'react-router';
import darkWoodCover from '@/assets/GamesPlaceHolder/DarkwoodCover.jpg';
import farCry3Cover from '@/assets/GamesPlaceHolder/FarCry3Cover.jpg'
import dontStarveCover from '@/assets/GamesPlaceHolder/DontStarveCover.png'
import dyingLightCover from '@/assets/GamesPlaceHolder/DyingLightCover.jpg'
import wowForeverCover from '@/assets/GamesPlaceHolder/WowForeverCover.jpg'
import mgsVCover from '@/assets/GamesPlaceHolder/MGSVCover.jpg'
import dishonored2Cover from '@/assets/GamesPlaceHolder/Dishonored2Cover.jpg'


/** Games library. Placeholder for now. */
export default function GamesPage() {
    const navigate = useNavigate();


    const items = [
        { src: darkWoodCover, title: 'Darkwood' },
        { src: farCry3Cover, title: 'Far Cry 3' },
        { src: dontStarveCover, title: "Don't Starve" },
        { src: dyingLightCover, title: 'Dying Light' },
        { src: wowForeverCover, title: 'World of Warcraft: Midnight' },
        { src: mgsVCover, title: 'Metal Gear Solid V' },
        { src: dishonored2Cover, title: 'Dishonored 2' },
    ];


    return (
        <div className="p-8 text-white">
            <button
                type="button"
                className="cursor-target mb-6 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm hover:bg-white/20"
                onClick={() => navigate('/')}
            >
                ← Back
            </button>

            <h1 className="text-4xl font-bold">Games</h1>


            <div style={{ width: '100%', height: '560px', position: 'relative' }}>
                <FlexCarousel
                    items={items}
                    preset="liquid"
                    intro="rise"
                    cardHeight={0.5}
                    gap={12}
                    squeeze={0.2}
                    focusOnClick
                    captions
                    fit="natural"
                    radius={0}
                    lensWidth={0.74}
                    lensHeight={1.18}
                    tilt={80}
                    roundness={1}
                    bend={0.3}
                    reach={0.3}
                    curl="twist"
                    dispersion={0.8}
                    liquid={0}
                    followCursor={false}
                    autoplay={false}
                    interval={4}
                    captureWheel
                />
            </div>



        </div>
    );
}