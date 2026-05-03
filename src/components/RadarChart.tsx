'use client';

import React from 'react';

interface DataPoint {
    label: string;
    value: number; // 0 to 100
}

interface RadarChartProps {
    data: DataPoint[];
    size?: number;
    color?: string;
}

export function RadarChart({ data, size = 300, color = 'rgba(52, 211, 153, 0.7)' }: RadarChartProps) {
    const padding = 40;
    const center = size / 2;
    const radius = (size / 2) - padding;
    const angleStep = (Math.PI * 2) / data.length;

    // Calculate coordinates for each point
    const points = data.map((d, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = radius * (Math.min(100, Math.max(0, d.value)) / 100);
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle),
            labelX: center + (radius + 20) * Math.cos(angle),
            labelY: center + (radius + 20) * Math.sin(angle),
            label: d.label
        };
    });

    // Generate background rings
    const rings = [0.25, 0.5, 0.75, 1].map(scale => {
        const r = radius * scale;
        return data.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ');
    });

    const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <div className="relative flex items-center justify-center select-none">
            <svg width={size} height={size} className="overflow-visible">
                {/* Rings */}
                {rings.map((r, i) => (
                    <polygon
                        key={i}
                        points={r}
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="1"
                    />
                ))}

                {/* Axis lines */}
                {data.map((_, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={center + radius * Math.cos(angle)}
                            y2={center + radius * Math.sin(angle)}
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Data Polygon */}
                <polygon
                    points={polygonPoints}
                    fill={color.replace('0.7', '0.2')}
                    stroke={color}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                />

                {/* Data Points */}
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="3"
                        fill={color}
                        className="drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]"
                    />
                ))}

                {/* Labels */}
                {points.map((p, i) => (
                    <text
                        key={i}
                        x={p.labelX}
                        y={p.labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[9px] font-bold fill-zinc-500 uppercase tracking-widest"
                    >
                        {p.label}
                    </text>
                ))}
            </svg>
        </div>
    );
}
