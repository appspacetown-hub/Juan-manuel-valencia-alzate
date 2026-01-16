
import React from 'react';

interface ProcessingOverlayProps {
  step: string;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ step }) => {
  return (
    <div className="fixed inset-0 bg-black/95 z-[500] flex flex-col items-center justify-center p-8 backdrop-blur-2xl">
      {/* Laser Scan Effect */}
      <div className="absolute top-0 left-0 w-full h-1 bg-violet-500/50 shadow-[0_0_20px_#8b5cf6] animate-scan-laser z-10"></div>
      
      <div className="w-full max-w-sm relative">
        <div className="mb-16 flex justify-center">
          <div className="w-32 h-32 relative">
            <div className="absolute inset-0 border-4 border-t-violet-600 border-r-transparent border-b-violet-900 border-l-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 border-2 border-t-cyan-400 border-r-transparent border-b-cyan-900 border-l-transparent rounded-full animate-spin-reverse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_20px_white] animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <h3 className="text-white text-[10px] font-black uppercase tracking-[0.6em] text-center mb-8 font-orbitron neon-text">
          {step}
        </h3>
        
        <div className="w-full h-[2px] bg-zinc-900 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-transparent via-violet-500 to-transparent w-full animate-progress-glow"></div>
        </div>
        
        <div className="mt-10 flex justify-center space-x-2">
           {[...Array(3)].map((_, i) => (
             <div key={i} className="w-1 h-1 bg-violet-500 rounded-full animate-bounce" style={{animationDelay: `${i * 0.2}s`}}></div>
           ))}
        </div>
      </div>
      
      <style>{`
        @keyframes scan-laser {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan-laser {
          animation: scan-laser 3s linear infinite;
        }
        @keyframes progress-glow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-progress-glow {
          animation: progress-glow 1.5s infinite linear;
        }
        .animate-spin-reverse {
          animation: spin 1s linear infinite reverse;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProcessingOverlay;
