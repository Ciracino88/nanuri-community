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
      <label className="text-sm font-medium text-gray-600">은행 선택</label>
      <div className="grid grid-cols-4 gap-1.5">
        {BANKS.map((bank) => (
          <button
            key={bank}
            type="button"
            onClick={() => onChange(bank)}
            className={`py-2 px-1 text-xs rounded-lg border transition
              ${value === bank
                ? "bg-blue-50 text-blue-500 border-blue-300 font-medium"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
          >
            {bank}
          </button>
        ))}
      </div>
      {value && (
        <p className="text-xs text-gray-400">
          선택됨: <span className="text-gray-600 font-medium">{value}</span>
        </p>
      )}
    </div>
  );
}