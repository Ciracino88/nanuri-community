import { useState, useEffect, useRef, type RefObject } from "react";
import { MUTED } from "../../constants/theme";

export type CreatureKind = "home" | "schedule" | "gallery" | "songs" | "profile" | "admin";

// 비활성 탭의 몸통 색. 라벨과 같은 값이라 한 덩어리로 읽힌다.
// 이전 값(#4a5568)은 흰 배경에서 활성 탭보다 무거워 보여 위계가 뒤집혔다.
const INACTIVE = MUTED;

// 눈 흰자가 얹히는 어두운 면(현관문·달력 날짜 원·액자 그림·톱니 중심).
// 흰자가 읽히려면 이 면은 어두워야 하므로 라이트 배경에서도 그대로 둔다.
const SOCKET = "#17171c";

// 렌더 크기. 도형 좌표는 그대로 40 단위 viewBox 를 쓰고 여기서만 줄인다.
const SIZE = 28;

interface EyeBase {
  mousePos: { x: number; y: number } | null;
  blink: boolean;
  color: string;
}

interface CreatureProps extends EyeBase {
  active: boolean;
}

// 마우스를 따라가는 눈. mousePos 가 없으면(모바일) 정면 응시.
function Eye({
  cx,
  cy,
  r,
  pupilR,
  mousePos,
  svgRef,
  blink,
  color,
}: {
  cx: number;
  cy: number;
  r: number;
  pupilR: number;
  mousePos: { x: number; y: number } | null;
  svgRef: RefObject<SVGSVGElement | null>;
  blink: boolean;
  color: string;
}) {
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!mousePos || !svgRef.current) {
      setPupilOffset({ x: 0, y: 0 });
      return;
    }
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = rect.left + (cx / 40) * rect.width;
    const svgY = rect.top + (cy / 40) * rect.height;
    const dx = mousePos.x - svgX;
    const dy = mousePos.y - svgY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxMove = r * 0.45;
    const scale = dist > 0 ? Math.min(maxMove / dist, 1) : 0;
    setPupilOffset({ x: dx * scale * 0.5, y: dy * scale * 0.5 });
  }, [mousePos, cx, cy, r, svgRef]);

  const px = cx + pupilOffset.x * 0.6;
  const py = cy + pupilOffset.y * 0.6;

  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={r} ry={blink ? 0.5 : r} fill="white" />
      {!blink && <ellipse cx={px} cy={py} rx={pupilR} ry={pupilR} fill={color} />}
      {!blink && <ellipse cx={px} cy={py} rx={pupilR * 0.5} ry={pupilR * 0.5} fill="#111" />}
      {!blink && <circle cx={px - pupilR * 0.2} cy={py - pupilR * 0.25} r={pupilR * 0.18} fill="white" opacity={0.9} />}
    </g>
  );
}

// 홈: 집 (창문이 눈)
function HomeCreature({ active, mousePos, blink, color }: CreatureProps) {
  const ref = useRef<SVGSVGElement>(null);
  const fill = active ? color : INACTIVE;
  return (
    <svg ref={ref} viewBox="0 0 40 40" width={SIZE} height={SIZE} fill="none">
      <polygon points="4,20 20,6 36,20" fill={fill} />
      <rect x="8" y="19" width="24" height="16" rx="2" fill={fill} opacity="0.85" />
      <rect x="26" y="10" width="5" height="10" rx="1" fill={fill} opacity="0.7" />
      <rect x="16" y="27" width="8" height="8" rx="1.5" fill={SOCKET} />
      <rect x="9" y="21" width="8" height="6" rx="2" fill="white" opacity="0.15" />
      <Eye cx={13} cy={24} r={2.8} pupilR={1.5} mousePos={mousePos} svgRef={ref} blink={blink} color={color} />
      <rect x="23" y="21" width="8" height="6" rx="2" fill="white" opacity="0.15" />
      <Eye cx={27} cy={24} r={2.8} pupilR={1.5} mousePos={mousePos} svgRef={ref} blink={blink} color={color} />
    </svg>
  );
}

// 행사: 달력 (날짜 원이 눈)
function ScheduleCreature({ active, mousePos, blink, color }: CreatureProps) {
  const ref = useRef<SVGSVGElement>(null);
  const fill = active ? color : INACTIVE;
  return (
    <svg ref={ref} viewBox="0 0 40 40" width={SIZE} height={SIZE} fill="none">
      <rect x="4" y="8" width="32" height="28" rx="4" fill={fill} opacity="0.85" />
      <rect x="4" y="8" width="32" height="10" rx="4" fill={fill} />
      <rect x="12" y="5" width="4" height="8" rx="2" fill={active ? "#fff" : "#a8a8b3"} opacity="0.8" />
      <rect x="24" y="5" width="4" height="8" rx="2" fill={active ? "#fff" : "#a8a8b3"} opacity="0.8" />
      <circle cx="13" cy="26" r="5" fill={SOCKET} />
      <Eye cx={13} cy={26} r={4} pupilR={2} mousePos={mousePos} svgRef={ref} blink={blink} color={color} />
      <circle cx="27" cy="26" r="5" fill={SOCKET} />
      <Eye cx={27} cy={26} r={4} pupilR={2} mousePos={mousePos} svgRef={ref} blink={blink} color={color} />
      <circle cx="20" cy="26" r="1.5" fill="white" opacity="0.3" />
    </svg>
  );
}

