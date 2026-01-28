
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
    TEMPLATE_ID_END: "template_tod2pkl" // Finalización (Reporte de Tiempo)
  }
};

// Logo Space Town - Base64 Verificado (No Corrupto)
const LOGO_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABNklEQVR4nO3b0Q3CMAxEUbNhAzYIBmCCZuAGYIBgACZgAmAAJmACZgAmYAFmAAbIAoRHSUoUfVfS70uVInKINff8XpIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSRL37AsN2D9p6x/xVAAAAABJRU5ErkJggg==";

const TERMS_CONTENT = [
  "1. OBJETO: Los presentes Términos y Condiciones regulan el ingreso del Artista al estudio del Sello.",
  "2. DECLARACIONES DEL ARTISTA: El Artista declara ser titular de sus obras y no infringir derechos de terceros.",
  "3. AUTORIZACIÓN PARA LA FIJACIÓN: El Artista autoriza la grabación de sus interpretaciones y voces.",
  "4. CESIÓN DE DERECHOS: El Artista cede al Sello los derechos de explotación mundial.",
  "5. TITULARIDAD: Los fonogramas producidos serán propiedad exclusiva del Sello.",
  "6. IMAGEN: Autorización para utilizar nombre, imagen y voz con fines promocionales.",
  "7. PROTECCIÓN DE DATOS: Tratamiento de datos bajo Ley 1581 de 2012.",
  "8. CONSENTIMIENTO: La aceptación electrónica equivale a firma física."
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
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(40);
    doc.text("SPACE TOWN", pdfWidth / 2, pdfHeight / 2, { align: 'center', angle: 45 });
    doc.setFillColor(20, 20, 20);
    doc.rect(pdfWidth - 20, 0, 20, pdfHeight, 'F');
    try {
      doc.addImage(LOGO_PNG, 'PNG', pdfWidth / 2 - 10, 10, 20, 20);
    } catch (e) { console.warn("Logo PNG skip", e); }
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Registro Autenticado - Pág ${pageNumber}`, 15, pdfHeight - 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const signature = signaturePadRef.current?.getSignature();
    if (!formData.fullName || !formData.personalId || !formData.documentNumber || !formData.selfie || !signature) {
      alert("⚠️ Completa todos los datos y la firma.");
      return;
    }

    setIsProcessing(true);
    setProcessingStep("GENERANDO EXPEDIENTE SEGURO...");

    try {
      const [selfieData, docFrontData, docBackData] = await Promise.all([
        compressImageForPdf(formData.selfie!),
        compressImageForPdf(formData.documentFront!),
        compressImageForPdf(formData.documentBack!),
      ]);

      const doc = new jsPDF();
      const pdfWidth = doc.internal.pageSize.getWidth();

      // Pág 1: Datos
      addPdfDeco(doc, 1);
      doc.setFont("helvetica", "bold");
      doc.text("ACUERDO DE SESIÓN SPACE TOWN", pdfWidth / 2, 45, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Artista: ${formData.personalId}`, 20, 60);
      doc.text(`Nombre Legal: ${formData.fullName}`, 20, 70);
      doc.text(`ID: ${formData.documentNumber}`, 20, 80);
      doc.text(`Fecha: ${new Date().toLocaleString()}`, 20, 90);

      // Pág 2: Evidencia
      doc.addPage();
      addPdfDeco(doc, 2);
      doc.addImage(selfieData, 'JPEG', 20, 40, 60, 60);
      doc.addImage(docFrontData, 'JPEG', 20, 110, 80, 50);
      doc.addImage(docBackData, 'JPEG', 110, 110, 80, 50);

      // Pág 3: Firma
      doc.addPage();
      addPdfDeco(doc, 3);
      doc.addImage(signature, 'PNG', pdfWidth / 2 - 30, 60, 60, 25);
      doc.text("FIRMA AUTORIZADA", pdfWidth / 2, 95, { align: 'center' });

      setProcessingStep("SINCRONIZANDO CON GMAIL...");
      const pdfBlob = doc.output('blob');
      
      let cloudUrl = "LOCAL_COPY";
      try {
        const upData = new FormData();
        upData.append('file', pdfBlob, 'registro.pdf');
        const res = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: upData });
        const resJson = await res.json();
        if (resJson.status === 'success') cloudUrl = resJson.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      } catch (err) { console.error("Cloud Error", err); }

      if (typeof emailjs !== 'undefined') {
        await emailjs.send(APP_CONFIG.EMAILJS.SERVICE_ID, APP_CONFIG.EMAILJS.TEMPLATE_ID, {
          full_name: formData.fullName,
          personal_id: formData.personalId,
          download_link: cloudUrl
        });
      }

      doc.save(`SPACETOWN_${formData.personalId}.pdf`);

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
      alert("❌ Error de archivo. Asegúrese de que las fotos sean válidas.");
      setIsProcessing(false);
    }
  };

  const finishSession = async () => {
    const finalDuration = formatTime(elapsedTime);
    if (!confirm(`¿Cerrar sesión de estudio?\nTiempo total: ${finalDuration}`)) return;
    
    setIsProcessing(true);
    setProcessingStep("ENVIANDO REPORTE DE TIEMPO...");
    
    try {
      if (typeof emailjs !== 'undefined') {
        await emailjs.send(APP_CONFIG.EMAILJS.SERVICE_ID, APP_CONFIG.EMAILJS.TEMPLATE_ID_END, {
          full_name: formData.fullName,
          personal_id: formData.personalId,
          session_duration: finalDuration,
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
        <h2 className="text-2xl font-black text-white mb-4 uppercase">SESIÓN FINALIZADA</h2>
        <p className="text-zinc-400 text-[10px] mb-8 uppercase tracking-widest">REGISTRO ENVIADO A GMAIL</p>
        <button onClick={() => window.location.reload()} className="w-full py-4 bg-white text-black font-black rounded-xl uppercase tracking-widest text-xs">VOLVER AL INICIO</button>
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
          <h1 className="text-3xl font-black font-orbitron text-white mb-2 uppercase">TIEMPO EN ESTUDIO</h1>
          <p className="text-[10px] text-zinc-500 tracking-[0.4em] mb-12 uppercase">{formData.personalId}</p>
          <div className="py-14 bg-black/50 border border-zinc-800 rounded-3xl mb-12 shadow-inner">
            <span className="text-7xl font-black font-orbitron text-white tracking-widest tabular-nums">{formatTime(elapsedTime)}</span>
          </div>
          <button onClick={finishSession} className="w-full py-6 bg-red-600/10 border border-red-500 text-red-500 font-black font-orbitron rounded-2xl uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95">Terminar y Reportar</button>
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
              <p className="text-[10px] font-bold text-violet-400 tracking-[0.8em] uppercase mt-2">Acceso Artistas VIP</p>
            </header>
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField label="Nombre Legal" id="fullName" value={formData.fullName} onChange={handleChange} />
                <InputField label="Nombre Artístico" id="personalId" value={formData.personalId} onChange={handleChange} />
                <div className="group">
                  <label className="block text-[9px] font-black text-zinc-500 mb-2 uppercase tracking-[0.4em]">Tipo Documento</label>
                  <select name="documentType" value={formData.documentType} onChange={handleChange} className="w-full px-5 py-4 bg-zinc-900/40 border border-zinc-800 text-white rounded-xl font-bold uppercase outline-none focus:border-violet-500">
                    <option value="" disabled>SELECCIONAR</option>
                    {Object.values(DocumentType).map((type) => <option key={type} value={type}>{type.toUpperCase()}</option>)}
                  </select>
                </div>
                <InputField label="Cédula / ID" id="documentNumber" value={formData.documentNumber} onChange={handleChange} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { id: 'selfie', label: 'Selfie' },
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
                  <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">Firma Digital</label>
                  {isSigned && (
                    <button type="button" onClick={handleClearSignature} className="text-[8px] font-black text-red-500 uppercase tracking-widest hover:text-red-400">[ BORRAR ]</button>
                  )}
                </div>
                <div className="h-48 bg-black/60 border border-zinc-800 rounded-2xl relative overflow-hidden">
                  <SignaturePad ref={signaturePadRef} onDrawStart={() => setIsSigned(true)} />
                  {!isSigned && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[9px] text-zinc-800 font-black uppercase tracking-[0.8em]">Firma Aquí</div>}
                </div>
              </div>
              
              <button type="submit" className="w-full py-6 bg-white text-black font-black font-orbitron rounded-2xl uppercase tracking-[0.3em] hover:bg-violet-500 hover:text-white transition-all transform hover:-translate-y-1 shadow-xl">
                Iniciar Sesión de Grabación
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
