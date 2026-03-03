import React from 'react';
import { SvgType, UnitSvgProps } from '../types/index.js';

const Swordsman: React.FC<UnitSvgProps> = ({ size }) => (
  <svg viewBox="0 0 64 64" width={size} height={size}>
    {/* Body */}
    <rect x="24" y="20" width="16" height="22" rx="3" fill="#8B7355" />
    {/* Head */}
    <circle cx="32" cy="14" r="9" fill="#FDBCB4" />
    {/* Helmet */}
    <path d="M23 14 Q23 5 32 5 Q41 5 41 14" fill="#708090" />
    <rect x="23" y="12" width="18" height="3" rx="1" fill="#708090" />
    {/* Eyes */}
    <circle cx="29" cy="14" r="1.5" fill="#333" />
    <circle cx="35" cy="14" r="1.5" fill="#333" />
    {/* Sword arm */}
    <rect x="40" y="22" width="6" height="3" rx="1" fill="#FDBCB4" />
    <rect x="44" y="14" width="3" height="14" rx="1" fill="#A0A0A0" />
    <rect x="42" y="13" width="7" height="3" rx="1" fill="#B8860B" />
    {/* Shield arm */}
    <rect x="18" y="22" width="6" height="3" rx="1" fill="#FDBCB4" />
    <ellipse cx="16" cy="28" rx="6" ry="8" fill="#4A6FA5" stroke="#2C4A7C" strokeWidth="1" />
    {/* Legs */}
    <rect x="25" y="42" width="6" height="14" rx="2" fill="#5C4033" />
    <rect x="33" y="42" width="6" height="14" rx="2" fill="#5C4033" />
    {/* Boots */}
    <rect x="24" y="53" width="8" height="4" rx="2" fill="#3B2414" />
    <rect x="32" y="53" width="8" height="4" rx="2" fill="#3B2414" />
  </svg>
);

const Spearman: React.FC<UnitSvgProps> = ({ size }) => (
  <svg viewBox="0 0 64 64" width={size} height={size}>
    {/* Body */}
    <rect x="24" y="20" width="16" height="22" rx="3" fill="#6B8E6B" />
    {/* Head */}
    <circle cx="32" cy="14" r="9" fill="#FDBCB4" />
    {/* Headband */}
    <rect x="23" y="10" width="18" height="3" rx="1" fill="#8B0000" />
    {/* Eyes */}
    <circle cx="29" cy="14" r="1.5" fill="#333" />
    <circle cx="35" cy="14" r="1.5" fill="#333" />
    {/* Spear */}
    <rect x="43" y="2" width="2.5" height="50" rx="1" fill="#8B6914" />
    <polygon points="44.25,0 40,8 48.5,8" fill="#C0C0C0" />
    {/* Arms */}
    <rect x="40" y="24" width="6" height="3" rx="1" fill="#FDBCB4" />
    <rect x="18" y="26" width="6" height="3" rx="1" fill="#FDBCB4" />
    {/* Legs */}
    <rect x="25" y="42" width="6" height="14" rx="2" fill="#556B2F" />
    <rect x="33" y="42" width="6" height="14" rx="2" fill="#556B2F" />
    {/* Boots */}
    <rect x="24" y="53" width="8" height="4" rx="2" fill="#3B2414" />
    <rect x="32" y="53" width="8" height="4" rx="2" fill="#3B2414" />
  </svg>
);

const Knight: React.FC<UnitSvgProps> = ({ size }) => (
  <svg viewBox="0 0 64 64" width={size} height={size}>
    {/* Body - heavy armor */}
    <rect x="22" y="20" width="20" height="24" rx="3" fill="#708090" stroke="#556677" strokeWidth="1" />
    <line x1="32" y1="20" x2="32" y2="44" stroke="#556677" strokeWidth="1" />
    {/* Head */}
    <circle cx="32" cy="14" r="9" fill="#FDBCB4" />
    {/* Full helmet */}
    <path d="M23 16 Q23 3 32 3 Q41 3 41 16" fill="#708090" />
    <rect x="23" y="14" width="18" height="4" rx="1" fill="#607080" />
    <rect x="27" y="14" width="10" height="2" rx="0.5" fill="#333" />
    {/* Plume */}
    <path d="M32 3 Q36 -2 34 3 Q38 0 36 5" fill="#DC143C" />
    {/* Eyes through visor */}
    <circle cx="29" cy="15" r="1" fill="#FFA500" />
    <circle cx="35" cy="15" r="1" fill="#FFA500" />
    {/* Sword */}
    <rect x="42" y="10" width="3" height="20" rx="1" fill="#C0C0C0" />
    <rect x="40" y="28" width="7" height="3" rx="1" fill="#B8860B" />
    {/* Shield arm */}
    <rect x="12" y="22" width="10" height="14" rx="3" fill="#4A6FA5" stroke="#2C4A7C" strokeWidth="1.5" />
    <line x1="17" y1="22" x2="17" y2="36" stroke="#FFD700" strokeWidth="1" />
    <line x1="12" y1="29" x2="22" y2="29" stroke="#FFD700" strokeWidth="1" />
    {/* Legs - armored */}
    <rect x="24" y="44" width="7" height="13" rx="2" fill="#708090" />
    <rect x="33" y="44" width="7" height="13" rx="2" fill="#708090" />
    {/* Boots */}
    <rect x="23" y="54" width="9" height="4" rx="2" fill="#556677" />
    <rect x="32" y="54" width="9" height="4" rx="2" fill="#556677" />
  </svg>
);

