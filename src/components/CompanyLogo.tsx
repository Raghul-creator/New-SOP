import React from 'react';

interface CompanyLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'color';
  height?: number | string;
  width?: number | string;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  className = '',
  variant = 'dark',
  height = 40,
  width = 'auto'
}) => {
  // Use the local logo files saved under /assets/ as requested
  const src = variant === 'light' ? '/assets/logo-white.svg' : '/assets/logo.svg';
  
  return (
    <img 
      src={src}
      alt="Future Focus Infotech Logo"
      style={{ height, width: width === 'auto' ? undefined : width }}
      className={className}
      referrerPolicy="no-referrer"
    />
  );
};
