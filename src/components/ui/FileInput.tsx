// src/components/ui/FileInput.tsx
interface FileInputProps {
  label: string;
  error?: string;
  onChange: (file: File) => void;
  preview?: string;
}

export default function FileInput({ label, error, onChange, preview }: FileInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-body font-medium text-fg-muted">{label}</label>
      <label className={`flex flex-col items-center justify-center gap-2 w-full py-6 border-2 border-dashed rounded-lg cursor-pointer transition
        hover:bg-surface
        ${error ? "border-danger" : "border-line"}`}>
        {preview ? (
          <img src={preview} alt="영수증 미리보기" className="max-h-40 rounded-md object-contain" />
        ) : (
          <>
            <span className="text-display text-fg-faint">📎</span>
            <p className="text-body text-fg-faint">클릭해서 업로드</p>
            <p className="text-caption text-fg-faint">JPG, PNG 지원</p>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange(file);
          }}
        />
      </label>
      {error && <p className="text-caption text-danger">{error}</p>}
    </div>
  );
}