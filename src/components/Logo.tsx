import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';
import { useTheme } from '@/contexts/ThemeContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  let currentTheme;
  try {
    const themeContext = useTheme();
    currentTheme = themeContext?.currentTheme;
  } catch (e) {
    console.error('Logo: Error getting theme!', e);
  }

  const safeTheme = currentTheme || { id: 'default', hueShift: '0deg' };
  console.log('Logo: rendering', { size, theme: safeTheme.id });

  const sizeClasses = {
    sm: 'h-14 w-14',
    md: 'h-28 w-28',
    lg: 'h-48 w-48',
    xl: 'h-76 w-76',
  };

  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
  };

  return (
    <div className={cn(
      "flex items-center",
      size === 'lg' ? "flex-col text-center gap-4" : "flex-row gap-3"
    )}>
      {/* Logo Image - Nítida e 20% maior */}
      <div className="relative group flex items-center justify-center">
        <img
          src={logoImage}
          alt="Church App Logo"
          className={cn(
            sizeClasses[size],
            "object-contain transition-all duration-500 z-10"
          )}
          style={{
            filter: safeTheme.id === 'soberania-preto'
              ? 'grayscale(1) brightness(0)'
              : `hue-rotate(${safeTheme.hueShift || '0deg'}) brightness(1)`
          }}
        />
      </div>

      {showText && (
        <div className="flex flex-col gap-0.5">
          <div className={cn(
            "font-black tracking-tight leading-none flex items-center gap-1.5 text-primary",
            textSizeClasses[size]
          )}>
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
