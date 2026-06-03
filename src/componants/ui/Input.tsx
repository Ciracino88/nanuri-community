// src/components/ui/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({ label, error, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <input
        className={`w-full px-3 py-2 text-sm rounded-lg border bg-white outline-none transition
          focus:ring-2 focus:ring-blue-100 focus:border-blue-400
          ${error ? "border-red-400 focus:ring-red-100 focus:border-red-400" : "border-gray-200 hover:border-gray-300"}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}