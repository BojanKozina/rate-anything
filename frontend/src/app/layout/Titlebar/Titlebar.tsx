export default function TitleBar() {
  return (
    <div className="flex h-8 bg-neutral-900 text-white select-none">
      <div className="flex flex-1 items-center pl-3 text-sm" data-webview-drag>
        RateAnything
      </div>
      <button className="w-11 hover:bg-neutral-700" data-webview-minimize>—</button>
      <button className="w-11 hover:bg-neutral-700" data-webview-maximize>□</button>
      <button className="w-11 hover:bg-red-600" data-webview-close>✕</button>
    </div>
  );
}