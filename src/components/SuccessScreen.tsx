import { useEffect, useRef } from "react";

const CONFETTI_COLORS = ["#7F77DD", "#1D9E75", "#D85A30", "#378ADD", "#EF9F27", "#D4537E", "#639922"];

function launchConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const particles = Array.from({ length: 80 }, () => ({
    x: canvas.width / 2,
    y: canvas.height * 0.35,
    vx: (Math.random() - 0.5) * 10,
    vy: Math.random() * -10 - 3,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: Math.random() * 6 + 4,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 8,
    isRect: Math.random() > 0.5,
    alpha: 1,
  }));

  let frame: number;
  function draw() {
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.vx *= 0.99;
      p.rotation += p.rotSpeed;
      p.alpha -= 0.012;
      if (p.alpha <= 0) continue;
      alive = true;
      ctx!.save();
      ctx!.globalAlpha = Math.max(0, p.alpha);
      ctx!.translate(p.x, p.y);
      ctx!.rotate((p.rotation * Math.PI) / 180);
      ctx!.fillStyle = p.color;
      if (p.isRect) {
        ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx!.beginPath();
        ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();
    }
    if (alive) frame = requestAnimationFrame(draw);
    else ctx!.clearRect(0, 0, canvas.width, canvas.height);
  }

  const timer = setTimeout(() => { cancelAnimationFrame(frame); draw(); }, 600);
  return () => { clearTimeout(timer); cancelAnimationFrame(frame); };
}

interface Props {
  message: string;
  subMessage?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export default function SuccessScreen({ message, subMessage, buttonText, onButtonClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    return launchConfetti(canvasRef.current);
  }, []);

  const content = (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 p-6" style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />

      <div
        className="w-18 h-18 rounded-full flex items-center justify-center"
        style={{
          width: 72,
          height: 72,
          background: "#EAF3DE",
          animation: "scaleIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) 0.1s both",
          position: "relative",
          zIndex: 1,
        }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <polyline
            points="8,18 15,25 28,11"
            stroke="#3B6D11"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 60,
              strokeDashoffset: 60,
              animation: "drawCheck 0.4s ease 0.55s both",
            }}
          />
        </svg>
      </div>

      <div
        className="text-center flex flex-col gap-1.5"
        style={{ animation: "fadeUp 0.4s ease 0.3s both", position: "relative", zIndex: 1 }}
      >
        <p className="text-emphasis font-medium text-fg-strong">{message}</p>
        {subMessage && <p className="text-body text-fg-faint">{subMessage}</p>}
      </div>

      {buttonText && onButtonClick && (
        <div style={{ animation: "fadeUp 0.4s ease 0.45s both", position: "relative", zIndex: 1, width: "100%", maxWidth: 320 }}>
          <button
            onClick={onButtonClick}
            className="w-full py-3 px-6 rounded-xl border border-line bg-card text-body font-medium text-fg hover:bg-surface transition"
          >
            {buttonText}
          </button>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.5); }
          70% { transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes drawCheck {
          from { stroke-dashoffset: 60; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
      {content}
    </div>
  );
}
