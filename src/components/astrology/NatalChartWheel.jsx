import React from "react";
import { Sun, Moon, Eye, MessageCircle, Heart, Target } from "lucide-react";

const ZODIAC_SIGNS = [
  { name: "Aries", symbol: "♈", start: 0 },
  { name: "Taurus", symbol: "♉", start: 30 },
  { name: "Gemini", symbol: "♊", start: 60 },
  { name: "Cancer", symbol: "♋", start: 90 },
  { name: "Leo", symbol: "♌", start: 120 },
  { name: "Virgo", symbol: "♍", start: 150 },
  { name: "Libra", symbol: "♎", start: 180 },
  { name: "Scorpio", symbol: "♏", start: 210 },
  { name: "Sagittarius", symbol: "♐", start: 240 },
  { name: "Capricorn", symbol: "♑", start: 270 },
  { name: "Aquarius", symbol: "♒", start: 300 },
  { name: "Pisces", symbol: "♓", start: 330 }
];

const PLANETS = [
  { key: "sun", Icon: Sun, color: "text-yellow-500" },
  { key: "moon", Icon: Moon, color: "text-blue-500" },
  { key: "rising", Icon: Eye, color: "text-purple-500" },
  { key: "mercury", Icon: MessageCircle, color: "text-cyan-500" },
  { key: "venus", Icon: Heart, color: "text-pink-500" },
  { key: "mars", Icon: Target, color: "text-red-500" }
];

export default function NatalChartWheel({ placements = {} }) {
  // Convert sign name to degree position (simplified)
  const signToDegree = (signName) => {
    const sign = ZODIAC_SIGNS.find(z => z.name.toLowerCase() === signName.toLowerCase());
    return sign ? sign.start + 15 : 0; // Center of sign
  };

  // Get position for planet based on degree
  const getPlanetPosition = (degree, radius = 85) => {
    const radian = (degree - 90) * (Math.PI / 180); // -90 to start from top
    return {
      x: 150 + radius * Math.cos(radian),
      y: 150 + radius * Math.sin(radian)
    };
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square">
      <svg viewBox="0 0 300 300" className="w-full h-full">
        {/* Outer circle */}
        <circle
          cx="150"
          cy="150"
          r="145"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
        />

        {/* Zodiac wheel segments */}
        {ZODIAC_SIGNS.map((sign, idx) => {
          const startAngle = sign.start - 90; // -90 to start from top
          const endAngle = startAngle + 30;
          
          const startRad = startAngle * (Math.PI / 180);
          const endRad = endAngle * (Math.PI / 180);
          
          const outerRadius = 145;
          const innerRadius = 100;
          
          const x1 = 150 + outerRadius * Math.cos(startRad);
          const y1 = 150 + outerRadius * Math.sin(startRad);
          const x2 = 150 + innerRadius * Math.cos(startRad);
          const y2 = 150 + innerRadius * Math.sin(startRad);
          
          const x3 = 150 + innerRadius * Math.cos(endRad);
          const y3 = 150 + innerRadius * Math.sin(endRad);
          const x4 = 150 + outerRadius * Math.cos(endRad);
          const y4 = 150 + outerRadius * Math.sin(endRad);
          
          // Text position
          const textAngle = (startAngle + 15) * (Math.PI / 180);
          const textRadius = 122;
          const textX = 150 + textRadius * Math.cos(textAngle);
          const textY = 150 + textRadius * Math.sin(textAngle);
          
          return (
            <g key={sign.name}>
              {/* Segment lines */}
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d1d5db" strokeWidth="1" />
              
              {/* Zodiac symbol */}
              <text
                x={textX}
                y={textY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-gray-600 font-semibold"
              >
                {sign.symbol}
              </text>
            </g>
          );
        })}

        {/* Inner circle */}
        <circle
          cx="150"
          cy="150"
          r="100"
          fill="white"
          stroke="#e5e7eb"
          strokeWidth="2"
        />

        {/* Center circle */}
        <circle
          cx="150"
          cy="150"
          r="40"
          fill="#fef3c7"
          stroke="#f59e0b"
          strokeWidth="2"
        />

        {/* Planets */}
        {PLANETS.map((planet) => {
          const signName = placements[`${planet.key}Sign`] || placements.sunSign;
          if (!signName) return null;
          
          const degree = signToDegree(signName);
          const pos = getPlanetPosition(degree);
          const Icon = planet.Icon;
          
          return (
            <g key={planet.key}>
              {/* Line from center */}
              <line
                x1="150"
                y1="150"
                x2={pos.x}
                y2={pos.y}
                stroke="#d1d5db"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              
              {/* Planet circle background */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="12"
                fill="white"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
            </g>
          );
        })}

        {/* Center text */}
        <text
          x="150"
          y="150"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm fill-amber-900 font-semibold"
        >
          Your Chart
        </text>
      </svg>

      {/* Planet icons overlay (using absolute positioning for better icon rendering) */}
      <div className="absolute inset-0">
        {PLANETS.map((planet) => {
          const signName = placements[`${planet.key}Sign`] || placements.sunSign;
          if (!signName) return null;
          
          const degree = signToDegree(signName);
          const pos = getPlanetPosition(degree);
          const Icon = planet.icon;
          
          // Convert SVG coordinates to percentage
          const left = `${(pos.x / 300) * 100}%`;
          const top = `${(pos.y / 300) * 100}%`;
          
          return (
            <div
              key={planet.key}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left, top }}
              title={`${planet.key.charAt(0).toUpperCase() + planet.key.slice(1)} in ${signName}`}
            >
              <Icon className={`w-4 h-4 ${planet.color}`} />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm rounded-lg p-2 border border-gray-200">
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          {PLANETS.map((planet) => {
            const Icon = planet.Icon;
            const signName = placements[`${planet.key}Sign`] || (planet.key === "sun" ? placements.sunSign : "");
            if (!signName) return null;
            
            return (
              <div key={planet.key} className="flex items-center gap-1">
                <Icon className={`w-3 h-3 ${planet.color}`} />
                <span className="text-gray-700">{signName}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}