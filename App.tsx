
import React, { useState, useRef, useEffect } from 'react';
import { DocumentType } from './types';
import SignaturePad, { SignaturePadRef } from './components/SignaturePad';
import CameraModal from './components/CameraModal';
import ParticleBackground from './components/ParticleBackground';
import TermsModal from './components/TermsModal';
import ProcessingOverlay from './components/ProcessingOverlay';
import { jsPDF } from 'jspdf';

// === CONFIGURACIÓN DE ACCESO ===
const APP_CONFIG = {
  RECIPIENT_EMAIL: "appspacetown@gmail.com", 
  EMAILJS: {
    SERVICE_ID: "service_n97bgi4",     
    PUBLIC_KEY: "HHnp6ci-SEnxKhFPA", 
    TEMPLATE_ID: "template_tod2pkl", // Inicio
    TEMPLATE_ID_END: "template_tod2pkl" // Finalización
  }
};

// Logo Space Town Corregido (PNG Base64 Válido)
const LOGO_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAACXBIWXMAAAsTAAALEwEAmpwYAAABNklEQVR4nO3b0Q3CMAxEUbNhAzYIBmCCZuAGYIBgACZgAmAAJmACZgAmYAFmAAbIAoRHSUoUfVfS70uVInKINff8XpIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSRL37AsN2D9p6x/xVAAAAABJRU5ErkJggg==";

const TERMS_CONTENT = [
  "1. OBJETO: Los presentes Términos y Condiciones regulan el ingreso del Artista al estudio del Sello, la fijación de interpretaciones artísticas, la cesión de derechos patrimoniales y la titularidad de fonogramas.",
  "2. DECLARACIONES DEL ARTISTA: El Artista declara ser mayor de edad o actuar con autorización legal, ser titular de sus obras y no infringir derechos de terceros.",
  "3. AUTORIZACIÓN PARA LA FIJACIÓN: El Artista autoriza la grabación de sus interpretaciones y voces dentro del estudio conforme a la Ley 23 de 1982.",
  "4. CESIÓN DE DERECHOS PATRIMONIALES: El Artista cede al Sello, de manera exclusiva y mundial, los derechos de reproducción, distribución y comunicación pública de las obras grabadas por el término de protección legal.",
  "5. TITULARIDAD DEL FONOGRAMA: Todos los fonogramas producidos serán propiedad exclusiva del Sello como Productor Fonográfico.",
  "6. USO DE IMAGEN Y VOZ: Autorización para utilizar nombre artístico, imagen y voz con fines promocionales y comerciales.",
  "7. CONTRAPRESTACIONES: Se regirán por el contrato principal o políticas definidas por el Sello.",
  "8. RESPONSABILIDAD: El Artista garantiza que el contenido no vulnera derechos de autor ni normas legales.",
  "9. PROTECCIÓN DE DATOS: Tratamiento de datos bajo Ley 1581 de 2012. Consultas en appspacetown@gmail.com.",
  "10. CONSENTIMIENTO ELECTRÓNICO: La aceptación equivale a firma electrónica según Ley 527 de 1999.",
  "11. CONFIDENCIALIDAD: Reserva sobre música inédita y estrategias del Sello.",
  "12. MODIFICACIONES: El Sello puede actualizar estos términos en cualquier momento.",
  "13. LEY APLICABLE: El documento se rige por las leyes de la República de Colombia."
];

declare var emailjs: any;

interface FormState {
  fullName: string;
  documentType: DocumentType | '';
  documentNumber: string;
  personalId: string;
  selfie?: File;
  documentFront?: File;
  documentBack?: File;
}

const InputField: React.FC<{
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}> = ({ label, id, value, onChange, type = "text" }) => (
  <div className="group">
    <label htmlFor={id} className="block text-[9px] font-black text-zinc-500 mb-2 uppercase tracking-[0.4em]">
      {label}
    </label>
    <input
      type={type}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      className="w-full px-5 py-4 bg-zinc-900/40 border border-zinc-800 text-white rounded-xl font-bold uppercase outline-none focus:border-violet-500 transition-all"
      autoComplete="off"
    />
  </div>
);

