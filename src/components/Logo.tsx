import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-24 w-24',
    lg: 'h-40 w-40',
    xl: 'h-64 w-64',
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
      {/* Logo Image - Exact as provided */}
      <img
        src={logoImage}
        alt="Church App Logo"
        className={cn(sizeClasses[size], "drop-shadow-2xl object-contain")}
      />

      {showText && (
        <div className="flex flex-col gap-0.5">
          <div className={cn(
            "font-black tracking-tight leading-none flex items-center gap-1.5",
            textSizeClasses[size]
          )}>
            <span className="text-slate-900 dark:text-white">Gestão</span>
            <span className="text-primary">Igreja</span>
          </div>
          {size === 'lg' && (
            <span className="text-xs tracking-widest font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase">
              Sistema Premium de Gestão
            </span>
          )}
        </div>
      )}
    </div>
  );
}
