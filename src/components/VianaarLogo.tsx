import React from 'react';

export const VianaarLogo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-4 ${className}`}>
    <svg 
      viewBox="0 0 120 120" 
      className="w-12 h-12 flex-shrink-0" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10 20 L55 100" stroke="white" strokeWidth="6" strokeLinecap="round" />
      <path d="M25 20 L60 85" stroke="white" strokeWidth="5" strokeLinecap="round" />
      <path d="M40 20 L65 70" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <path d="M55 20 L70 55" stroke="white" strokeWidth="3" strokeLinecap="round" />
      
      <path d="M100 20 L55 100" stroke="white" strokeWidth="6" strokeLinecap="round" />
      <path d="M85 20 L50 85" stroke="white" strokeWidth="5" strokeLinecap="round" />
      <path d="M70 20 L45 70" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <path d="M55 20 L40 55" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
    <span className="text-white font-sans font-black text-3xl tracking-[0.15em] uppercase">
      Vianaar
    </span>
  </div>
);
