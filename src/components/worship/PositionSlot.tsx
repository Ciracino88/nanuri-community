import type { MemberProfile } from "../../types/worship";

interface PositionSlotProps {
  position: string;
  member: MemberProfile | null;
  isMine: boolean;
  myAvailable: boolean;
  toggling: boolean;
  onToggle?: () => void;
}

export default function PositionSlot({ position, member, isMine, myAvailable, toggling, onToggle }: PositionSlotProps) {
  const isClickable = isMine && !!onToggle;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-xs text-gray-400 text-center leading-tight">{position}</p>
      <button
        type="button"
        onClick={isClickable ? onToggle : undefined}
        disabled={!isClickable || toggling}
        className={`relative w-8 h-8 rounded-full transition-all ${
          isClickable ? "cursor-pointer active:scale-90" : "cursor-default"
        }`}
        style={{ animation: isClickable && !toggling ? undefined : undefined }}
        onMouseDown={(e) => { if (isClickable) e.currentTarget.style.animation = "buttonPop 0.25s ease"; }}
        onAnimationEnd={(e) => { e.currentTarget.style.animation = "none"; }}
      >
        <div
          key={member?.id ?? "empty"}
          style={{ animation: member ? "popIn 0.3s ease" : undefined }}
          className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
        >
          {member ? (
            member.avatar_url ? (
              <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full rounded-full flex items-center justify-center ${myAvailable && isMine ? "bg-emerald-500" : "bg-emerald-400"}`}>
                <i className="ti ti-user text-sm text-white" aria-hidden="true" />
              </div>
            )
          ) : (
            <div className={`w-full h-full rounded-full border flex items-center justify-center ${
              isMine
                ? "bg-emerald-50 border-emerald-200"
                : "bg-gray-100 border-gray-200"
            }`}>
              <i className={`ti ti-user text-sm ${isMine ? "text-emerald-300" : "text-gray-300"}`} aria-hidden="true" />
            </div>
          )}
        </div>
        {isMine && myAvailable && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white" />
        )}
      </button>
      {member ? (
        <p className="text-xs font-medium text-emerald-700 text-center leading-tight w-full truncate">{member.name}</p>
      ) : (
        <p className="text-xs text-gray-300 text-center">미정</p>
      )}
    </div>
  );
}
