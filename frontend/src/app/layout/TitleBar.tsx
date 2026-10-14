
export default function TitleBar() {
  return (
    <div className="flex w-full h-7 items-center backdrop-blur-lg  select-none">

      {/* Drag area */}
      <div className="w-full h-full" data-webview-drag />

      <div className="h-full flex justify-end">

        <button
          data-webview-minimize
          className="h-full px-2 text-white hover:bg-white/20"
        >
          —
        </button>

        <button
          data-webview-maximize
          className="h-full px-2 text-white hover:bg-white/20"
        >
          ▢
        </button>

        <button
          data-webview-close
          className="h-full px-2 text-white hover:bg-red-500"
        >
          ✕
        </button>

      </div>
    </div>
  );
}