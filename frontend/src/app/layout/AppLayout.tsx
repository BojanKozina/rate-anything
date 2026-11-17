import { useRef } from 'react';
import { Outlet } from 'react-router';
import PatternWaves from '@/components/PatternWaves';
import TargetCursor from '@/components/TargetCursor';
import TitleBar from './TitleBar';
import AppDock from './AppDock';


export default function AppLayout() {
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

        <main ref={contentRef} className="relative flex-1 overflow-hidden">
          {/* Only this inner div scrolls, so the dock below stays put. */}
          {/* Dock clearance lives on each page, so a full-bleed page background can reach the bottom. */}
          <div className="h-full overflow-y-auto overscroll-contain [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin]">
            <Outlet />   {/* the current page renders here */}
          </div>
          <AppDock />
        </main>
      </div>
    </>
  );
}