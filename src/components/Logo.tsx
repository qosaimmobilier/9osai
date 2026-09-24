import type { ReactNode } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showSubtitle = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 'h-8 w-8', title: 'text-lg', subtitle: 'text-xs' },
    md: { icon: 'h-10 w-10', title: 'text-xl', subtitle: 'text-sm' },
    lg: { icon: 'h-14 w-14', title: 'text-3xl', subtitle: 'text-base' },
  };
  const s = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${s.icon} rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-md shrink-0`}>
        <svg viewBox="0 0 24 24" fill="none" className="w-2/3 h-2/3" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <div>
        <div className={`${s.title} font-bold text-gray-900 leading-tight`}>قصي للعقار</div>
        {showSubtitle && <div className={`${s.subtitle} text-primary-600 font-medium`}>قصر البخاري</div>}
      </div>
    </div>
  );
}
