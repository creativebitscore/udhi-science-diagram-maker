export const initialSvgs = {
  pythagoras: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <title>Pythagoras' Theorem: a² + b² = c²</title>
  <defs>
    <linearGradient id="pyth-grad-c" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="pyth-grad-a" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#047857" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="pyth-grad-b" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#d97706" stop-opacity="0.95"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.15"/>
    </filter>
  </defs>

  <style>
    @keyframes pulseGlow {
      0% { opacity: 0.7; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.02); }
      100% { opacity: 0.7; transform: scale(1); }
    }
    @keyframes dashMove {
      to { stroke-dashoffset: -40; }
    }
    .math-title { font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 700; fill: #0f172a; }
    .math-sub { font-family: 'Inter', sans-serif; font-size: 14px; fill: #475569; }
    .label-text { font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; fill: #ffffff; }
    .annot-text { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; fill: #1e293b; }
    .hypot-pulse { animation: pulseGlow 3s infinite ease-in-out; transform-origin: 470px 240px; }
    .flow-line { stroke-dasharray: 6 4; animation: dashMove 2s linear infinite; }
  </style>

  <!-- Background Canvas -->
  <rect x="0" y="0" width="800" height="600" fill="#f8fafc" rx="16"/>

  <!-- Header -->
  <text x="40" y="50" class="math-title">Pythagoras' Theorem</text>
  <text x="40" y="74" class="math-sub">In a right-angled triangle: a² + b² = c² (Hypotenuse Theorem)</text>

  <!-- Right Triangle: Vertices at (260, 380), (440, 380), (260, 245) -->
  <!-- Side a (vertical) = 135px, Side b (horizontal) = 180px, Side c (hypotenuse) = 225px -->
  <polygon points="260,380 440,380 260,245" fill="#e2e8f0" stroke="#0f172a" stroke-width="3" filter="url(#shadow)"/>

  <!-- Right Angle Square Indicator at (260, 380) -->
  <rect x="260" y="360" width="20" height="20" fill="none" stroke="#0f172a" stroke-width="2"/>
  <circle cx="270" cy="370" r="2.5" fill="#0f172a"/>

  <!-- Square on Side a (Left, 135x135): from x = 125 to 260, y = 245 to 380 -->
  <rect x="125" y="245" width="135" height="135" fill="url(#pyth-grad-a)" stroke="#047857" stroke-width="2" rx="4" filter="url(#shadow)"/>
  <text x="192" y="305" text-anchor="middle" class="label-text">a² = 9</text>
  <text x="192" y="325" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#d1fae5">Area a²</text>

  <!-- Square on Side b (Bottom, 180x180): from x = 260 to 440, y = 380 to 560 -->
  <rect x="260" y="380" width="180" height="150" fill="url(#pyth-grad-b)" stroke="#d97706" stroke-width="2" rx="4" filter="url(#shadow)"/>
  <text x="350" y="450" text-anchor="middle" class="label-text">b² = 16</text>
  <text x="350" y="470" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#fef3c7">Area b²</text>

  <!-- Square on Hypotenuse c (Rotated along hypotenuse from (260, 245) to (440, 380)) -->
  <g class="hypot-pulse">
    <!-- Hypotenuse square projection -->
    <polygon points="260,245 440,380 575,200 395,65" fill="url(#pyth-grad-c)" stroke="#1d4ed8" stroke-width="2.5" filter="url(#shadow)"/>
    <text x="415" y="220" text-anchor="middle" class="label-text" font-size="18">c² = 25</text>
    <text x="415" y="242" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#dbeafe">Area c² = a² + b²</text>
  </g>

  <!-- Side Labels with dimension arrows -->
  <text x="110" y="315" class="annot-text" fill="#047857">Side a = 3</text>
  <text x="330" y="555" class="annot-text" fill="#d97706">Side b = 4</text>
  <text x="475" y="340" class="annot-text" fill="#1d4ed8">Hypotenuse c = 5</text>

  <!-- Proof Summary Box (Right Pane) -->
  <rect x="570" y="360" width="200" height="170" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="10" filter="url(#shadow)"/>
  <text x="590" y="392" font-family="sans-serif" font-size="15" font-weight="700" fill="#0f172a">Mathematical Proof</text>
  <line x1="590" y1="404" x2="750" y2="404" stroke="#e2e8f0" stroke-width="1.5"/>
  <text x="590" y="430" font-family="sans-serif" font-size="14" font-weight="600" fill="#047857">a² = 3² = 9</text>
  <text x="590" y="455" font-family="sans-serif" font-size="14" font-weight="600" fill="#d97706">b² = 4² = 16</text>
  <text x="590" y="482" font-family="sans-serif" font-size="14" font-weight="700" fill="#1d4ed8">9 + 16 = 25 = 5²</text>
  <text x="590" y="510" font-family="sans-serif" font-size="13" font-weight="700" fill="#10b981">∴ a² + b² = c² ✓</text>

  <!-- Animated flow indicator along hypotenuse -->
  <line x1="260" y1="245" x2="440" y2="380" stroke="#60a5fa" stroke-width="3" class="flow-line"/>
</svg>`,

  circle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <title>Parts of a Circle: Centre, Radius, Diameter, Circumference</title>
  <defs>
    <filter id="c-shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-opacity="0.12"/>
    </filter>
  </defs>

  <style>
    @keyframes rotateRing {
      0% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: 1200; }
    }
    @keyframes pulseDot {
      0% { r: 5; opacity: 1; }
      50% { r: 9; opacity: 0.6; }
      100% { r: 5; opacity: 1; }
    }
    @keyframes sweepRadius {
      0% { transform: rotate(0deg); }
      50% { transform: rotate(45deg); }
      100% { transform: rotate(0deg); }
    }
    .circle-title { font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 700; fill: #0f172a; }
    .circle-sub { font-family: 'Inter', sans-serif; font-size: 14px; fill: #475569; }
    .geo-label { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; }
    .circ-anim { stroke-dasharray: 20 12; animation: rotateRing 20s linear infinite; }
    .pulse-centre { animation: pulseDot 2s infinite ease-in-out; }
    .radius-rot { transform-origin: 380px 310px; animation: sweepRadius 6s ease-in-out infinite; }
  </style>

  <!-- Background -->
  <rect x="0" y="0" width="800" height="600" fill="#f8fafc" rx="16"/>

  <!-- Title Section -->
  <text x="40" y="50" class="circle-title">Parts of a Circle</text>
  <text x="40" y="74" class="circle-sub">Centre, Radius, Diameter, and Circumference Relationships</text>

  <!-- Main Circle Body (Centre at 380, 310; Radius = 190) -->
  <circle cx="380" cy="310" r="190" fill="#eff6ff" stroke="#cbd5e1" stroke-width="2"/>

  <!-- Animated Circumference Outer Perimeter -->
  <circle cx="380" cy="310" r="190" fill="none" stroke="#2563eb" stroke-width="4" class="circ-anim"/>

  <!-- Horizontal Diameter (spanning across circle through centre) -->
  <line x1="190" y1="310" x2="570" y2="310" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/>
  <circle cx="190" cy="310" r="5" fill="#dc2626"/>
  <circle cx="570" cy="310" r="5" fill="#dc2626"/>

  <!-- Radius (Centre to upper perimeter) with smooth rotation animation -->
  <g class="radius-rot">
    <line x1="380" y1="310" x2="514" y2="176" stroke="#16a34a" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="514" cy="176" r="6" fill="#16a34a"/>
    <text x="450" y="235" class="geo-label" fill="#16a34a">Radius (r)</text>
  </g>

  <!-- Centre Point Indicator -->
  <circle cx="380" cy="310" r="6" fill="#0f172a" class="pulse-centre"/>
  <circle cx="380" cy="310" r="3" fill="#ffffff"/>
  <text x="390" y="335" class="geo-label" fill="#0f172a">Centre (O)</text>

  <!-- Diameter Label -->
  <text x="240" y="300" class="geo-label" fill="#dc2626">Diameter (d = 2r)</text>

  <!-- Circumference Label with Arrow -->
  <path d="M 540 180 Q 610 200 600 270" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="4 4"/>
  <text x="610" y="275" class="geo-label" fill="#2563eb">Circumference (C = 2πr)</text>

  <!-- Legend & Formula Box -->
  <rect x="580" y="360" width="190" height="175" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" rx="10" filter="url(#c-shadow)"/>
  <text x="600" y="390" font-family="sans-serif" font-size="15" font-weight="700" fill="#0f172a">Circle Formulas</text>
  <line x1="600" y1="402" x2="750" y2="402" stroke="#e2e8f0" stroke-width="1.5"/>
  <text x="600" y="425" font-family="sans-serif" font-size="13" font-weight="600" fill="#16a34a">• Radius = r</text>
  <text x="600" y="450" font-family="sans-serif" font-size="13" font-weight="600" fill="#dc2626">• Diameter = 2 × r</text>
  <text x="600" y="475" font-family="sans-serif" font-size="13" font-weight="600" fill="#2563eb">• C = π × d = 2πr</text>
  <text x="600" y="510" font-family="sans-serif" font-size="12" font-weight="500" fill="#64748b">1 Continuous Boundary</text>
</svg>`,

  seriesCircuit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <title>Series Circuit: Single Loop and Shared Voltage</title>
  <defs>
    <filter id="circuit-shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-opacity="0.12"/>
    </filter>
  </defs>

  <style>
    @keyframes flowElectrons {
      from { stroke-dashoffset: 200; }
      to { stroke-dashoffset: 0; }
    }
    @keyframes glowBulb {
      0%, 100% { fill: #fef08a; stroke: #ca8a04; filter: drop-shadow(0 0 4px #facc15); }
      50% { fill: #fef9c3; stroke: #eab308; filter: drop-shadow(0 0 12px #fde047); }
    }
    .circuit-title { font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 700; fill: #0f172a; }
    .circuit-sub { font-family: 'Inter', sans-serif; font-size: 14px; fill: #475569; }
    .wire-base { stroke: #334155; stroke-width: 4; fill: none; stroke-linecap: round; }
    .electron-flow { stroke: #38bdf8; stroke-width: 4; fill: none; stroke-dasharray: 12 16; stroke-linecap: round; animation: flowElectrons 2s linear infinite; }
    .bulb-glow { animation: glowBulb 2s infinite ease-in-out; }
    .comp-label { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; fill: #0f172a; text-anchor: middle; }
    .val-label { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; fill: #2563eb; text-anchor: middle; }
  </style>

  <!-- Background -->
  <rect x="0" y="0" width="800" height="600" fill="#f8fafc" rx="16"/>

  <!-- Title -->
  <text x="40" y="50" class="circuit-title">Series Circuit: Physics Schematic</text>
  <text x="40" y="74" class="circuit-sub">Single continuous loop: identical current everywhere (I), cell voltage shared (V = V₁ + V₂)</text>

  <!-- Main Circuit Loop Path: 560 x 360 Rectangle from (120, 140) to (680, 500) -->
  <rect x="120" y="140" width="560" height="360" rx="16" class="wire-base"/>
  <rect x="120" y="140" width="560" height="360" rx="16" class="electron-flow"/>

  <!-- Battery / DC Cell (Top Wire, centered at x=400, y=140) -->
  <rect x="360" y="125" width="80" height="30" fill="#f8fafc"/>
  <!-- Positive Plate (long line) -->
  <line x1="390" y1="115" x2="390" y2="165" stroke="#dc2626" stroke-width="4"/>
  <!-- Negative Plate (short thick line) -->
  <line x1="410" y1="125" x2="410" y2="155" stroke="#0f172a" stroke-width="6"/>
  <text x="375" y="112" font-family="sans-serif" font-size="16" font-weight="700" fill="#dc2626">+</text>
  <text x="425" y="112" font-family="sans-serif" font-size="18" font-weight="700" fill="#0f172a">-</text>
  <text x="400" y="95" class="comp-label">DC Cell (Battery)</text>
  <text x="400" y="190" class="val-label">V_total = 12V</text>

  <!-- Switch (Left Wire, centered at x=120, y=320) -->
  <rect x="105" y="280" width="30" height="80" fill="#f8fafc"/>
  <circle cx="120" cy="290" r="5" fill="#334155"/>
  <circle cx="120" cy="350" r="5" fill="#334155"/>
  <line x1="120" y1="350" x2="120" y2="295" stroke="#16a34a" stroke-width="4"/>
  <text x="75" y="325" class="comp-label">Closed Switch</text>

  <!-- Component 1: Lamp / Bulb 1 (Bottom Wire, centered at x=280, y=500) -->
  <rect x="235" y="475" width="90" height="50" fill="#f8fafc"/>
  <circle cx="280" cy="500" r="22" class="bulb-glow" stroke-width="2.5"/>
  <!-- Cross filament -->
  <line x1="265" y1="485" x2="295" y2="515" stroke="#854d0e" stroke-width="2.5"/>
  <line x1="265" y1="515" x2="295" y2="485" stroke="#854d0e" stroke-width="2.5"/>
  <text x="280" y="545" class="comp-label">Lamp 1</text>
  <text x="280" y="565" class="val-label">V₁ = 6V (Half voltage)</text>

  <!-- Component 2: Lamp / Bulb 2 (Bottom Wire, centered at x=520, y=500) -->
  <rect x="475" y="475" width="90" height="50" fill="#f8fafc"/>
  <circle cx="520" cy="500" r="22" class="bulb-glow" stroke-width="2.5"/>
  <line x1="505" y1="485" x2="535" y2="515" stroke="#854d0e" stroke-width="2.5"/>
  <line x1="505" y1="515" x2="535" y2="485" stroke="#854d0e" stroke-width="2.5"/>
  <text x="520" y="545" class="comp-label">Lamp 2</text>
  <text x="520" y="565" class="val-label">V₂ = 6V (Half voltage)</text>

  <!-- Current Flow Ammeter / Callout (Right Wire, centered at x=680, y=320) -->
  <circle cx="680" cy="320" r="22" fill="#ffffff" stroke="#2563eb" stroke-width="3"/>
  <text x="680" y="326" font-family="sans-serif" font-size="16" font-weight="700" fill="#2563eb" text-anchor="middle">A</text>
  <text x="735" y="315" class="comp-label">Ammeter</text>
  <text x="735" y="335" class="val-label">I = 2A everywhere</text>

  <!-- Summary Card inside circuit -->
  <rect x="250" y="230" width="300" height="150" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="10" filter="url(#circuit-shadow)"/>
  <text x="400" y="260" font-family="sans-serif" font-size="15" font-weight="700" fill="#0f172a" text-anchor="middle">Series Circuit Rules</text>
  <line x1="270" y1="272" x2="530" y2="272" stroke="#e2e8f0" stroke-width="1.5"/>
  <text x="280" y="298" font-family="sans-serif" font-size="13" font-weight="600" fill="#0284c7">• Current (I): Same in all parts of loop</text>
  <text x="280" y="324" font-family="sans-serif" font-size="13" font-weight="600" fill="#d97706">• Voltage (V): Shared between lamps</text>
  <text x="280" y="350" font-family="sans-serif" font-size="13" font-weight="700" fill="#16a34a">• Formula: V_total = V₁ + V₂ = 12V</text>
</svg>`,

  photosynthesis: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <title>Photosynthesis: Sunlight, Chlorophyll, CO2 + Water into Glucose + Oxygen</title>
  <defs>
    <linearGradient id="sun-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
    <linearGradient id="leaf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4ade80"/>
      <stop offset="100%" stop-color="#15803d"/>
    </linearGradient>
    <filter id="p-shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-opacity="0.12"/>
    </filter>
  </defs>

  <style>
    @keyframes rayFlow {
      0% { stroke-dashoffset: 40; opacity: 0.6; }
      50% { opacity: 1; }
      100% { stroke-dashoffset: 0; opacity: 0.6; }
    }
    @keyframes bubbleRise {
      0% { transform: translateY(0); opacity: 0.3; }
      50% { opacity: 0.9; }
      100% { transform: translateY(-20px); opacity: 0.3; }
    }
    .photo-title { font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 700; fill: #0f172a; }
    .photo-sub { font-family: 'Inter', sans-serif; font-size: 14px; fill: #475569; }
    .leaf-label { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700; }
    .sun-ray { stroke: #eab308; stroke-width: 3.5; stroke-dasharray: 8 6; animation: rayFlow 1.5s linear infinite; }
    .o2-float { animation: bubbleRise 2.5s infinite ease-in-out; }
  </style>

  <!-- Background -->
  <rect x="0" y="0" width="800" height="600" fill="#f8fafc" rx="16"/>

  <!-- Title -->
  <text x="40" y="50" class="photo-title">Photosynthesis Process</text>
  <text x="40" y="74" class="photo-sub">Carbon Dioxide + Water + Light Energy (Chlorophyll) → Glucose + Oxygen</text>

  <!-- Sun Element (Top Left at 100, 150) -->
  <circle cx="110" cy="150" r="45" fill="url(#sun-grad)" filter="url(#p-shadow)"/>
  <text x="110" y="155" font-family="sans-serif" font-size="13" font-weight="700" fill="#854d0e" text-anchor="middle">Sunlight</text>

  <!-- Light energy rays entering the leaf -->
  <line x1="160" y1="170" x2="280" y2="250" class="sun-ray"/>
  <line x1="150" y1="190" x2="260" y2="280" class="sun-ray"/>
  <text x="210" y="210" class="leaf-label" fill="#ca8a04">Light Energy</text>

  <!-- Main Leaf Representation (Center: 250 to 550) -->
  <!-- Leaf outline path -->
  <path d="M 240 330 C 260 210, 520 220, 560 330 C 520 440, 260 450, 240 330 Z" fill="url(#leaf-grad)" stroke="#166534" stroke-width="3" filter="url(#p-shadow)"/>

  <!-- Leaf Vein structure -->
  <path d="M 240 330 Q 390 325 560 330" fill="none" stroke="#bbf7d0" stroke-width="3"/>
  <path d="M 330 328 Q 360 280 400 270" fill="none" stroke="#bbf7d0" stroke-width="2"/>
  <path d="M 350 328 Q 380 375 420 385" fill="none" stroke="#bbf7d0" stroke-width="2"/>
  <path d="M 440 329 Q 470 290 500 285" fill="none" stroke="#bbf7d0" stroke-width="2"/>

  <!-- Chloroplast Highlight inside leaf -->
  <ellipse cx="390" cy="330" rx="40" ry="24" fill="#14532d" stroke="#86efac" stroke-width="2"/>
  <text x="390" y="334" font-family="sans-serif" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">Chlorophyll</text>

  <!-- INPUT 1: Carbon Dioxide (CO2) from Atmosphere (Top Right) -->
  <g>
    <rect x="420" y="140" width="160" height="50" rx="8" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" filter="url(#p-shadow)"/>
    <text x="500" y="165" class="leaf-label" fill="#475569" text-anchor="middle">Carbon Dioxide (CO₂)</text>
    <text x="500" y="180" font-family="sans-serif" font-size="11" fill="#64748b" text-anchor="middle">Absorbed via stomata</text>
    <line x1="480" y1="195" x2="450" y2="245" stroke="#64748b" stroke-width="2.5" stroke-dasharray="4 3"/>
    <polygon points="450,245 448,237 456,242" fill="#64748b"/>
  </g>

  <!-- INPUT 2: Water (H2O) from Roots/Stem (Bottom Left) -->
  <g>
    <rect x="100" y="470" width="160" height="50" rx="8" fill="#ffffff" stroke="#38bdf8" stroke-width="1.5" filter="url(#p-shadow)"/>
    <text x="180" y="495" class="leaf-label" fill="#0284c7" text-anchor="middle">Water (H₂O)</text>
    <text x="180" y="510" font-family="sans-serif" font-size="11" fill="#0369a1" text-anchor="middle">Absorbed from roots</text>
    <line x1="210" y1="465" x2="270" y2="400" stroke="#0284c7" stroke-width="2.5" stroke-dasharray="4 3"/>
    <polygon points="270,400 263,405 268,412" fill="#0284c7"/>
  </g>

  <!-- OUTPUT 1: Glucose (C6H12O6) Food Output (Bottom Right) -->
  <g>
    <rect x="540" y="470" width="170" height="50" rx="8" fill="#ffffff" stroke="#eab308" stroke-width="1.5" filter="url(#p-shadow)"/>
    <text x="625" y="495" class="leaf-label" fill="#a16207" text-anchor="middle">Glucose (C₆H₁₂O₆)</text>
    <text x="625" y="510" font-family="sans-serif" font-size="11" fill="#ca8a04" text-anchor="middle">Energy stored in plant</text>
    <line x1="510" y1="400" x2="570" y2="465" stroke="#a16207" stroke-width="2.5"/>
    <polygon points="570,465 568,457 562,463" fill="#a16207"/>
  </g>

  <!-- OUTPUT 2: Oxygen (O2) Released (Top Center) -->
  <g class="o2-float">
    <rect x="300" y="110" width="130" height="40" rx="8" fill="#ffffff" stroke="#10b981" stroke-width="1.5" filter="url(#p-shadow)"/>
    <text x="365" y="135" class="leaf-label" fill="#059669" text-anchor="middle">Oxygen (O₂) ↑</text>
    <line x1="365" y1="230" x2="365" y2="155" stroke="#10b981" stroke-width="2.5" stroke-dasharray="3 3"/>
  </g>

  <!-- Chemical Equation Footer Banner -->
  <rect x="100" y="540" width="600" height="40" rx="8" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1"/>
  <text x="400" y="565" font-family="sans-serif" font-size="14" font-weight="700" fill="#065f46" text-anchor="middle">
    Balanced Equation: 6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂
  </text>
</svg>`,

  statesOfMatter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <title>States of Matter: Solid, Liquid, Gas Particle Motion</title>
  <defs>
    <filter id="m-shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-opacity="0.12"/>
    </filter>
  </defs>

  <style>
    @keyframes solidVibe {
      0% { transform: translate(0, 0); }
      25% { transform: translate(1px, -1px); }
      50% { transform: translate(-1px, 1px); }
      75% { transform: translate(1px, 1px); }
      100% { transform: translate(0, 0); }
    }
    @keyframes liquidFlow {
      0% { transform: translate(0, 0); }
      33% { transform: translate(4px, -3px); }
      66% { transform: translate(-3px, 4px); }
      100% { transform: translate(0, 0); }
    }
    @keyframes gasBounce1 {
      0% { transform: translate(0, 0); }
      25% { transform: translate(40px, -50px); }
      50% { transform: translate(-30px, 60px); }
      75% { transform: translate(50px, 30px); }
      100% { transform: translate(0, 0); }
    }
    @keyframes gasBounce2 {
      0% { transform: translate(0, 0); }
      25% { transform: translate(-50px, 40px); }
      50% { transform: translate(40px, -40px); }
      75% { transform: translate(-20px, -30px); }
      100% { transform: translate(0, 0); }
    }
    .matter-title { font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 700; fill: #0f172a; }
    .matter-sub { font-family: 'Inter', sans-serif; font-size: 14px; fill: #475569; }
    .state-head { font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 700; text-anchor: middle; }
    .state-desc { font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; fill: #475569; text-anchor: middle; }
    .vibe-particle { animation: solidVibe 0.25s infinite ease-in-out; }
    .liquid-particle { animation: liquidFlow 3s infinite ease-in-out; }
    .gas-particle-1 { animation: gasBounce1 2s infinite linear; }
    .gas-particle-2 { animation: gasBounce2 2.3s infinite linear; }
  </style>

  <!-- Background -->
  <rect x="0" y="0" width="800" height="600" fill="#f8fafc" rx="16"/>

  <!-- Title -->
  <text x="40" y="50" class="matter-title">States of Matter: Molecular Arrangement</text>
  <text x="40" y="74" class="matter-sub">Particles in solids, liquids, and gases: spacing, kinetic energy, and intermolecular forces</text>

  <!-- Chamber 1: SOLID (Left: x=60 to 260) -->
  <rect x="50" y="110" width="210" height="340" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" filter="url(#m-shadow)"/>
  <rect x="50" y="110" width="210" height="40" rx="12" fill="#f1f5f9"/>
  <text x="155" y="136" class="state-head" fill="#1e3a8a">SOLID</text>

  <!-- Solid Lattice Grid: 4 rows x 4 cols of particles at bottom of chamber -->
  <g class="vibe-particle">
    <!-- Row 1 -->
    <circle cx="100" cy="300" r="14" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
    <circle cx="135" cy="300" r="14" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
    <circle cx="170" cy="300" r="14" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
    <circle cx="205" cy="300" r="14" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
    <!-- Row 2 -->
    <circle cx="100" cy="335" r="14" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
    <circle cx="135" cy="335" r="14" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
    <circle cx="170" cy="335" r="14" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
    <circle cx="205" cy="335" r="14" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
    <!-- Row 3 -->
    <circle cx="100" cy="370" r="14" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
    <circle cx="135" cy="370" r="14" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
    <circle cx="170" cy="370" r="14" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
    <circle cx="205" cy="370" r="14" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
    <!-- Row 4 -->
    <circle cx="100" cy="405" r="14" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
    <circle cx="135" cy="405" r="14" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
    <circle cx="170" cy="405" r="14" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
    <circle cx="205" cy="405" r="14" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
  </g>
  <text x="155" y="475" class="state-desc">• Close together in regular lattice</text>
  <text x="155" y="495" class="state-desc">• Vibrate in fixed positions</text>

  <!-- Chamber 2: LIQUID (Middle: x=295 to 505) -->
  <rect x="295" y="110" width="210" height="340" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" filter="url(#m-shadow)"/>
  <rect x="295" y="110" width="210" height="40" rx="12" fill="#f1f5f9"/>
  <text x="400" y="136" class="state-head" fill="#0284c7">LIQUID</text>

  <!-- Liquid Particles: irregular close arrangement sliding past each other -->
  <g class="liquid-particle">
    <circle cx="340" cy="320" r="14" fill="#06b6d4" stroke="#0891b2" stroke-width="1.5"/>
    <circle cx="380" cy="315" r="14" fill="#06b6d4" stroke="#0891b2" stroke-width="1.5"/>
    <circle cx="430" cy="330" r="14" fill="#06b6d4" stroke="#0891b2" stroke-width="1.5"/>
    <circle cx="465" cy="325" r="14" fill="#06b6d4" stroke="#0891b2" stroke-width="1.5"/>
    <circle cx="355" cy="355" r="14" fill="#06b6d4" stroke="#0891b2" stroke-width="1.5"/>
    <circle cx="395" cy="360" r="14" fill="#06b6d4" stroke="#0891b2" stroke-width="1.5"/>
    <circle cx="445" cy="365" r="14" fill="#06b6d4" stroke="#0891b2" stroke-width="1.5"/>
    <circle cx="335" cy="395" r="14" fill="#06b6d4" stroke="#0891b2" stroke-width="1.5"/>
    <circle cx="375" cy="405" r="14" fill="#06b6d4" stroke="#0891b2" stroke-width="1.5"/>
    <circle cx="420" cy="400" r="14" fill="#06b6d4" stroke="#0891b2" stroke-width="1.5"/>
    <circle cx="460" cy="405" r="14" fill="#06b6d4" stroke="#0891b2" stroke-width="1.5"/>
  </g>
  <text x="400" y="475" class="state-desc">• Close contact, irregular order</text>
  <text x="400" y="495" class="state-desc">• Slide and flow past each other</text>

  <!-- Chamber 3: GAS (Right: x=540 to 750) -->
  <rect x="540" y="110" width="210" height="340" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" filter="url(#m-shadow)"/>
  <rect x="540" y="110" width="210" height="40" rx="12" fill="#f1f5f9"/>
  <text x="645" y="136" class="state-head" fill="#b91c1c">GAS</text>

  <!-- Gas Particles: far apart, high kinetic energy bouncing -->
  <g class="gas-particle-1">
    <circle cx="580" cy="200" r="14" fill="#f87171" stroke="#dc2626" stroke-width="1.5"/>
    <circle cx="680" cy="300" r="14" fill="#f87171" stroke="#dc2626" stroke-width="1.5"/>
    <circle cx="610" cy="380" r="14" fill="#f87171" stroke="#dc2626" stroke-width="1.5"/>
  </g>
  <g class="gas-particle-2">
    <circle cx="670" cy="180" r="14" fill="#f87171" stroke="#dc2626" stroke-width="1.5"/>
    <circle cx="590" cy="290" r="14" fill="#f87171" stroke="#dc2626" stroke-width="1.5"/>
    <circle cx="690" cy="390" r="14" fill="#f87171" stroke="#dc2626" stroke-width="1.5"/>
  </g>
  <text x="645" y="475" class="state-desc">• Far apart with empty space</text>
  <text x="645" y="495" class="state-desc">• Move rapidly in random directions</text>

  <!-- Energy Transition Arrow along bottom -->
  <line x1="100" y1="540" x2="700" y2="540" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
  <polygon points="700,540 685,532 685,548" fill="#f59e0b"/>
  <text x="400" y="565" font-family="sans-serif" font-size="13" font-weight="700" fill="#d97706" text-anchor="middle">Increasing Temperature and Kinetic Energy →</text>
</svg>`
};
