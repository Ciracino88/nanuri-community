export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-10">
      {[0, 1, 2].map((i) => (
        <i
          key={i}
          className="ti ti-seeding text-base text-gray-300"
          style={{ animation: `loadingBounce 1s ease-in-out infinite ${i * 0.2}s` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
