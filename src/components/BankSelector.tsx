// src/components/BankSelector.tsx
const BANKS = [
  "카카오뱅크", "토스뱅크", "신한은행", "KB국민은행",
  "하나은행", "우리은행", "IBK기업은행", "NH농협은행",
  "새마을금고", "신협", "K뱅크", "iM뱅크",
];

interface Props {
  value: string;
  onChange: (bank: string) => void;
}

export default function BankSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-body font-medium text-fg-muted">은행 선택</label>
      <div className="grid grid-cols-4 gap-1.5">
        {BANKS.map((bank) => (
          <button
            key={bank}
            type="button"
            onClick={() => onChange(bank)}
            className={`py-2 px-1 text-caption rounded-lg border transition
              ${value === bank
                ? "bg-info-subtle text-info border-info font-medium"
                : "bg-card text-fg border-line hover:border-line-strong hover:bg-surface"
              }`}
          >
            {bank}
          </button>
        ))}
      </div>
      {value && (
        <p className="text-caption text-fg-faint">
          선택됨: <span className="text-fg font-medium">{value}</span>
        </p>
      )}
    </div>
  );
}