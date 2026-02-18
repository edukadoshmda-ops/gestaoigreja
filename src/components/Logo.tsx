import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

// Logo em public/logo-app.png (evita cache vazio)
const LOGO_SRC = '/logo-app.png?v=2';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

// Tamanhos da logo (reduzidos 20% + 10% + 10%)
const sizeStyles: Record<string, { width: string; height: string }> = {
  sm: { width: '7.01rem', height: '7.01rem' },
  md: { width: '12.27rem', height: '12.27rem' },
  lg: { width: '21.02rem', height: '21.02rem' },
  xl: { width: '33.29rem', height: '33.29rem' },
};

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { currentTheme } = useTheme();
  const logoColor = currentTheme?.primaryHex || '#F97316';

  const textSizeClasses = {
    sm: 'text-[1.38rem] md:text-[1.24rem]',
    md: 'text-[1.65rem]',
    lg: 'text-[2.48rem]',
    xl: 'text-[4.13rem]',
  };

  return (
    <div className={cn(
      "flex items-center",
      size === 'lg' ? "flex-col text-center gap-4" : "flex-row gap-3"
    )}>
      <div
        className="flex items-center justify-center rounded-xl transition-all duration-500 z-10 overflow-hidden"
        style={{ ...sizeStyles[size] }}
      >
        <div
          className="w-full h-full relative"
          style={{
            backgroundColor: logoColor,
            WebkitMaskImage: `url(${LOGO_SRC})`,
            maskImage: `url(${LOGO_SRC})`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            transition: 'background-color 0.5s ease',
            minHeight: '100%',
            minWidth: '100%',
          }}
          title="Gestão Igreja"
        >
          <img
            src={LOGO_SRC}
            alt="Gestão Igreja"
            className="w-full h-full object-contain opacity-0 pointer-events-none"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col gap-0.5">
          <div 
            className={cn(
              "font-black tracking-tight leading-none flex items-center gap-1.5",
              textSizeClasses[size]
            )}
            style={{ color: logoColor, transition: 'color 0.5s ease' }}
          >
            <span>Gestão</span>
            <span>Igreja</span>
          </div>
          {size === 'lg' && (
            <span className="text-xs tracking-widest font-bold text-muted-foreground mt-1 uppercase">
              Gestão de Excelência
            </span>
          )}
        </div>
      )}
    </div>
  );
}
