
import React, { useState, useRef, UIEvent } from 'react';

interface TermsModalProps {
  onAccept: () => void;
}

const TermsAndConditionsText: React.FC = () => (
    <div className="text-left text-[11px] text-zinc-400 space-y-6 font-medium leading-relaxed">
        <p className="text-zinc-200 font-bold uppercase tracking-widest border-l-2 border-violet-500 pl-4">Protocolo de Seguridad y Cesión de Derechos Space Town v2.4</p>
        
        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">01. Reconocimiento de Terminal</h3>
            <p>Al acceder a esta terminal, el Artista acepta que su identidad será verificada biométricamente y sus datos serán encriptados bajo protocolos de seguridad privada.</p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">02. Cesión de Captura</h3>
            <p>El artista autoriza la fijación de su imagen y voz en los sistemas del sello para fines de promoción, seguridad y explotación comercial de los fonogramas resultantes de la sesión.</p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">03. Validez Digital</h3>
            <p>La firma realizada en este panel táctil tiene plena validez legal conforme a la Ley 527 de 1999 (Colombia) y normativas internacionales de firma electrónica.</p>
        </div>

        <div className="p-4 bg-violet-900/10 border border-violet-500/20 rounded-lg italic">
            "Space Town no se hace responsable por material no registrado correctamente antes de la salida de las instalaciones."
        </div>
    </div>
);

const TermsModal: React.FC<TermsModalProps> = ({ onAccept }) => {
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setIsScrolledToEnd(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[600] p-4 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 p-8 sm:p-12 rounded-[2.5rem] shadow-[0_0_100px_rgba(139,92,246,0.1)] w-full max-w-xl text-center flex flex-col" style={{maxHeight: '85vh'}}>
        <h2 className="text-2xl font-black text-white mb-8 font-orbitron tracking-tighter uppercase neon-text">
          Security Protocol
        </h2>
        
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="overflow-y-auto pr-6 mb-10 flex-grow custom-scrollbar"
        >
          <TermsAndConditionsText />
        </div>

        <div className="flex-shrink-0 pt-6 border-t border-zinc-900">
          <button 
            onClick={onAccept} 
            disabled={!isScrolledToEnd}
            className="group relative w-full py-5 text-black font-black bg-white rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-[0.2em] text-xs"
          >
            {isScrolledToEnd ? "Accept Protocol" : "Scroll to Validate"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