const Monster: React.FC<UnitSvgProps> = ({ size }) => (
  <svg viewBox="0 0 64 64" width={size} height={size}>
    {/* Body - large and hulking */}
    <ellipse cx="32" cy="32" rx="18" ry="16" fill="#5B8C3E" />
    {/* Head */}
    <circle cx="32" cy="14" r="12" fill="#6B9E4E" />
    {/* Horns */}
    <polygon points="22,8 18,0 24,6" fill="#8B7355" />
    <polygon points="42,8 46,0 40,6" fill="#8B7355" />
    {/* Eyes - menacing */}
    <ellipse cx="27" cy="13" rx="3" ry="2.5" fill="#FFD700" />
    <ellipse cx="37" cy="13" rx="3" ry="2.5" fill="#FFD700" />
    <circle cx="27" cy="13" r="1.5" fill="#8B0000" />
    <circle cx="37" cy="13" r="1.5" fill="#8B0000" />
    {/* Mouth */}
    <path d="M26 20 Q32 25 38 20" fill="none" stroke="#333" strokeWidth="1.5" />
    <polygon points="28,20 29,23 30,20" fill="#FFF" />
    <polygon points="34,20 35,23 36,20" fill="#FFF" />
    {/* Arms - beefy */}
    <ellipse cx="12" cy="30" rx="6" ry="8" fill="#5B8C3E" />
    <ellipse cx="52" cy="30" rx="6" ry="8" fill="#5B8C3E" />
    {/* Claws */}
    <line x1="8" y1="36" x2="6" y2="40" stroke="#333" strokeWidth="1.5" />
    <line x1="12" y1="37" x2="12" y2="41" stroke="#333" strokeWidth="1.5" />
    <line x1="48" y1="36" x2="46" y2="40" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="52" y1="37" x2="52" y2="41" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
    {/* Legs */}
    <rect x="22" y="46" width="8" height="12" rx="3" fill="#5B8C3E" />
    <rect x="34" y="46" width="8" height="12" rx="3" fill="#5B8C3E" />
    {/* Feet */}
    <ellipse cx="26" cy="58" rx="6" ry="3" fill="#4A7A32" />
    <ellipse cx="38" cy="58" rx="6" ry="3" fill="#4A7A32" />1
  </svg>
);

const Robot: React.FC<UnitSvgProps> = ({ size }) => (
  <svg viewBox="0 0 64 64" width={size} height={size}>
    {/* Antenna */}
    <line x1="32" y1="2" x2="32" y2="8" stroke="#A0A0A0" strokeWidth="2" />
    <circle cx="32" cy="2" r="2.5" fill="#FF4444" />
    {/* Head */}
    <rect x="22" y="8" width="20" height="14" rx="3" fill="#A8B8C8" stroke="#708090" strokeWidth="1" />
    {/* Eyes - screens */}
    <rect x="25" y="11" width="5" height="4" rx="1" fill="#00FF88" />
    <rect x="34" y="11" width="5" height="4" rx="1" fill="#00FF88" />
    {/* Mouth - speaker */}
    <rect x="27" y="17" width="10" height="3" rx="1" fill="#555" />
    <line x1="29" y1="17" x2="29" y2="20" stroke="#777" strokeWidth="0.5" />
    <line x1="32" y1="17" x2="32" y2="20" stroke="#777" strokeWidth="0.5" />
    <line x1="35" y1="17" x2="35" y2="20" stroke="#777" strokeWidth="0.5" />
    {/* Body */}
    <rect x="20" y="23" width="24" height="20" rx="3" fill="#B0C4D8" stroke="#708090" strokeWidth="1" />
    {/* Chest panel */}
    <rect x="26" y="27" width="12" height="8" rx="2" fill="#334455" />
    <circle cx="29" cy="31" r="1.5" fill="#FF4444" />
    <circle cx="35" cy="31" r="1.5" fill="#00FF88" />
    {/* Arms */}
    <rect x="10" y="24" width="10" height="5" rx="2" fill="#A8B8C8" />
    <rect x="44" y="24" width="10" height="5" rx="2" fill="#A8B8C8" />
    {/* Gun arm */}
    <rect x="48" y="29" width="4" height="8" rx="1" fill="#708090" />
    <rect x="49" y="37" width="2" height="3" fill="#555" />
    {/* Hand */}
    <rect x="10" y="29" width="5" height="6" rx="2" fill="#708090" />
    {/* Legs */}
    <rect x="22" y="43" width="8" height="12" rx="2" fill="#A8B8C8" />
    <rect x="34" y="43" width="8" height="12" rx="2" fill="#A8B8C8" />
    {/* Feet */}
    <rect x="20" y="54" width="12" height="4" rx="2" fill="#708090" />
    <rect x="32" y="54" width="12" height="4" rx="2" fill="#708090" />
  </svg>
);

const SVG_MAP: Record<SvgType, React.FC<UnitSvgProps>> = {
  swordsman: Swordsman,
  spearman: Spearman,
  knight: Knight,
  monster: Monster,
  robot: Robot,
};

export const UnitSvg: React.FC<{ svgType: SvgType; size: number }> = ({ svgType, size }) => {
  const Component = SVG_MAP[svgType];
  return <Component size={size} />;
};
