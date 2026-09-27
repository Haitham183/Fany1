'use client';

import React from 'react';

interface EduTechIndustrialLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  animated?: boolean;
}

export const EduTechIndustrialLogo: React.FC<EduTechIndustrialLogoProps> = ({
  className = '',
  size = 'lg',
  animated = true,
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
    '2xl': 'w-36 h-36',
  };

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${sizeClasses[size]} ${className}`}>
      {/* Background Animated Ambient Glow */}
      {animated && (
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-500/30 via-blue-600/30 to-emerald-500/20 blur-xl animate-pulse pointer-events-none" />
      )}

      {/* Main SVG Vector Logo */}
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xl relative z-10 transition-transform duration-500 hover:scale-105"
      >
        <defs>
          {/* Main Gold Gradient */}
          <linearGradient id="egyptGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="80%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          {/* Deep Royal Tech Blue Gradient */}
          <linearGradient id="royalTechGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="30%" stopColor="#2563EB" />
            <stop offset="70%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Emerald Growth Gradient */}
          <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Shield Metallic Background */}
          <linearGradient id="shieldBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Filter for subtle drop shadow */}
          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Shield / Emblem Contour */}
        <path
          d="M100 8 L170 34 C170 105 145 155 100 192 C55 155 30 105 30 34 Z"
          fill="url(#shieldBgGrad)"
          stroke="url(#egyptGoldGrad)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Inner Shield Accent Line */}
        <path
          d="M100 18 L160 41 C160 100 138 145 100 178 C62 145 40 100 40 41 Z"
          fill="none"
          stroke="url(#royalTechGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 2"
          opacity="0.8"
        />

        {/* Industrial Outer Cogwheel (Gear) */}
        <g className={animated ? 'animate-[spin_40s_linear_infinite] origin-center' : ''}>
          <circle
            cx="100"
            cy="92"
            r="44"
            fill="none"
            stroke="url(#egyptGoldGrad)"
            strokeWidth="3.5"
            opacity="0.35"
          />
          {/* 12 Gear Teeth */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <rect
              key={deg}
              x="96"
              y="44"
              width="8"
              height="8"
              rx="2"
              fill="url(#egyptGoldGrad)"
              transform={`rotate(${deg} 100 92)`}
              opacity="0.9"
            />
          ))}
        </g>

        {/* Electronic Circuit Nodes & Tracks */}
        <g opacity="0.75">
          {/* Top Left Circuit */}
          <path d="M55 70 L72 70 L80 82" stroke="url(#royalTechGrad)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="55" cy="70" r="3" fill="#38BDF8" />

          {/* Top Right Circuit */}
          <path d="M145 70 L128 70 L120 82" stroke="url(#royalTechGrad)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="145" cy="70" r="3" fill="#38BDF8" />

          {/* Bottom Left Circuit */}
          <path d="M60 120 L76 120 L84 110" stroke="url(#royalTechGrad)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="60" cy="120" r="3" fill="#34D399" />

          {/* Bottom Right Circuit */}
          <path d="M140 120 L124 120 L116 110" stroke="url(#royalTechGrad)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="140" cy="120" r="3" fill="#34D399" />
        </g>

        {/* Central Core Circle (Microchip / Precision Core) */}
        <circle
          cx="100"
          cy="92"
          r="34"
          fill="url(#royalTechGrad)"
          stroke="url(#egyptGoldGrad)"
          strokeWidth="2.5"
        />

        {/* Industrial Crossed Wrenches & Caliper / Atom Symbolism */}
        <g transform="translate(100, 92) scale(0.9) translate(-100, -92)">
          {/* Academic Graduation Cap (القبعة الأكاديمية للجدارات) */}
          <path
            d="M100 68 L126 80 L100 92 L74 80 Z"
            fill="url(#egyptGoldGrad)"
            stroke="#FEF08A"
            strokeWidth="1.2"
          />
          {/* Cap Skull & Tassel */}
          <path
            d="M82 86 C82 96 118 96 118 86"
            fill="none"
            stroke="url(#egyptGoldGrad)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M126 80 L130 92 L128 102"
            fill="none"
            stroke="#FEF08A"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="128" cy="103" r="2" fill="#FEF08A" />

          {/* Technical Torch / Egyptian Industrial Spark */}
          <path
            d="M93 118 L107 118 L104 104 L96 104 Z"
            fill="url(#egyptGoldGrad)"
          />
          <path
            d="M100 96 C96 100 97 104 100 107 C103 104 104 100 100 96 Z"
            fill="#38BDF8"
            className={animated ? 'animate-bounce' : ''}
          />
        </g>

        {/* 3 Golden Stars of Excellence (التعليم - الجدارات - التدريب) */}
        <g fill="url(#egyptGoldGrad)">
          {/* Left Star */}
          <polygon points="76,152 78,146 84,146 79,142 81,136 76,140 71,136 73,142 68,146 74,146" transform="scale(0.8) translate(22, 28)" />
          {/* Center Star */}
          <polygon points="100,165 102,158 109,158 104,153 106,146 100,150 94,146 96,153 91,158 98,158" transform="scale(0.9) translate(11, 15)" />
          {/* Right Star */}
          <polygon points="124,152 126,146 132,146 127,142 129,136 124,140 119,136 121,142 116,146 122,146" transform="scale(0.8) translate(28, 28)" />
        </g>

        {/* Bottom Banner Ribbon Ribbon */}
        <path
          d="M62 165 Q100 178 138 165 L132 173 Q100 184 68 173 Z"
          fill="url(#egyptGoldGrad)"
          stroke="#78350F"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
};
