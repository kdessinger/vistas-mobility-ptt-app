import { useEffect, useRef } from 'react';

interface Props {
  speed: number;
}

const MAX_SPEED = 85;
const SIZE = 400;
const CENTER = { x: SIZE / 2, y: 220 };
const RADIUS = 160;
const START_ANGLE = 0.75 * Math.PI; // lower-left
const END_ANGLE = 2.25 * Math.PI; // lower-right, around the top

function point(angle: number, radius: number) {
  return {
    x: CENTER.x + Math.cos(angle) * radius,
    y: CENTER.y + Math.sin(angle) * radius,
  };
}

function drawGauge(ctx: CanvasRenderingContext2D, speed: number) {
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Instrument bezel and recessed face.
  const bezel = ctx.createRadialGradient(CENTER.x, CENTER.y, RADIUS, CENTER.x, CENTER.y, RADIUS + 24);
  bezel.addColorStop(0, '#303744');
  bezel.addColorStop(0.45, '#11151c');
  bezel.addColorStop(1, '#38404d');
  ctx.beginPath();
  ctx.arc(CENTER.x, CENTER.y, RADIUS + 17, 0, Math.PI * 2);
  ctx.strokeStyle = bezel;
  ctx.lineWidth = 10;
  ctx.stroke();

  const face = ctx.createRadialGradient(CENTER.x - 22, CENTER.y - 34, 8, CENTER.x, CENTER.y, RADIUS + 8);
  face.addColorStop(0, '#202631');
  face.addColorStop(1, '#0c1016');
  ctx.beginPath();
  ctx.arc(CENTER.x, CENTER.y, RADIUS + 4, 0, Math.PI * 2);
  ctx.fillStyle = face;
  ctx.shadowBlur = 20;
  ctx.shadowColor = 'rgba(0,0,0,.7)';
  ctx.fill();
  ctx.shadowBlur = 0;

  // The automotive 270-degree scale track.
  const trackStart = START_ANGLE;
  const trackEnd = END_ANGLE;
  ctx.beginPath();
  ctx.arc(CENTER.x, CENTER.y, RADIUS - 15, trackStart, trackEnd, false);
  ctx.strokeStyle = 'rgba(255,255,255,.09)';
  ctx.lineWidth = 5;
  ctx.stroke();

  // Active band follows exactly the same center and angle mapping as the ticks.
  const progress = speed / MAX_SPEED;
  const currentAngle = trackStart + progress * (trackEnd - trackStart);
  ctx.beginPath();
  ctx.arc(CENTER.x, CENTER.y, RADIUS - 15, trackStart, currentAngle, false);
  const band = ctx.createLinearGradient(65, 300, 335, 70);
  band.addColorStop(0, '#22c55e');
  band.addColorStop(0.62, '#facc15');
  band.addColorStop(1, '#ef4444');
  ctx.strokeStyle = band;
  ctx.lineWidth = 5;
  ctx.stroke();

  // One tick per MPH: major 10s, medium 5s, small individual ticks between.
  for (let value = 0; value <= MAX_SPEED; value += 1) {
    const angle = trackStart + (value / MAX_SPEED) * (trackEnd - trackStart);
    const major = value % 10 === 0 || value === MAX_SPEED;
    const medium = value % 5 === 0 && !major;
    const tickLength = major ? 16 : medium ? 11 : 6;
    const outer = point(angle, RADIUS - 15);
    const inner = point(angle, RADIUS - 15 - tickLength);

    ctx.beginPath();
    ctx.moveTo(inner.x, inner.y);
    ctx.lineTo(outer.x, outer.y);
    const isWarning = value >= 65;
    ctx.strokeStyle = isWarning
      ? value >= 75 ? '#ef4444' : '#f59e0b'
      : major ? 'rgba(255,255,255,.82)' : medium ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.22)';
    ctx.lineWidth = major ? 2.5 : medium ? 1.7 : 1;
    ctx.stroke();

    if (major) {
      const label = point(angle, RADIUS - 49);
      ctx.fillStyle = isWarning ? '#fca5a5' : 'rgba(255,255,255,.82)';
      ctx.font = '700 13px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(value), label.x, label.y);
    }
  }

  // Keep the title above the instrument face, not inside the dial.
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.font = '700 10px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText('BUS SPEED', CENTER.x, 20);
  ctx.letterSpacing = '0px';

  // Mechanical needle: polygon is calculated directly from the same angle as the ticks.
  const needleTip = point(currentAngle, RADIUS - 31);
  const needleLeft = point(currentAngle - Math.PI / 2, 6);
  const needleRight = point(currentAngle + Math.PI / 2, 6);
  ctx.beginPath();
  ctx.moveTo(needleLeft.x, needleLeft.y);
  ctx.lineTo(needleTip.x, needleTip.y);
  ctx.lineTo(needleRight.x, needleRight.y);
  ctx.closePath();
  const needle = ctx.createLinearGradient(CENTER.x, CENTER.y, needleTip.x, needleTip.y);
  needle.addColorStop(0, '#b91c1c');
  needle.addColorStop(0.35, '#ef4444');
  needle.addColorStop(1, '#fca5a5');
  ctx.fillStyle = needle;
  ctx.shadowBlur = 13;
  ctx.shadowColor = 'rgba(239,68,68,.55)';
  ctx.fill();
  ctx.shadowBlur = 0;

  // Center cap sits above the needle, as on a real instrument cluster.
  const cap = ctx.createRadialGradient(CENTER.x - 5, CENTER.y - 5, 2, CENTER.x, CENTER.y, 23);
  cap.addColorStop(0, '#64748b');
  cap.addColorStop(0.5, '#273244');
  cap.addColorStop(1, '#0b1018');
  ctx.beginPath();
  ctx.arc(CENTER.x, CENTER.y, 22, 0, Math.PI * 2);
  ctx.fillStyle = cap;
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(0,0,0,.65)';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(CENTER.x, CENTER.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#cbd5e1';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(CENTER.x - 2, CENTER.y - 2, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();

  // Digital readout stays below the pivot and clear of the scale.
  ctx.fillStyle = '#fff';
  ctx.font = '700 38px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(String(Math.floor(speed)), CENTER.x, CENTER.y + 70);
  ctx.fillStyle = 'rgba(255,255,255,.45)';
  ctx.font = '700 12px Segoe UI, sans-serif';
  ctx.fillText('MPH', CENTER.x, CENTER.y + 91);
  ctx.restore();
}

