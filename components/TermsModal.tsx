
import React, { useState, useRef, UIEvent } from 'react';

interface TermsModalProps {
  onAccept: () => void;
}

const TermsAndConditionsText: React.FC = () => (
    <div className="text-left text-[11px] text-zinc-400 space-y-6 font-medium leading-relaxed">
        <div className="space-y-4">
            <p className="text-zinc-200 font-bold uppercase tracking-widest border-l-2 border-violet-500 pl-4">
                REGLAMENTO INTERNO Y TÉRMINOS VIP - SPACE TOWN CLUB
            </p>
            <p>
                Al ingresar a nuestras instalaciones, el Invitado acepta cumplir con el reglamento de seguridad y convivencia. 
                Este registro es obligatorio para garantizar un ambiente seguro para todos nuestros miembros.
            </p>
        </div>
        
        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">01. DERECHO DE ADMISIÓN</h3>
            <p>El establecimiento se reserva el derecho de admisión y permanencia conforme a las leyes vigentes y protocolos internos de seguridad.</p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">02. REGISTRO FOTOGRÁFICO</h3>
            <p>El Invitado autoriza la captura de su imagen facial exclusivamente para fines de identificación y control de acceso. Estos datos son tratados bajo la Ley 1581 de 2012.</p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">03. RESPONSABILIDAD PERSONAL</h3>
            <p>El Invitado es responsable de su comportamiento y del consumo moderado. El club no se hace responsable por la pérdida de objetos personales no dejados en el guardarropa oficial.</p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">04. POLÍTICA DE SALIDA</h3>
            <p>Para un control efectivo, se solicita al Invitado reportar su salida a través de este sistema. Esto permite liberar su cupo VIP y finalizar el registro de permanencia de forma legal.</p>
        </div>

        <div className="p-4 bg-violet-900/10 border border-violet-500/20 rounded-lg italic text-center text-[9px]">
            "PROTECTING THE NIGHT, ENJOYING THE VIBE"
        </div>
    </div>
);

const TermsModal: React.FC<TermsModalProps> = ({ onAccept }) => {
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setIsScrolledToEnd(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[600] p-4 backdrop-blur-xl">
      <div className="bg-zinc-950 border border-zinc-800 p-8 sm:p-12 rounded-[2.5rem] shadow-[0_0_100px_rgba(139,92,246,0.15)] w-full max-w-xl text-center flex flex-col" style={{maxHeight: '85vh'}}>
        <h2 className="text-2xl font-black text-white mb-8 font-orbitron tracking-tighter uppercase neon-text">
          Protocolo de Acceso
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
            {isScrolledToEnd ? "Aceptar Términos VIP" : "Lea hasta el final para aceptar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
