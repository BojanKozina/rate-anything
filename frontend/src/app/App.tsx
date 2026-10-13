import PatternWaves from '@/components/PatternWaves';

export default function App() {
  return (
    <>
      {/* Background: covers the whole window */}
      <div className="fixed inset-0">
        <PatternWaves
          color="#2E4540"
          backgroundColor="#0B0909"
          cursorStrength={0.025}
          markSize={0.75}
          speed={0.45}
        />
      </div>

    </>
  );
}