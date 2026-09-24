import type { PlayerRadarMetric } from "@/services/player-profile";

const size = 320;
const center = size / 2;
const radius = 105;

function pointAt(index: number, distance: number, total: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return { x: center + Math.cos(angle) * distance, y: center + Math.sin(angle) * distance };
}

function pointsFor(distance: number, total: number) {
  return Array.from({ length: total }, (_, index) => {
    const point = pointAt(index, distance, total);
    return `${point.x},${point.y}`;
  }).join(" ");
}

export function PlayerRadar({ metrics }: { metrics: PlayerRadarMetric[] }) {
  const total = metrics.length;
  const dataPoints = metrics.map((metric, index) => {
    const point = pointAt(index, (metric.value / 100) * radius, total);
    return `${point.x},${point.y}`;
  }).join(" ");

  return <div className="mx-auto w-full max-w-sm"><svg aria-label="Radar phong độ tuyển thủ" className="w-full" role="img" viewBox={`0 0 ${size} ${size}`}>
    {[25, 50, 75, 100].map((level) => <polygon className="text-white/10" fill="none" key={level} points={pointsFor((level / 100) * radius, total)} stroke="currentColor" strokeWidth="1" />)}
    {metrics.map((_, index) => { const point = pointAt(index, radius, total); return <line className="text-white/10" key={index} stroke="currentColor" strokeWidth="1" x1={center} x2={point.x} y1={center} y2={point.y} />; })}
    <polygon fill="rgba(86, 246, 111, 0.20)" points={dataPoints} stroke="var(--primary)" strokeWidth="3" />
    {metrics.map((metric, index) => { const point = pointAt(index, (metric.value / 100) * radius, total); return <circle cx={point.x} cy={point.y} fill="var(--primary)" key={metric.label} r="4" />; })}
    {metrics.map((metric, index) => { const point = pointAt(index, radius + 35, total); return <text className="fill-foreground text-[11px] font-bold" key={metric.label} textAnchor="middle" x={point.x} y={point.y - 4}>{metric.label}</text>; })}
  </svg><div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">{metrics.map((metric) => <div key={metric.label}><p className="font-bold">{metric.label} · {metric.value}</p><p className="text-xs text-muted-foreground">{metric.detail}</p></div>)}</div></div>;
}