const compressImageForPdf = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const width = 600;
        const scaleFactor = width / img.width;
        canvas.width = width;
        canvas.height = img.height * scaleFactor;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });
};

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormState>({
    fullName: '', documentType: '', documentNumber: '', personalId: '',
  });
  const [isSigned, setIsSigned] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraFor, setCameraFor] = useState<'selfie' | 'documentFront' | 'documentBack' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showFinished, setShowFinished] = useState(false);
  const [lastPdfLink, setLastPdfLink] = useState('');

  const signaturePadRef = useRef<SignaturePadRef>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
  };

  const handleClearSignature = () => {
    signaturePadRef.current?.clear();
    setIsSigned(false);
  };

  useEffect(() => {
    const savedStart = localStorage.getItem('spacetown_session_start');
    const savedName = localStorage.getItem('spacetown_artist_name');
    const savedDoc = localStorage.getItem('spacetown_artist_doc');
    const savedAlias = localStorage.getItem('spacetown_artist_alias');
    const savedPdf = localStorage.getItem('spacetown_last_pdf');

    if (savedStart) {
      setSessionStartTime(parseInt(savedStart));
      setFormData(prev => ({ 
        ...prev, 
        fullName: savedName || '', 
        documentNumber: savedDoc || '',
        personalId: savedAlias || ''
      }));
      setLastPdfLink(savedPdf || '');
      setTermsAccepted(true);
    }
    if (typeof emailjs !== 'undefined') emailjs.init(APP_CONFIG.EMAILJS.PUBLIC_KEY);
  }, []);

  useEffect(() => {
    let interval: number;
    if (sessionStartTime) {
      interval = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const addPdfDeco = (doc: jsPDF, pageNumber: number) => {
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    
    doc.setTextColor(235, 235, 235);
    doc.setFontSize(40);
    doc.text("SPACE TOWN RECORDS", pdfWidth / 2, pdfHeight / 2, { align: 'center', angle: 45 });

    doc.setFillColor(30, 30, 30);
    doc.rect(pdfWidth - 25, 0, 25, pdfHeight, 'F');
    
    try {
        doc.addImage(LOGO_PNG, 'PNG', pdfWidth / 2 - 15, 10, 30, 30);
    } catch (e) { console.warn("Logo error", e); }
    
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("ACUERDO DE SESIÓN - SPACE TOWN", pdfWidth / 2, 50, { align: 'center' });
    
    doc.setFontSize(9);
    doc.text("CALI - COLOMBIA | @SPACETOWNREC", 15, pdfHeight - 15);
    doc.text(`Página ${pageNumber}`, pdfWidth - 45, pdfHeight - 10);
  };

  const drawTable = (doc: jsPDF, startY: number, rows: [string, string][]) => {
    const col1Width = 70;
    const col2Width = 100;
    const rowHeight = 10;
    let currentY = startY;

    rows.forEach(([label, value]) => {
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(245, 245, 245);
      doc.rect(15, currentY, col1Width, rowHeight, 'FD');
      doc.rect(15 + col1Width, currentY, col2Width, rowHeight, 'D');
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(label.toUpperCase(), 18, currentY + 6);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const val = doc.splitTextToSize(value || "N/A", col2Width - 5);
      doc.text(val, 15 + col1Width + 3, currentY + 6);
      currentY += rowHeight;
    });
    return currentY;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const signature = signaturePadRef.current?.getSignature();
    if (!formData.fullName || !formData.personalId || !formData.documentNumber || !formData.selfie || !signature) {
      alert("⚠️ Completa todos los campos y firma para iniciar.");
      return;
    }

    setIsProcessing(true);
    setProcessingStep("PREPARANDO EXPEDIENTE...");

    try {
      const [selfieData, docFrontData, docBackData] = await Promise.all([
        compressImageForPdf(formData.selfie!),
        compressImageForPdf(formData.documentFront!),
        compressImageForPdf(formData.documentBack!),
      ]);

      const doc = new jsPDF();
      const pdfWidth = doc.internal.pageSize.getWidth();

      addPdfDeco(doc, 1);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("REGISTRO DE IDENTIDAD Y PROPIEDAD INTELECTUAL", pdfWidth / 2, 65, { align: 'center' });
      doc.line(15, 70, pdfWidth - 35, 70);

      drawTable(doc, 80, [
        ["Nombre Artístico", formData.personalId],
        ["Artista (Legal)", formData.fullName],
        ["Identificación", `${formData.documentType} ${formData.documentNumber}`],
        ["Fecha Inicio", new Date().toLocaleString()],
        ["Estado", "SESIÓN ACTIVA"]
      ]);

      doc.addPage();
      addPdfDeco(doc, 2);
      doc.text("VERIFICACIÓN BIOMÉTRICA", pdfWidth / 2, 65, { align: 'center' });
      doc.addImage(selfieData, 'JPEG', 20, 80, 50, 50);
      doc.addImage(docFrontData, 'JPEG', 20, 140, 75, 45);
      doc.addImage(docBackData, 'JPEG', 105, 140, 75, 45);

      doc.addPage();
      addPdfDeco(doc, 3);
      doc.addImage(signature, 'PNG', pdfWidth / 2 - 35, 80, 70, 30);
      doc.text("FIRMA DEL ARTISTA", pdfWidth / 2, 115, { align: 'center' });
      doc.text(formData.fullName, pdfWidth / 2, 122, { align: 'center' });

      setProcessingStep("SINCRONIZANDO NUBE...");
      const pdfBlob = doc.output('blob');
      
      let cloudUrl = "LOCAL_COPY_ONLY";
      try {
        const upData = new FormData();
        upData.append('file', pdfBlob, 'acuerdo.pdf');
        const res = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: upData });
        const resJson = await res.json();
        if (resJson.status === 'success') cloudUrl = resJson.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      } catch (err) { console.error("Cloud Error", err); }

      if (typeof emailjs !== 'undefined') {
        try {
          await emailjs.send(APP_CONFIG.EMAILJS.SERVICE_ID, APP_CONFIG.EMAILJS.TEMPLATE_ID, {
            full_name: formData.fullName,
            personal_id: formData.personalId,
            download_link: cloudUrl,
            doc_number: formData.documentNumber
          });
        } catch (err) { console.error("EmailJS Error", err); }
      }

      doc.save(`SPACE_TOWN_${formData.personalId}.pdf`);

      const startTime = Date.now();
      localStorage.setItem('spacetown_session_start', startTime.toString());
      localStorage.setItem('spacetown_artist_name', formData.fullName);
      localStorage.setItem('spacetown_artist_alias', formData.personalId);
      localStorage.setItem('spacetown_artist_doc', formData.documentNumber);
      localStorage.setItem('spacetown_last_pdf', cloudUrl);
      
      setSessionStartTime(startTime);
      setLastPdfLink(cloudUrl);
      setIsProcessing(false);
    } catch (e) {
      console.error(e);
      alert("❌ Error al generar el acuerdo. Por favor, intente de nuevo.");
      setIsProcessing(false);
    }
  };

  const finishSession = async () => {
    if (!confirm("¿Deseas cerrar la sesión y enviar el registro de tiempo a Gmail?")) return;
    
    setIsProcessing(true);
    setProcessingStep("ENVIANDO REPORTE FINAL...");
    const durationText = formatTime(elapsedTime);
    
    try {
      if (typeof emailjs !== 'undefined') {
        await emailjs.send(APP_CONFIG.EMAILJS.SERVICE_ID, APP_CONFIG.EMAILJS.TEMPLATE_ID_END, {
          full_name: formData.fullName,
          personal_id: formData.personalId,
          session_duration: durationText,
          download_link: lastPdfLink
        });
      }
    } catch (e) { console.error("Final Email Error", e); }
    
    localStorage.clear();
    setIsProcessing(false);
    setShowFinished(true);
  };

  if (showFinished) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black font-orbitron">
      <div className="max-w-md w-full p-10 bg-zinc-900 border-2 border-emerald-500 rounded-[2.5rem] text-center shadow-2xl">
        <h2 className="text-2xl font-black text-white mb-4 uppercase">SESIÓN COMPLETADA</h2>
        <p className="text-zinc-400 text-[10px] mb-8 uppercase tracking-widest">TIEMPO REGISTRADO: {formatTime(elapsedTime)}</p>
        <button onClick={() => window.location.reload()} className="w-full py-4 bg-white text-black font-black rounded-xl uppercase tracking-widest text-xs">NUEVA SESIÓN</button>
      </div>
    </div>
  );

  if (sessionStartTime) return (
    <>
      <ParticleBackground />
      {isProcessing && <ProcessingOverlay step={processingStep} />}
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-zinc-950/90 border border-violet-500/30 p-12 rounded-[3rem] shadow-2xl text-center">
          <img src={LOGO_PNG} className="w-16 h-16 mx-auto mb-6 invert opacity-80" alt="logo" />
          <h1 className="text-3xl font-black font-orbitron text-white mb-2 uppercase">CONTROL DE ESTUDIO</h1>
          <p className="text-[10px] text-zinc-500 tracking-[0.4em] mb-12 uppercase">{formData.personalId} // {formData.fullName}</p>
          <div className="py-14 bg-black/50 border border-zinc-800 rounded-3xl mb-12 shadow-inner">
            <span className="text-7xl font-black font-orbitron text-white tracking-widest tabular-nums">{formatTime(elapsedTime)}</span>
          </div>
          <button onClick={finishSession} className="w-full py-6 bg-red-600/10 border border-red-500 text-red-500 font-black font-orbitron rounded-2xl uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95">Terminar Sesión</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <ParticleBackground />
      {isProcessing && <ProcessingOverlay step={processingStep} />}
      {!termsAccepted ? <TermsModal onAccept={() => setTermsAccepted(true)} /> : (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-12">
          <div className="max-w-4xl w-full bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-8 sm:p-14 rounded-[3rem] shadow-2xl relative overflow-hidden">
            <img src={LOGO_PNG} className="w-16 h-16 mx-auto mb-6 invert" alt="logo" />
            <header className="text-center mb-14">
              <h1 className="text-5xl sm:text-7xl font-black font-orbitron text-white uppercase tracking-tighter">Space Town</h1>
              <p className="text-[10px] font-bold text-violet-400 tracking-[0.8em] uppercase mt-2">Legal Artist System</p>
            </header>
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField label="Nombre Legal Completo" id="fullName" value={formData.fullName} onChange={handleChange} />
                <InputField label="Nombre Artístico" id="personalId" value={formData.personalId} onChange={handleChange} />
                <div className="group">
                  <label className="block text-[9px] font-black text-zinc-500 mb-2 uppercase tracking-[0.4em]">Tipo Documento</label>
                  <select name="documentType" value={formData.documentType} onChange={handleChange} className="w-full px-5 py-4 bg-zinc-900/40 border border-zinc-800 text-white rounded-xl font-bold uppercase outline-none focus:border-violet-500">
                    <option value="" disabled>SELECCIONAR</option>
                    {Object.values(DocumentType).map((type) => <option key={type} value={type}>{type.toUpperCase()}</option>)}
                  </select>
                </div>
                <InputField label="Número ID" id="documentNumber" value={formData.documentNumber} onChange={handleChange} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { id: 'selfie', label: 'Selfie Registro' },
                  { id: 'documentFront', label: 'ID Frontal' },
                  { id: 'documentBack', label: 'ID Reverso' }
                ].map((item) => (
                  <button key={item.id} type="button" onClick={() => { setCameraFor(item.id as any); setIsCameraModalOpen(true); }} className={`p-8 border rounded-2xl transition-all ${formData[item.id as keyof FormState] ? 'bg-emerald-950/20 border-emerald-500 shadow-lg' : 'bg-zinc-900/30 border-zinc-800'}`}>
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 block mb-4">{item.label}</span>
                    <div className="text-2xl text-white">{formData[item.id as keyof FormState] ? '✓' : '+'}</div>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">Firma Digital Autorizada</label>
                  {isSigned && (
                    <button 
                      type="button" 
                      onClick={handleClearSignature}
                      className="text-[8px] font-black text-red-500 uppercase tracking-widest hover:text-red-400 transition-colors"
                    >
                      [ BORRAR ]
                    </button>
                  )}
                </div>
                <div className="h-48 bg-black/60 border border-zinc-800 rounded-2xl relative overflow-hidden">
                  <SignaturePad ref={signaturePadRef} onDrawStart={() => setIsSigned(true)} />
                  {!isSigned && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[9px] text-zinc-800 font-black uppercase tracking-[0.8em]">Firma Aquí</div>}
                </div>
              </div>
              
              <button type="submit" className="w-full py-6 bg-white text-black font-black font-orbitron rounded-2xl uppercase tracking-[0.3em] hover:bg-violet-500 hover:text-white transition-all transform hover:-translate-y-1 shadow-xl">
                Validar e Iniciar Sesión
              </button>
            </form>
          </div>
        </div>
      )}
      <CameraModal isOpen={isCameraModalOpen} onClose={() => setIsCameraModalOpen(false)} onCapture={(f) => { setFormData(p => ({...p, [cameraFor!]: f})); setIsCameraModalOpen(false); }} purpose={cameraFor} />
    </>
  );
};

export default App;
