export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2.5">
        {[0, 1, 2].map((i) => (
          <i
            key={i}
            className="ti ti-seeding text-2xl text-gray-300"
            style={{ animation: `loadingBounce 1s ease-in-out infinite ${i * 0.2}s` }}
            aria-hidden="true"
          />
        ))}
      </div>
      <p className="text-sm text-gray-300">불러오는 중...</p>
    </div>
  );
}
