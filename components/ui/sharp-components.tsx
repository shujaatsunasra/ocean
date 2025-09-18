'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// Sharp Button Component
interface SharpButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function SharpButton({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: SharpButtonProps) {
  const baseClasses = 'sharp-button font-medium transition-all duration-200 ease-sharp relative overflow-hidden';
  
  const variants = {
    primary: 'bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-sharp',
    secondary: 'bg-black/80 hover:bg-black/90 text-white border border-white/20 shadow-sharp',
    ghost: 'bg-transparent hover:bg-white/5 text-white/60 hover:text-white border border-white/10 hover:border-white/20',
    danger: 'bg-red-600 hover:bg-red-500 text-white border border-red-700/50 shadow-sharp'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

// Sharp Card Component
interface SharpCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'solid';
  children: React.ReactNode;
}

export function SharpCard({ variant = 'default', className, children, ...props }: SharpCardProps) {
  const baseClasses = 'sharp-card transition-all duration-300 ease-sharp';
  
  const variants = {
    default: 'bg-black/50 border border-white/20 shadow-sharp-lg',
    glass: 'sharp-glass',
    solid: 'bg-black/80 border border-white/30 shadow-sharp-xl'
  };
  
  return (
    <div className={cn(baseClasses, variants[variant], className)} {...props}>
      {children}
    </div>
  );
}

// Sharp Input Component
interface SharpInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function SharpInput({ label, error, className, ...props }: SharpInputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-krub font-medium text-white">
          {label}
        </label>
      )}
      <input
        className={cn('sharp-input w-full', error && 'border-red-500 focus:border-red-400', className)}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

// Sharp Modal Component
interface SharpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function SharpModal({ isOpen, onClose, title, children, className }: SharpModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn('sharp-modal relative max-w-lg w-full mx-4 p-6', className)}>
        {title && (
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/20">
            <h3 className="text-lg font-raleway font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 text-white/60 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// Sharp Navigation Component
interface SharpNavProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function SharpNav({ className, children, ...props }: SharpNavProps) {
  return (
    <nav className={cn('sharp-nav', className)} {...props}>
      {children}
    </nav>
  );
}

// Sharp Tooltip Component
interface SharpTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function SharpTooltip({ content, children, position = 'top' }: SharpTooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  
  const positions = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={cn('absolute z-50 sharp-tooltip whitespace-nowrap', positions[position])}>
          {content}
        </div>
      )}
    </div>
  );
}

// Sharp Avatar Component
interface SharpAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
}

export function SharpAvatar({ src, alt, size = 'md', fallback, className, ...props }: SharpAvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };
  
  return (
    <div className={cn('sharp-avatar flex items-center justify-center', sizes[size], className)} {...props}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="font-medium text-white">
          {fallback || alt?.charAt(0)?.toUpperCase() || '?'}
        </span>
      )}
    </div>
  );
}

// Sharp Badge Component
interface SharpBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

export function SharpBadge({ variant = 'default', className, children, ...props }: SharpBadgeProps) {
  const variants = {
    default: 'bg-white/10 text-white border-white/20',
    success: 'bg-white/10 text-white border-white/20',
    warning: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30',
    error: 'bg-red-600/20 text-red-300 border-red-600/30',
    info: 'bg-white/10 text-white border-white/20'
  };
  
  return (
    <span 
      className={cn('inline-flex items-center px-2 py-1 text-xs font-medium border', variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}

// Sharp Progress Component
interface SharpProgressProps {
  value: number;
  max?: number;
  className?: string;
  showValue?: boolean;
}

export function SharpProgress({ value, max = 100, className, showValue = false }: SharpProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-1">
        {showValue && (
          <span className="text-xs font-medium text-white">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      <div className="w-full bg-black/80 border border-white/20 h-2">
        <div 
          className="h-full bg-gradient-to-r from-white/30 to-white/50 transition-all duration-300 ease-sharp"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Sharp Toggle Component
interface SharpToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function SharpToggle({ checked, onChange, label, disabled = false }: SharpToggleProps) {
  return (
    <label className="flex items-center space-x-3 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={cn(
          'w-11 h-6 border-2 transition-all duration-200 ease-sharp',
          checked ? 'bg-white/20 border-white/30' : 'bg-black/50 border-white/20',
          disabled && 'opacity-50 cursor-not-allowed'
        )}>
          <div className={cn(
            'w-4 h-4 bg-white transition-all duration-200 ease-sharp transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )} />
        </div>
      </div>
      {label && (
        <span className={cn('text-sm font-medium', disabled ? 'text-white/40' : 'text-white')}>
          {label}
        </span>
      )}
    </label>
  );
}