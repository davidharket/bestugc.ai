import React from 'react'

interface SimpleLoaderProps {
  fadeOut?: boolean
  onFadeComplete?: () => void
  width?: number
}

export default function SimpleLoader({ 
  fadeOut = false,
  onFadeComplete,
  width = 45
}: SimpleLoaderProps) {
  
  React.useEffect(() => {
    if (fadeOut && onFadeComplete) {
      const timer = setTimeout(() => {
        onFadeComplete()
      }, 1000) // 1 second fade out
      
      return () => clearTimeout(timer)
    }
  }, [fadeOut, onFadeComplete])

  return (
    <div 
      className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="loader"></div>
      
      <style jsx>{`
        .loader {
          width: ${width}px;
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