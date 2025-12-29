import React from "react";

export default function BodygraphChart({ humanDesign }) {
  // Sample data - would be replaced with actual user data
  const centers = {
    head: { defined: true, gates: [64, 61, 63] },
    ajna: { defined: true, gates: [47, 24, 4, 17, 11, 43] },
    throat: { defined: true, gates: [62, 23, 56, 16, 20, 31, 8, 33] },
    g: { defined: false, gates: [1, 13, 7, 10, 15, 46, 25, 51] },
    heart: { defined: false, gates: [26, 21, 40, 51] },
    sacral: { defined: false, gates: [5, 14, 29, 34, 59, 27, 42, 3] },
    solarPlexus: { defined: true, gates: [6, 37, 22, 36, 49, 55, 30] },
    spleen: { defined: false, gates: [48, 57, 44, 50, 32, 28, 18] },
    root: { defined: true, gates: [53, 60, 52, 19, 39, 41, 58] }
  };

  return (
    <div className="relative w-full flex items-center justify-center py-8">
      <svg viewBox="0 0 800 900" className="w-full h-auto" style={{ maxHeight: "700px" }}>
        <defs>
          {/* Gradients */}
          <linearGradient id="definedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9333EA" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="undefinedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E9D5FF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="channelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>

        {/* Background Circle */}
        <circle cx="400" cy="450" r="320" fill="#F3E8FF" opacity="0.2" />

        {/* Channels (connections between centers) */}
        <g stroke="url(#channelGradient)" strokeWidth="3" fill="none">
          {/* Head to Ajna */}
          <line x1="400" y1="100" x2="400" y2="180" />
          {/* Ajna to Throat */}
          <line x1="400" y1="220" x2="400" y2="280" />
          {/* Throat to G */}
          <line x1="400" y1="320" x2="400" y2="400" />
          {/* G to Sacral */}
          <line x1="400" y1="440" x2="400" y2="520" />
          {/* Sacral to Root */}
          <line x1="400" y1="560" x2="400" y2="640" />
          {/* Side channels */}
          <path d="M 400 400 Q 320 420, 280 480" />
          <path d="M 400 400 Q 480 420, 520 480" />
          <path d="M 400 320 Q 320 340, 280 380" />
          <path d="M 400 320 Q 480 340, 520 380" />
        </g>

        {/* Centers */}
        {/* Head Center (Triangle) */}
        <polygon 
          points="400,60 450,120 350,120" 
          fill={centers.head.defined ? "url(#definedGradient)" : "url(#undefinedGradient)"}
          stroke="#7C3AED" 
          strokeWidth="2"
        />
        <text x="400" y="95" textAnchor="middle" fill="#6B21A8" fontSize="10" fontWeight="600">61 63 64</text>

        {/* Ajna Center (Triangle) */}
        <polygon 
          points="400,180 450,230 350,230" 
          fill={centers.ajna.defined ? "url(#definedGradient)" : "url(#undefinedGradient)"}
          stroke="#7C3AED" 
          strokeWidth="2"
        />
        <text x="400" y="210" textAnchor="middle" fill="#6B21A8" fontSize="10" fontWeight="600">47 24 11</text>

        {/* Throat Center (Square) */}
        <rect 
          x="350" y="280" width="100" height="60" 
          rx="8"
          fill={centers.throat.defined ? "url(#definedGradient)" : "url(#undefinedGradient)"}
          stroke="#7C3AED" 
          strokeWidth="2"
        />
        <text x="400" y="310" textAnchor="middle" fill="#6B21A8" fontSize="10" fontWeight="600">31 8 33</text>
        <text x="400" y="325" textAnchor="middle" fill="#6B21A8" fontSize="9">16 20 62</text>

        {/* G-Center (Diamond) */}
        <polygon 
          points="400,400 440,440 400,480 360,440" 
          fill={centers.g.defined ? "url(#definedGradient)" : "url(#undefinedGradient)"}
          stroke="#7C3AED" 
          strokeWidth="2"
        />
        <text x="400" y="440" textAnchor="middle" fill="#6B21A8" fontSize="10" fontWeight="600">13 7</text>
        <text x="400" y="455" textAnchor="middle" fill="#6B21A8" fontSize="9">10 15</text>

        {/* Heart/Ego Center (Triangle) - Left */}
        <polygon 
          points="280,360 310,400 250,400" 
          fill={centers.heart.defined ? "url(#definedGradient)" : "url(#undefinedGradient)"}
          stroke="#EC4899" 
          strokeWidth="2"
        />
        <text x="280" y="385" textAnchor="middle" fill="#BE185D" fontSize="9" fontWeight="600">21 40</text>

        {/* Spleen Center (Triangle) - Right */}
        <polygon 
          points="520,360 550,400 490,400" 
          fill={centers.spleen.defined ? "url(#definedGradient)" : "url(#undefinedGradient)"}
          stroke="#7C3AED" 
          strokeWidth="2"
        />
        <text x="520" y="385" textAnchor="middle" fill="#6B21A8" fontSize="9" fontWeight="600">48 57</text>

        {/* Solar Plexus Center (Triangle) - Right Lower */}
        <polygon 
          points="520,460 560,520 480,520" 
          fill={centers.solarPlexus.defined ? "url(#definedGradient)" : "url(#undefinedGradient)"}
          stroke="#F59E0B" 
          strokeWidth="2"
        />
        <text x="520" y="495" textAnchor="middle" fill="#D97706" fontSize="9" fontWeight="600">49 55</text>
        <text x="520" y="508" textAnchor="middle" fill="#D97706" fontSize="8">36 37</text>

        {/* Sacral Center (Square) */}
        <rect 
          x="360" y="520" width="80" height="60" 
          rx="8"
          fill={centers.sacral.defined ? "url(#definedGradient)" : "url(#undefinedGradient)"}
          stroke="#DC2626" 
          strokeWidth="2"
        />
        <text x="400" y="545" textAnchor="middle" fill="#991B1B" fontSize="10" fontWeight="600">5 14 29</text>
        <text x="400" y="560" textAnchor="middle" fill="#991B1B" fontSize="9">34 42 3</text>

        {/* Root Center (Square) */}
        <rect 
          x="350" y="640" width="100" height="60" 
          rx="8"
          fill={centers.root.defined ? "url(#definedGradient)" : "url(#undefinedGradient)"}
          stroke="#7C3AED" 
          strokeWidth="2"
        />
        <text x="400" y="665" textAnchor="middle" fill="#6B21A8" fontSize="10" fontWeight="600">53 60 52</text>
        <text x="400" y="680" textAnchor="middle" fill="#6B21A8" fontSize="9">19 39 41</text>

        {/* Arrows pointing to centers */}
        <g stroke="#9CA3AF" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#9CA3AF" />
            </marker>
          </defs>
          {/* Left arrows (Design) */}
          <line x1="200" y1="90" x2="340" y2="90" />
          <line x1="200" y1="200" x2="340" y2="200" />
          
          {/* Right arrows (Personality) */}
          <line x1="600" y1="90" x2="460" y2="90" />
          <line x1="600" y1="200" x2="460" y2="200" />
        </g>

        {/* Labels */}
        <text x="150" y="30" fill="#6B21A8" fontSize="18" fontWeight="700">Design</text>
        <text x="620" y="30" fill="#6B21A8" fontSize="18" fontWeight="700">Personality</text>

        {/* Gate Numbers - Left Side (Design) */}
        <g fill="#6B21A8" fontSize="14" fontWeight="500">
          <text x="80" y="70">40.4</text>
          <text x="80" y="110">37.4</text>
          <text x="80" y="150">63.3</text>
          <text x="80" y="190">64.3</text>
          <text x="80" y="230">2.5</text>
          <text x="80" y="270">46.5</text>
          <text x="80" y="310">62.4</text>
          <text x="80" y="350">21.2</text>
          <text x="80" y="390">20.6</text>
          <text x="80" y="430">11.4</text>
          <text x="80" y="470">11.5</text>
          <text x="80" y="510">58.4</text>
          <text x="80" y="550">44.3</text>
        </g>

        {/* Gate Numbers - Right Side (Personality) */}
        <g fill="#6B21A8" fontSize="14" fontWeight="500">
          <text x="700" y="70">9.2</text>
          <text x="700" y="110">16.2</text>
          <text x="700" y="150">37.5</text>
          <text x="700" y="190">40.5</text>
          <text x="700" y="230">7.2</text>
          <text x="700" y="270">9.1</text>
          <text x="700" y="310">28.6</text>
          <text x="700" y="350">17.3</text>
          <text x="700" y="390">20.1</text>
          <text x="700" y="430">10.4</text>
          <text x="700" y="470">10.2</text>
          <text x="700" y="510">58.6</text>
          <text x="700" y="550">1.1</text>
        </g>
      </svg>
    </div>
  );
}