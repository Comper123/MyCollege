export default function GlobalSkeletonOverlay() {
  return (
    <div className="absolute inset-0 z-50 animate-pulse pointer-events-none">
      <div className="h-full w-full bg-white/60 dark:bg-black/40 backdrop-blur-sm" />
    </div>
  );
}