export default function Speedometer({ speed }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(Math.max(0, Math.min(MAX_SPEED, speed)));
  const targetRef = useRef(speedRef.current);

  useEffect(() => {
    targetRef.current = Math.max(0, Math.min(MAX_SPEED, speed));
  }, [speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = SIZE * ratio;
    canvas.height = SIZE * ratio;
    ctx.scale(ratio, ratio);

    let frame = 0;
    let velocity = 0;
    const animate = () => {
      const difference = targetRef.current - speedRef.current;
      // A bus should build speed and shed speed over several seconds, not snap.
      velocity += difference * 0.018;
      velocity *= 0.92;
      const speedLimit = difference >= 0 ? 0.09 : 0.12;
      velocity = Math.max(-speedLimit, Math.min(speedLimit, velocity));
      speedRef.current += velocity;
      if (Math.abs(difference) < 0.02 && Math.abs(velocity) < 0.02) {
        speedRef.current = targetRef.current;
        velocity = 0;
      }
      drawGauge(ctx, speedRef.current);
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative h-56 w-56 select-none" aria-label={`Bus speed ${Math.round(speed)} miles per hour`}>
      <canvas ref={canvasRef} className="h-full w-full" role="img" aria-label={`Speedometer showing ${Math.round(speed)} MPH`} />
    </div>
  );
}
