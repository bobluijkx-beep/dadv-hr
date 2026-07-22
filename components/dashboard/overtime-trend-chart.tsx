"use client";

import { useId, useState } from "react";

type Point = { key: string; label: string; hours: number };

const WIDTH = 480;
const HEIGHT = 160;
const PADDING = { top: 12, right: 12, bottom: 24, left: 12 };

export function OvertimeTrendChart({ data }: { data: Point[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const gradientId = useId();

  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(d.hours)));
  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const zeroY = PADDING.top + innerHeight / 2;

  const xFor = (i: number) => PADDING.left + (data.length === 1 ? innerWidth / 2 : (i / (data.length - 1)) * innerWidth);
  const yFor = (hours: number) => zeroY - (hours / maxAbs) * (innerHeight / 2);

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(d.hours)}`).join(" ");

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label="Overuren per maand, afgelopen 6 maanden"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Recessive gridline op nul-uren */}
          <line
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={zeroY}
            y2={zeroY}
            stroke="var(--border)"
            strokeWidth={1}
          />

          {/* Vlak onder de lijn */}
          <path
            d={`${linePath} L ${xFor(data.length - 1)} ${zeroY} L ${xFor(0)} ${zeroY} Z`}
            fill={`url(#${gradientId})`}
            stroke="none"
          />

          {/* Lijn zelf: dun, ronde uiteinden */}
          <path d={linePath} fill="none" stroke="var(--chart-1)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {data.map((d, i) => (
            <g key={d.key}>
              <circle
                cx={xFor(i)}
                cy={yFor(d.hours)}
                r={hoverIndex === i ? 5 : 4}
                fill="var(--background)"
                stroke="var(--chart-1)"
                strokeWidth={2}
                tabIndex={0}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(i)}
                onBlur={() => setHoverIndex(null)}
                style={{ cursor: "pointer" }}
              />
              <text x={xFor(i)} y={HEIGHT - 6} textAnchor="middle" className="fill-muted-foreground" fontSize={11}>
                {d.label}
              </text>
            </g>
          ))}
        </svg>

        {hoverIndex !== null && (
          <div
            className="pointer-events-none absolute rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
            style={{
              left: `${(xFor(hoverIndex) / WIDTH) * 100}%`,
              top: `${(yFor(data[hoverIndex].hours) / HEIGHT) * 100}%`,
              transform: "translate(-50%, -130%)",
            }}
          >
            {data[hoverIndex].label}: {data[hoverIndex].hours.toLocaleString("nl-NL", { minimumFractionDigits: 2 })} uur
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {data.map((d) => (
          <span key={d.key}>
            {d.label}: {d.hours.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}u
          </span>
        ))}
      </div>
    </div>
  );
}
