// src/components/ui/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({ label, error, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-body font-medium text-fg-muted">{label}</label>
      <input
        className={`w-full px-3 py-2 text-emphasis rounded-lg border bg-card outline-none transition
          focus:ring-2 focus:ring-info-soft focus:border-info
          ${error ? "border-danger focus:ring-danger-soft focus:border-danger" : "border-line hover:border-line-strong"}`}
        {...props}
      />
      {error && <p className="text-caption text-danger">{error}</p>}
    </div>
  );
}