// 갤러리: 액자 (그림이 눈)
function GalleryCreature({ active, mousePos, blink, color }: CreatureProps) {
  const ref = useRef<SVGSVGElement>(null);
  const fill = active ? color : INACTIVE;
  return (
    <svg ref={ref} viewBox="0 0 40 40" width={SIZE} height={SIZE} fill="none">
      <rect x="3" y="5" width="34" height="30" rx="4" fill={fill} />
      <rect x="7" y="9" width="26" height="22" rx="2" fill={SOCKET} />
      <polyline points="7,28 13,19 19,24 25,16 31,28" stroke={fill} strokeWidth="1.5" opacity="0.4" fill="none" />
      <Eye cx={12} cy={17} r={4} pupilR={2.2} mousePos={mousePos} svgRef={ref} blink={blink} color={color} />
      <Eye cx={26} cy={17} r={4} pupilR={2.2} mousePos={mousePos} svgRef={ref} blink={blink} color={color} />
      <rect x="17" y="35" width="6" height="3" rx="1" fill={fill} opacity="0.5" />
      <rect x="14" y="37" width="12" height="2" rx="1" fill={fill} opacity="0.4" />
    </svg>
  );
}

// 찬양팀: 음표 (음표 머리가 눈)
function SongsCreature({ active, mousePos, blink, color }: CreatureProps) {
  const ref = useRef<SVGSVGElement>(null);
  const fill = active ? color : INACTIVE;
  return (
    <svg ref={ref} viewBox="0 0 40 40" width={SIZE} height={SIZE} fill="none">
      <rect x="14" y="8" width="3" height="22" rx="1.5" fill={fill} />
      <rect x="23" y="5" width="3" height="19" rx="1.5" fill={fill} />
      <rect x="14" y="8" width="12" height="3" rx="1.5" fill={fill} />
      <rect x="14" y="13" width="12" height="3" rx="1.5" fill={fill} />
      <ellipse cx="13" cy="31" rx="6" ry="5" fill={fill} transform="rotate(-15 13 31)" />
      <Eye cx={13} cy={31} r={3.8} pupilR={1.9} mousePos={mousePos} svgRef={ref} blink={blink} color={color} />
      <ellipse cx="26" cy="28" rx="6" ry="5" fill={fill} transform="rotate(-15 26 28)" />
      <Eye cx={26} cy={28} r={3.8} pupilR={1.9} mousePos={mousePos} svgRef={ref} blink={blink} color={color} />
    </svg>
  );
}

// 내정보: 얼굴
function ProfileCreature({ active, mousePos, blink, color }: CreatureProps) {
  const ref = useRef<SVGSVGElement>(null);
  const fill = active ? color : INACTIVE;
  return (
    <svg ref={ref} viewBox="0 0 40 40" width={SIZE} height={SIZE} fill="none">
      <path d="M6 38 Q6 26 20 26 Q34 26 34 38" fill={fill} opacity="0.85" />
      <circle cx="20" cy="17" r="13" fill={fill} />
      <circle cx="12" cy="20" r="3" fill="#ff9cae" opacity={active ? 0.6 : 0.3} />
      <circle cx="28" cy="20" r="3" fill="#ff9cae" opacity={active ? 0.6 : 0.3} />
      <Eye cx={14} cy={16} r={4.5} pupilR={2.4} mousePos={mousePos} svgRef={ref} blink={blink} color={color} />
      <Eye cx={26} cy={16} r={4.5} pupilR={2.4} mousePos={mousePos} svgRef={ref} blink={blink} color={color} />
      <path d="M15 23 Q20 28 25 23" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.8" />
    </svg>
  );
}

// 관리자: 톱니(설정) + 눈
function AdminCreature({ active, mousePos, blink, color }: CreatureProps) {
  const ref = useRef<SVGSVGElement>(null);
  const fill = active ? color : INACTIVE;
  return (
    <svg ref={ref} viewBox="0 0 40 40" width={SIZE} height={SIZE} fill="none">
      <path
        d="M20 4 L22.5 7.5 L26.5 6.5 L28 10.5 L32 11.5 L31.5 15.5 L35 18 L33 21.5 L35 25 L31.5 27 L32 31 L28 32 L26.5 36 L22.5 35 L20 38 L17.5 35 L13.5 36 L12 32 L8 31 L8.5 27 L5 25 L7 21.5 L5 18 L8.5 15.5 L8 11.5 L12 10.5 L13.5 6.5 L17.5 7.5 Z"
        fill={fill}
        opacity="0.9"
      />
      <circle cx="20" cy="21" r="7" fill={SOCKET} />
      <Eye cx={16} cy={21} r={3.2} pupilR={1.7} mousePos={mousePos} svgRef={ref} blink={blink} color={color} />
      <Eye cx={24} cy={21} r={3.2} pupilR={1.7} mousePos={mousePos} svgRef={ref} blink={blink} color={color} />
    </svg>
  );
}

export function CreatureIcon({ kind, ...props }: { kind: CreatureKind } & CreatureProps) {
  if (kind === "home") return <HomeCreature {...props} />;
  if (kind === "schedule") return <ScheduleCreature {...props} />;
  if (kind === "gallery") return <GalleryCreature {...props} />;
  if (kind === "songs") return <SongsCreature {...props} />;
  if (kind === "admin") return <AdminCreature {...props} />;
  return <ProfileCreature {...props} />;
}
