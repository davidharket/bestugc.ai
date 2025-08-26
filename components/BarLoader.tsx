import React from 'react'

interface BarLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMultipliers = {
  xs: 0.22,  // ~10px width
  sm: 0.5,   // 22.5px width
  md: 0.75,  // 33.75px width  
  lg: 1,     // 45px width (default)
  xl: 1.5    // 67.5px width
};

export default function BarLoader({ 
  size = 'lg', 
  className = '' 
}: BarLoaderProps) {
  const multiplier = sizeMultipliers[size];
  const width = 45 * multiplier;
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="loader" style={{ width: `${width}px` }}></div>
      
      <style jsx>{`
        .loader {
          aspect-ratio: .75;
          --c: no-repeat linear-gradient(#eb590c 0 0);
          background: 
            var(--c) 0%   100%,
            var(--c) 50%  100%,
            var(--c) 100% 100%;
          background-size: 20% 65%;
          animation: l8 1s infinite linear;
        }
        
        @keyframes l8 {
          0%     { background-position: 0% 100%, 50% 100%, 100% 100%; }
          16.67% { background-position: 0% 0%  , 50% 100%, 100% 100%; }
          33.33% { background-position: 0% 0%  , 50% 0%  , 100% 100%; }
          50%    { background-position: 0% 0%  , 50% 0%  , 100% 0%  ; }
          66.67% { background-position: 0% 100%, 50% 0%  , 100% 0%  ; }
          83.33% { background-position: 0% 100%, 50% 100%, 100% 0%  ; }
          100%   { background-position: 0% 100%, 50% 100%, 100% 100%; }
        }
      `}</style>
    </div>
  )
}