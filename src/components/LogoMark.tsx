interface LogoMarkProps {
  style?: 'aperture' | 'frame' | 'minimal'
  size?: number
}

export default function LogoMark({ style = 'aperture', size = 44 }: LogoMarkProps) {
  if (style === 'frame') {
    return (
      <svg width={size} height={Math.round(size * 0.72)} viewBox="0 0 44 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="42" height="30" rx="1" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4"/>
        <rect x="4" y="4" width="36" height="24" rx="0.5" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2"/>
        {[8, 16, 24, 32, 40].map(x => (
          <g key={x}>
            <rect x={x - 2} y="1.5" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.25"/>
            <rect x={x - 2} y="27.5" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.25"/>
          </g>
        ))}
        <text x="22" y="20" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontWeight="300" fontSize="12" fill="currentColor" letterSpacing="1">N</text>
      </svg>
    )
  }

  if (style === 'minimal') {
    return (
      <svg width={size * 0.7} height={size} viewBox="0 0 30 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 0 L0 0 L0 44 L4 44" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.3" fill="none"/>
        <path d="M26 0 L30 0 L30 44 L26 44" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.3" fill="none"/>
        <text x="15" y="34" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontWeight="300" fontSize="28" fill="currentColor" letterSpacing="0">N</text>
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="21" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.3"/>
      <circle cx="22" cy="22" r="16" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.15"/>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <line key={i} x1="22" y1="6" x2="22" y2="38"
          stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2"
          transform={`rotate(${i * 30} 22 22)`}
        />
      ))}
      <text x="22" y="28.5" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontWeight="300" fontSize="19" fill="currentColor" letterSpacing="0">N</text>
    </svg>
  )
}
