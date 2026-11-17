import FlexCarousel from '@/components/FlexCarousel';
import { useNavigate } from 'react-router';
import darkWoodCover from '@/assets/GamesPlaceHolder/DarkwoodCover.jpg';
import farCry3Cover from '@/assets/GamesPlaceHolder/FarCry3Cover.jpg'
import dontStarveCover from '@/assets/GamesPlaceHolder/DontStarveCover.png'
import GameLibrary from '@/features/games/GameLibrary';



/** Games library. Placeholder for now. */
export default function GamesPage() {
    const navigate = useNavigate();


    return (
        <div className="p-8 pb-28 text-white">
            <button
                type="button"
                className="cursor-target mb-6 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm hover:bg-white/20"
                onClick={() => navigate('/')}
            >
                ← Back
            </button>

            <GameLibrary />


        </div>
    );
}