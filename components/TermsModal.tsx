
import React, { useState, useRef, UIEvent } from 'react';

interface TermsModalProps {
  onAccept: () => void;
}

const TermsAndConditionsText: React.FC = () => (
    <div className="text-left text-[11px] text-zinc-400 space-y-6 font-medium leading-relaxed">
        <div className="space-y-4">
            <p className="text-zinc-200 font-bold uppercase tracking-widest border-l-2 border-violet-500 pl-4">
                TÉRMINOS Y CONDICIONES - SPACE TOWN CLUB
            </p>
            <p>
                declara haber leído, comprendido y aceptado íntegramente los siguientes Términos y Condiciones.
                La aceptación se entenderá equivalente a firma electrónica conforme a la Ley 527 de 1999 y normas concordantes.
            </p>
        </div>
        
        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">1. Objeto</h3>
            <p>
                Los presentes Términos y Condiciones regulan:<br/>
                a) La autorización para el ingreso del Artista al estudio del Sello;<br/>
                b) La fijación de interpretaciones y/o ejecuciones artísticas;<br/>
                c) La cesión y/o autorización de derechos patrimoniales que correspondan sobre las obras y fonogramas resultantes;<br/>
                d) La titularidad de los fonogramas grabados; y<br/>
                e) El uso y tratamiento de datos necesarios para la gestión contractual.
            </p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">2. Declaraciones del Artista</h3>
            <p>
                El Artista declara que:<br/>
                1. Es mayor de edad o actúa con autorización de su representante legal.<br/>
                2. Es titular o cuenta con las autorizaciones necesarias sobre las interpretaciones u obras que ejecute.<br/>
                3. No infringirá derechos de terceros durante la sesión.<br/>
                4. La aceptación en la aplicación constituye su consentimiento previo, expreso e informado.
            </p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">3. Autorización para la fijación de interpretaciones en fonogramas</h3>
            <p>
                El Artista autoriza expresa y previamente, conforme a los artículos 166 y 168 de la Ley 23 de 1982 y demás normas aplicables, la fijación, grabación y registro de sus interpretaciones, voces, ejecuciones e intervenciones realizadas dentro del estudio del Sello.
                Esta autorización comprende todas las tomas, demos, grabaciones parciales o completas, incluyendo aquellas no publicadas o descartadas.
            </p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">4. Cesión de derechos patrimoniales (si aplica)</h3>
            <p>
                Cuando el Artista sea autor o coautor de la obra que se grave, mediante la aceptación del presente documento cede a favor del Sello, de manera exclusiva, los derechos patrimoniales necesarios para la reproducción, distribución, comunicación pública, puesta a disposición y transformación del material grabado según lo pactado previamente en su contrato principal o, en defecto de contrato, bajo las condiciones que se establecen en este documento.
                La cesión se otorga para:<br/>
                • Territorio: Mundial.<br/>
                • Duración: Por el término de protección legal vigente.<br/>
                • Modalidades de explotación: Todas las existentes y por existir, incluyendo plataformas digitales, sincronización, comunicación digital, compilaciones y otros usos comerciales.
            </p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">5. Titularidad del Fonograma</h3>
            <p>
                Todos los fonogramas producidos en el estudio del Sello serán propiedad exclusiva del Sello como Productor Fonográfico, conforme a los artículos 129 y 130 de la Ley 23 de 1982 y decisiones andinas aplicables.
                El Sello tendrá la potestad exclusiva para:<br/>
                • Decidir la publicación o no del fonograma;<br/>
                • Realizar mezclas, remasterizaciones o ediciones;<br/>
                • Explotar comercialmente el fonograma en cualquier medio;<br/>
                • Otorgar licencias a terceros;<br/>
                • Determinar la baja, agotamiento, reemplazo o modificación del fonograma.
                El Artista conservará únicamente los derechos morales que le sean legalmente reconocidos (nombre, integridad, etc.).
            </p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">6. Autorización de uso de imagen, nombre y voz</h3>
            <p>
                El Artista autoriza al Sello para utilizar su nombre artístico, imagen, fotografía, voz, firmas, biografía y elementos de marca personal con fines promocionales, comerciales y de explotación del fonograma, sin limitación territorial ni temporal mientras el fonograma esté disponible.
            </p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">7. Contraprestaciones</h3>
            <p>
                Las contraprestaciones aplicables (royalties, anticipos, pagos por sesión, participación porcentual u otros acuerdos) se regirán por el contrato principal firmado entre el Artista y el Sello.
                En caso de no existir contrato previo, el Sello podrá definir la política aplicable en cada proyecto.
            </p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">8. Responsabilidad por contenidos</h3>
            <p>
                El Artista será responsable por el contenido que interprete o suministre, garantizando que dicho contenido no vulnera derechos de autor, derechos de terceros, normas de protección al menor, ni constituye contenido ilícito.
                El Sello podrá rechazar o suspender la sesión si detecta infracción o riesgo jurídico.
            </p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">9. Protección de datos personales</h3>
            <p>
                El tratamiento de datos se realizará conforme a la Ley 1581 de 2012.
                El Artista autoriza al Sello para recolectar, almacenar y tratar sus datos con el fin de:<br/>
                • Gestionar las sesiones de estudio;<br/>
                • Administrar derechos y regalías;<br/>
                • Realizar procesos contractuales;<br/>
                • Ejecutar estrategias de marketing y difusión de la música.
                El Artista podrá ejercer los derechos de consulta, rectificación y supresión mediante correo a: appspacetown@gmail.com.
            </p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">10. Consentimiento y firma electrónica</h3>
            <p>
                La aceptación de estos términos mediante la aplicación constituye una manifestación válida de voluntad, equivalente a una firma electrónica o digital según la Ley 527 de 1999 y la jurisprudencia aplicable.
            </p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">11. Confidencialidad</h3>
            <p>
                El Artista se obliga a mantener reserva sobre música inédita, producciones en proceso, información técnica, estrategias de lanzamiento y demás material confidencial del Sello o de otros artistas.
            </p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">12. Modificaciones</h3>
            <p>
                El Sello podrá actualizar estos términos en cualquier momento.
                Las nuevas condiciones aplicarán desde su publicación en la aplicación.
            </p>
        </div>

        <div className="space-y-2">
            <h3 className="font-black text-white uppercase tracking-wider text-[10px]">13. Ley aplicable y jurisdicción</h3>
            <p>
                El presente documento se rige por las leyes de la República de Colombia.
                Cualquier controversia será resuelta ante los jueces de la República o mediante los mecanismos alternos pactados en el contrato principal.
            </p>
        </div>

        <div className="p-4 bg-violet-900/10 border border-violet-500/20 rounded-lg italic text-center text-[9px]">
            "PROTECTING THE ART, RECORDING THE VIBE"
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
          Términos y Condiciones
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
            {isScrolledToEnd ? "Aceptar Términos" : "Lea hasta el final para aceptar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
