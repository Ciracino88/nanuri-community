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
      <div className="h-9 flex items-center justify-center">
        <p className="text-caption text-fg-faint text-center leading-tight">{position}</p>
      </div>
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
              <div className={`w-full h-full rounded-full flex items-center justify-center ${myAvailable && isMine ? "bg-success" : "bg-success"}`}>
                <i className="ti ti-user text-body text-white" aria-hidden="true" />
              </div>
            )
          ) : (
            <div className={`w-full h-full rounded-full border flex items-center justify-center ${
              isMine
                ? "bg-success-subtle border-success-soft"
                : "bg-sunken border-line"
            }`}>
              <i className={`ti ti-user text-body ${isMine ? "text-success" : "text-fg-faint"}`} aria-hidden="true" />
            </div>
          )}
        </div>
        {isMine && myAvailable && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border border-white" />
        )}
      </button>
      {member ? (
        <p className="text-caption font-medium text-success text-center leading-tight w-full truncate">{member.name}</p>
      ) : (
        <p className="text-caption text-fg-faint text-center">미정</p>
      )}
    </div>
  );
}
