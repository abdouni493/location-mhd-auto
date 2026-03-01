
import React from 'react';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const GradientButton: React.FC<GradientButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`
        relative overflow-hidden px-6 py-2.5 rounded-xl font-bold text-white shadow-lg 
        transition-all duration-700 ease-in-out transform active:scale-95
        bg-gradient-to-r from-blue-600 to-red-600
        disabled:opacity-50 disabled:cursor-not-allowed
        group
        ${className}
      `}
      {...props}
    >
      {/* 
        This pseudo-element creates the Blue -> Red -> Yellow gradient.
        By transitioning opacity, we get a perfectly smooth blend from the base Blue -> Red
      */}
      <span className="
        absolute inset-0 
        bg-gradient-to-r from-blue-600 via-red-600 to-yellow-400 
        opacity-0 group-hover:opacity-100 
        transition-opacity duration-700 ease-in-out
      "></span>
      
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};

export default GradientButton;
