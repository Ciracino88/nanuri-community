interface Props {
  label?: string;
  size?: "sm" | "lg";
}

const SIZES = {
  sm: { icon: "text-emphasis", iconGap: "gap-1.5", label: "text-caption text-fg-faint", outerGap: "gap-2" },
  lg: { icon: "text-2xl", iconGap: "gap-2.5", label: "text-body text-fg-faint", outerGap: "gap-4" },
};

export default function LoadingSpinner({ label, size = "sm" }: Props) {
  const s = SIZES[size];
  return (
    <div className={`flex flex-col items-center justify-center py-10 ${s.outerGap}`}>
      <div className={`flex items-center ${s.iconGap}`}>
        {[0, 1, 2].map((i) => (
          <i
            key={i}
            className={`ti ti-seeding ${s.icon} text-fg-faint`}
            style={{ animation: `loadingBounce 1s ease-in-out infinite ${i * 0.2}s` }}
            aria-hidden="true"
          />
        ))}
      </div>
      {label && <p className={s.label}>{label}</p>}
    </div>
  );
}
