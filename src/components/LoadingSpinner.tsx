interface Props {
  label?: string;
}

export default function LoadingSpinner({ label }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <i
            key={i}
            className="ti ti-seeding text-base text-gray-300"
            style={{ animation: `loadingBounce 1s ease-in-out infinite ${i * 0.2}s` }}
            aria-hidden="true"
          />
        ))}
      </div>
      {label && <p className="text-xs text-gray-400">{label}</p>}
    </div>
  );
}
