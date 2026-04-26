import { useEffect, useRef, useState } from 'react';
import { getMatchColor, getMatchLabel } from '../data/mockData';

export default function MatchRing({ score, size = 64, strokeWidth = 5, showLabel = false, animated = true }) {
  const [displayed, setDisplayed] = useState(animated ? 0 : score);
  const [progress, setProgress] = useState(animated ? 0 : score);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!animated) return;
    const start = Date.now();
    const duration = 900;

    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased * score);
      setDisplayed(Math.round(eased * score));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [score, animated]);

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const color = getMatchColor(score);
  const label = getMatchLabel(score);
  const fontSize = size < 56 ? size * 0.22 : size * 0.2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'none', filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill={color}
          fontSize={fontSize}
          fontWeight="700"
          fontFamily="Inter, sans-serif"
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center', letterSpacing: '-0.5px' }}
        >
          {displayed}%
        </text>
      </svg>
      {showLabel && (
        <span style={{ fontSize: '0.72rem', color, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </span>
      )}
    </div>
  );
}
