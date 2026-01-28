
import React, { useState, useRef, UIEvent } from 'react';

interface TermsModalProps {
  onAccept: () => void;
}

const TermsAndConditionsText: React.FC = () => (
    <div className="text-left text-[11px] text-zinc-400 space-y-6 font-medium leading-relaxed">
        <div className="space-y-4">
            <p className="text-zinc-200 font-bold uppercase tracking-widest border-l-2 border-violet-500 pl-4">
                TÉRMINOS Y CONDICIONES GENERALES - SPACE TOWN
            </p>
            <p>
                El Artista declara haber leído, comprendido y aceptado íntegramente los siguientes Términos y Condiciones. 
                La aceptación se entenderá equivalente a firma electrónica conforme a la Ley 527 de 1999 y normas concordantes.
            </p>
        </div>
        
        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">01. OBJETO</h3>
            <p>Los presentes Términos y Condiciones regulan:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>La autorización para el ingreso del Artista al estudio del Sello;</li>
                <li>La fijación de interpretaciones y/o ejecuciones artísticas;</li>
                <li>La cesión y/o autorización de derechos patrimoniales que correspondan sobre las obras y fonogramas resultantes;</li>
                <li>La titularidad de los fonogramas grabados; y</li>
                <li>El uso y tratamiento de datos necesarios para la gestión contractual.</li>
            </ul>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">02. DECLARACIONES DEL ARTISTA</h3>
            <p>El Artista declara que:</p>
            <ol className="list-decimal pl-5 space-y-1">
                <li>Es mayor de edad o actúa con autorización de su representante legal.</li>
                <li>Es titular o cuenta con las autorizaciones necesarias sobre las interpretaciones u obras que ejecute.</li>
                <li>No infringirá derechos de terceros durante la sesión.</li>
                <li>La aceptación en la aplicación constituye su consentimiento previo, expreso e informado.</li>
            </ol>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">03. AUTORIZACIÓN PARA LA FIJACIÓN</h3>
            <p>El Artista autoriza expresa y previamente, conforme a los artículos 166 y 168 de la Ley 23 de 1982 y demás normas aplicables, la fijación, grabación y registro de sus interpretaciones, voces, ejecuciones e intervenciones realizadas dentro del estudio del Sello.</p>
            <p>Esta autorización comprende todas las tomas, demos, grabaciones parciales o completas, incluyendo aquellas no publicadas o descartadas.</p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">04. CESIÓN DE DERECHOS PATRIMONIALES</h3>
            <p>Cuando el Artista sea autor o coautor de la obra que se grave, mediante la aceptación del presente documento cede a favor del Sello, de manera exclusiva, los derechos patrimoniales necesarios para la reproducción, distribución, comunicación pública, puesta a disposición y transformación del material grabado.</p>
            <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-[10px]">
                <p>• Territorio: Mundial.</p>
                <p>• Duración: Por el término de protección legal vigente.</p>
                <p>• Modalidades de explotación: Todas las existentes y por existir.</p>
            </div>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">05. TITULARIDAD DEL FONOGRAMA</h3>
            <p>Todos los fonogramas producidos en el estudio del Sello serán propiedad exclusiva del Sello como Productor Fonográfico, conforme a los artículos 129 y 130 de la Ley 23 de 1982.</p>
            <p>El Sello tendrá la potestad exclusiva para decidir la publicación, realizar mezclas, explotar comercialmente u otorgar licencias a terceros. El Artista conservará únicamente los derechos morales legalmente reconocidos.</p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">06. USO DE IMAGEN Y VOZ</h3>
            <p>El Artista autoriza al Sello para utilizar su nombre artístico, imagen, fotografía, voz, firmas, biografía y elementos de marca personal con fines promocionales, comerciales y de explotación del fonograma, sin limitación territorial ni temporal.</p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">07. CONTRAPRESTACIONES</h3>
            <p>Las contraprestaciones aplicables (royalties, anticipos, pagos por sesión) se regirán por el contrato principal firmado entre el Artista y el Sello. En caso de no existir contrato previo, el Sello podrá definir la política aplicable en cada proyecto.</p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">08. RESPONSABILIDAD POR CONTENIDOS</h3>
            <p>El Artista será responsable por el contenido que interprete o suministre, garantizando que dicho contenido no vulnera derechos de autor, derechos de terceros, normas de protección al menor, ni constituye contenido ilícito.</p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">09. PROTECCIÓN DE DATOS PERSONALES</h3>
            <p>El tratamiento de datos se realizará conforme a la Ley 1581 de 2012. El Artista autoriza al Sello para recolectar, almacenar y tratar sus datos para gestionar sesiones, administrar regalías y ejecutar estrategias de marketing.</p>
            <p className="italic">El Artista podrá ejercer sus derechos mediante correo a: appspacetown@gmail.com</p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">10. CONSENTIMIENTO ELECTRÓNICO</h3>
            <p>La aceptación de estos términos mediante la aplicación constituye una manifestación válida de voluntad, equivalente a una firma electrónica o digital según la Ley 527 de 1999.</p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">11. CONFIDENCIALIDAD</h3>
            <p>El Artista se obliga a mantener reserva sobre música inédita, producciones en proceso, información técnica, estrategias de lanzamiento y demás material confidencial del Sello o de otros artistas.</p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">12. MODIFICACIONES</h3>
            <p>El Sello podrá actualizar estos términos en cualquier momento. Las nuevas condiciones aplicarán desde su publicación en la aplicación.</p>
        </div>

        <div className="space-y-2 pb-4">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">13. LEY APLICABLE Y JURISDICCIÓN</h3>
            <p>El presente documento se rige por las leyes de la República de Colombia. Cualquier controversia será resuelta ante los jueces de la República o mediante los mecanismos alternos pactados en el contrato principal.</p>
        </div>

        <div className="p-4 bg-violet-900/10 border border-violet-500/20 rounded-lg italic text-center">
            "PROTOCOL VALIDATED BY SPACE TOWN SECURITY SYSTEMS"
        </div>
    </div>
);

const TermsModal: React.FC<TermsModalProps> = ({ onAccept }) => {
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    // Un pequeño margen de 15px para facilitar la validación en móviles
    if (scrollTop + clientHeight >= scrollHeight - 15) {
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
            {isScrolledToEnd ? "Aceptar Protocolo" : "Desliza para validar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
