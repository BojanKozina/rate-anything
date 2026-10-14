import { useRef } from 'react';
import PatternWaves from '@/components/PatternWaves';
import TargetCursor from '@/components/TargetCursor';
import TitleBar from './layout/TitleBar';
import AppDock from './layout/AppDock';
import { Cards } from './layout/Cards';


export default function App() {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <TargetCursor
        container={contentRef}
        spinDuration={4}
        hoverDuration={0.35}
        size={30}
        thickness={1.5}
        padding={8}
      />

      {/* Background layer */}
      <div className="absolute inset-0">
        <PatternWaves
          color="#2E4540"
          backgroundColor="#0B0909"
          cursorStrength={0.025}
          markSize={0.75}
          speed={0.45}
        />
      </div>

      <div className="relative flex h-screen flex-col">
        <TitleBar />

        {/* Everything in here will have the target cursor! */}
        <main ref={contentRef} className="relative flex-1">
          

        <Cards/>


        </main>

        <AppDock />
      </div>
    </>
  );
}