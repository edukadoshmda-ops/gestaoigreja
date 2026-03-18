import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const LOGO_SRC = '/logo-app.png';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

// Tamanhos da logo (+30% em relação ao original)
const sizeStyles: Record<string, { width: string; height: string }> = {
  xs: { width: '2.6rem', height: '2.6rem' },
  sm: { width: '9.11rem', height: '9.11rem' },
  md: { width: '15.95rem', height: '15.95rem' },
  lg: { width: '27.33rem', height: '27.33rem' },
  xl: { width: '43.28rem', height: '43.28rem' },
};

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const { currentTheme } = useTheme();
  const primaryColor = currentTheme?.primaryHex || '#2563EB';
  const textSizeClasses = {
    xs: 'text-[1.04rem]',
    sm: 'text-[1.79rem] md:text-[1.61rem]',
    md: 'text-[2.15rem]',
    lg: 'text-[3.22rem]',
    xl: 'text-[5.37rem]',
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
            backgroundColor: primaryColor,
            WebkitMaskImage: `url(${LOGO_SRC})`,
            maskImage: `url(${LOGO_SRC})`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
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
            style={{ color: primaryColor }}
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
