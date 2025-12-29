import React from "react";

export default function BodygraphVisualization({ humanDesign }) {
  const definedCentres = humanDesign?.definedCentres || [];
  
  // Center definitions with positions
  const centres = [
    { key: "head", x: 250, y: 60, color: definedCentres.includes("head") ? "#8B7FBF" : "#F5F3FF", shape: "triangle" },
    { key: "ajna", x: 250, y: 120, color: definedCentres.includes("ajna") ? "#8B7FBF" : "#F5F3FF", shape: "triangle" },
    { key: "throat", x: 250, y: 180, color: definedCentres.includes("throat") ? "#8B7FBF" : "#F5F3FF", shape: "square" },
    { key: "g", x: 250, y: 260, color: definedCentres.includes("g") ? "#E6B8D8" : "#FEF2F8", shape: "diamond" },
    { key: "heart", x: 190, y: 260, color: definedCentres.includes("heart") ? "#E89BB5" : "#FEF2F8", shape: "triangle" },
    { key: "spleen", x: 310, y: 260, color: definedCentres.includes("spleen") ? "#E89BB5" : "#FEF2F8", shape: "triangle" },
    { key: "solar", x: 250, y: 330, color: definedCentres.includes("solar") ? "#E6B8D8" : "#FEF2F8", shape: "square" },
    { key: "sacral", x: 250, y: 400, color: definedCentres.includes("sacral") ? "#D4886C" : "#FEF2F8", shape: "square" },
    { key: "root", x: 250, y: 470, color: definedCentres.includes("root") ? "#C9A88C" : "#FEF2F8", shape: "square" }
  ];

  // Design data (left side)
  const designData = [
    { symbol: "☉", gate: "40.4" },
    { symbol: "⊕", gate: "37.4" },
    { symbol: "☊", gate: "63.3" },
    { symbol: "☋", gate: "64.3" },
    { symbol: "☽", gate: "2.5" },
    { symbol: "♀", gate: "46.5" },
    { symbol: "♂", gate: "62.4" },
    { symbol: "♃", gate: "21.2" },
    { symbol: "♄", gate: "20.6" },
    { symbol: "♅", gate: "11.4" },
    { symbol: "♆", gate: "11.5" },
    { symbol: "♇", gate: "58.4" },
    { symbol: "⚷", gate: "44.3" }
  ];

  // Personality data (right side)
  const personalityData = [
    { symbol: "☉", gate: "9.2" },
    { symbol: "⊕", gate: "16.2" },
    { symbol: "☊", gate: "37.5" },
    { symbol: "☋", gate: "40.5" },
    { symbol: "☽", gate: "7.2" },
    { symbol: "♀", gate: "9.1" },
    { symbol: "♂", gate: "28.6" },
    { symbol: "♃", gate: "17.3" },
    { symbol: "♄", gate: "20.1" },
    { symbol: "♅", gate: "10.4" },
    { symbol: "♆", gate: "10.2" },
    { symbol: "♇", gate: "58.6" },
    { symbol: "⚷", gate: "1.1" }
  ];

  const renderShape = (centre) => {
    const size = centre.shape === "diamond" ? 35 : 30;
    
    switch (centre.shape) {
      case "triangle":
        return (
          <polygon
            points={`${centre.x},${centre.y - size/2} ${centre.x - size/2},${centre.y + size/2} ${centre.x + size/2},${centre.y + size/2}`}
            fill={centre.color}
            stroke="#9CA3AF"
            strokeWidth="2"
          />
        );
      case "diamond":
        return (
          <polygon
            points={`${centre.x},${centre.y - size/2} ${centre.x + size/2},${centre.y} ${centre.x},${centre.y + size/2} ${centre.x - size/2},${centre.y}`}
            fill={centre.color}
            stroke="#9CA3AF"
            strokeWidth="2"
          />
        );
      case "square":
        return (
          <rect
            x={centre.x - size/2}
            y={centre.y - size/2}
            width={size}
            height={size}
            fill={centre.color}
            stroke="#9CA3AF"
            strokeWidth="2"
            rx="3"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
      <div className="grid grid-cols-[200px_1fr_200px] gap-4">
        {/* Design Column (Left) */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 text-center mb-3">Design</p>
          {designData.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2"
            >
              <span className="text-gray-600 text-sm">{item.symbol}</span>
              <span className="text-gray-900 text-sm font-medium ml-auto">{item.gate}</span>
            </div>
          ))}
        </div>

        {/* Bodygraph Center */}
        <div className="relative">
          <svg viewBox="0 0 500 550" className="w-full h-auto">
            {/* Channels/Connections - subtle lines between centers */}
            <line x1="250" y1="75" x2="250" y2="105" stroke="#D1D5DB" strokeWidth="12" />
            <line x1="250" y1="135" x2="250" y2="165" stroke="#D1D5DB" strokeWidth="12" />
            <line x1="250" y1="195" x2="250" y2="245" stroke="#D1D5DB" strokeWidth="12" />
            <line x1="250" y1="275" x2="250" y2="315" stroke="#D1D5DB" strokeWidth="12" />
            <line x1="250" y1="345" x2="250" y2="385" stroke="#D1D5DB" strokeWidth="12" />
            <line x1="250" y1="415" x2="250" y2="455" stroke="#D1D5DB" strokeWidth="12" />
            
            {/* Side connections */}
            <line x1="220" y1="260" x2="190" y2="260" stroke="#D1D5DB" strokeWidth="8" />
            <line x1="280" y1="260" x2="310" y2="260" stroke="#D1D5DB" strokeWidth="8" />
            
            {/* Outer channels - body shape */}
            <path
              d="M 250 180 Q 320 240, 310 260 Q 300 320, 250 400"
              fill="none"
              stroke="#D1D5DB"
              strokeWidth="2"
            />
            <path
              d="M 250 180 Q 180 240, 190 260 Q 200 320, 250 400"
              fill="none"
              stroke="#D1D5DB"
              strokeWidth="2"
            />

            {/* Render centers */}
            {centres.map((centre) => renderShape(centre))}

            {/* Arrows */}
            <g>
              <path d="M 370 190 L 340 190" stroke="#9CA3AF" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <path d="M 130 190 L 160 190" stroke="#9CA3AF" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <path d="M 370 210 L 340 210" stroke="#9CA3AF" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <path d="M 130 210 L 160 210" stroke="#9CA3AF" strokeWidth="2" markerEnd="url(#arrowhead)" />
            </g>

            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#9CA3AF" />
              </marker>
            </defs>
          </svg>
        </div>

        {/* Personality Column (Right) */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 text-center mb-3">Personality</p>
          {personalityData.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2"
            >
              <span className="text-gray-900 text-sm font-medium">{item.gate}</span>
              <span className="text-gray-600 text-sm ml-auto">{item.symbol}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-300 border border-gray-300" />
          <span className="text-gray-600">Defined</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white/60 border border-gray-300" />
          <span className="text-gray-600">Undefined</span>
        </div>
      </div>
    </div>
  );
}