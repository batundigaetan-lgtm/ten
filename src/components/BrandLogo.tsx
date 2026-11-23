import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'symbol';
  theme?: 'dark' | 'light' | 'auto';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  theme = 'auto',
  size = 'md',
  className = '',
}) => {
  // Dimensions par taille
  const sizeMap = {
    sm: { symbol: 'w-7 h-7', text: 'text-base', sub: 'text-[9px]', gap: 'gap-2' },
    md: { symbol: 'w-9 h-9 sm:w-10 sm:h-10', text: 'text-lg sm:text-xl', sub: 'text-[10px] sm:text-[11px]', gap: 'gap-3' },
    lg: { symbol: 'w-12 h-12', text: 'text-2xl', sub: 'text-xs', gap: 'gap-3.5' },
    xl: { symbol: 'w-16 h-16', text: 'text-3xl', sub: 'text-sm', gap: 'gap-4' },
  };

  const currentSize = sizeMap[size];

  // Symbole vectoriel géométrique exclusif RentTech
  const SymbolSVG = (
    <div className={`relative ${currentSize.symbol} shrink-0 select-none group`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Dégradé principal de la forme */}
          <linearGradient id="rt-primary-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Lueur d'accentuation haute fidélité */}
          <linearGradient id="rt-accent-cyan" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          {/* Dégradé or ambre pour le point de rendement financier */}
          <linearGradient id="rt-amber-point" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Base carrée aux coins ultra-doux (squircle fintech) */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="26"
          fill="url(#rt-primary-grad)"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeOpacity="0.4"
        />

        {/* Grille interne subtile de connectivité matérielle */}
        <path
          d="M20 50H26M74 50H80M50 20V26M50 74V80"
          stroke="#93c5fd"
          strokeWidth="3"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />

        {/* Monogramme 'R' architectural & hardware interconnecté */}
        {/* Pilier vertical du R */}
        <rect
          x="28"
          y="28"
          width="11"
          height="44"
          rx="5.5"
          fill="#ffffff"
        />

        {/* Boucle supérieure du R connectée en micro-circuit */}
        <path
          d="M34 28H56C64.8366 28 72 34.268 72 42C72 49.732 64.8366 56 56 56H34"
          stroke="url(#rt-accent-cyan)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Jambe diagonale d'expansion du R */}
        <path
          d="M49 53L69 72"
          stroke="#ffffff"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Nœud d'impulsion technologique (Hardware + Rendement) */}
        <circle
          cx="69"
          cy="34"
          r="4.5"
          fill="url(#rt-amber-point)"
        />
      </svg>
    </div>
  );

  if (variant === 'symbol') {
    return <div className={`inline-flex items-center ${className}`}>{SymbolSVG}</div>;
  }

  // Déterminer la couleur du texte selon le thème
  const titleColor =
    theme === 'dark'
      ? 'text-white'
      : theme === 'light'
      ? 'text-slate-900'
      : 'text-slate-900 dark:text-white';

  const subtitleColor =
    theme === 'dark'
      ? 'text-slate-400'
      : theme === 'light'
      ? 'text-slate-500'
      : 'text-slate-500 dark:text-slate-400';

  return (
    <div className={`inline-flex items-center ${currentSize.gap} ${className}`}>
      {SymbolSVG}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-black ${currentSize.text} tracking-tight ${titleColor}`}>
            Rent<span className="text-blue-600 font-extrabold">Tech</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 border border-blue-500/20">
            Hub
          </span>
        </div>
        <span className={`font-semibold ${currentSize.sub} tracking-wide uppercase mt-1 ${subtitleColor}`}>
          Hardware & Investment RDC
        </span>
      </div>
    </div>
  );
};
