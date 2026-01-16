
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
    TEMPLATE_ID: "template_tod2pkl" 
  }
};

declare var emailjs: any;

interface FormState {
  fullName: string;
  documentType: DocumentType | '';
  documentNumber: string;
  personalId: string;
  sociedadGestion: string;
  ipi: string;
  selfie?: File;
  documentFront?: File;
  documentBack?: File;
}

// Compresión optimizada para que el PDF pese menos de 500KB
const compressImageForPdf = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const width = 600; // Resolución óptima para documentos
        const scaleFactor = width / img.width;
        canvas.width = width;
        canvas.height = img.height * scaleFactor;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); // Compresión al 60%
      };
    };
  });
};

const playInterfaceSound = (type: 'click' | 'success' | 'scan') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'click') {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'scan') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.3);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) { }
};

const InputField: React.FC<{ label: string; id: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; placeholder?: string }> = ({ label, id, ...props }) => (
    <div className="group relative">
        <label htmlFor={id} className="block text-[9px] font-black text-zinc-500 mb-2 uppercase tracking-[0.4em] group-focus-within:text-violet-400 transition-colors">
          {label}
        </label>
        <input 
          id={id} name={id} autoComplete="off" {...props} 
          onFocus={() => playInterfaceSound('click')}
          className="uppercase w-full px-5 py-4 bg-zinc-900/40 border border-zinc-800/50 text-white placeholder-zinc-700 rounded-xl focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all outline-none font-bold tracking-wider" 
        />
    </div>
);

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormState>({
    fullName: '', documentType: '', documentNumber: '', personalId: '', sociedadGestion: '', ipi: '',
  });
  const [isSigned, setIsSigned] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraFor, setCameraFor] = useState<'selfie' | 'documentFront' | 'documentBack' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const signaturePadRef = useRef<SignaturePadRef>(null);

  useEffect(() => {
    if (typeof emailjs !== 'undefined') {
        emailjs.init(APP_CONFIG.EMAILJS.PUBLIC_KEY); 
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value.toUpperCase() }));
  };
  
  const openCamera = (type: 'selfie' | 'documentFront' | 'documentBack') => {
    playInterfaceSound('click');
    setCameraFor(type);
    setIsCameraModalOpen(true);
  }

  const handleCapture = (imageFile: File) => {
    playInterfaceSound('scan');
    setFormData(prevState => ({ ...prevState, [cameraFor!]: imageFile }));
    setIsCameraModalOpen(false);
    setCameraFor(null);
  };

  const uploadToCloud = async (pdfBlob: Blob): Promise<string> => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', pdfBlob, 'registro_spacetown.pdf');
      
      // Usamos tmpfiles.org que es más permisivo con CORS
      const response = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: uploadFormData
      });
      
      const result = await response.json();
      
      if (result.status === 'success' && result.data && result.data.url) {
        // El link de tmpfiles viene como "tmpfiles.org/XXXX", lo cambiamos para que sea de descarga directa
        return result.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      }
      
      throw new Error("Cloud rejected file");
    } catch (err) {
      console.error("Cloud Error:", err);
      return "ERROR_AL_GENERAR_LINK_REINTENTAR";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const signature = signaturePadRef.current?.getSignature();
    
    if (!formData.fullName || !formData.documentNumber || !formData.selfie || !formData.documentFront || !formData.documentBack || !signature) {
      alert('⚠️ DATOS INCOMPLETOS: Debes capturar las 3 fotos y firmar.');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('PREPARANDO ARCHIVOS...');

    try {
        const [selfieData, docFrontData, docBackData] = await Promise.all([
            compressImageForPdf(formData.selfie!),
            compressImageForPdf(formData.documentFront!),
            compressImageForPdf(formData.documentBack!),
        ]);

        setProcessingStep('CREANDO PDF NEGRO...');
        const doc = new jsPDF();
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();

        // PAG 1
        doc.setFillColor(0, 0, 0); 
        doc.rect(0, 0, pdfWidth, pdfHeight, 'F');
        doc.setTextColor(139, 92, 246); 
        doc.setFontSize(26);
        doc.text("SPACE TOWN", pdfWidth / 2, 30, { align: 'center' });
        doc.setDrawColor(139, 92, 246);
        doc.line(20, 40, pdfWidth - 20, 40);
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text("CERTIFICADO DE ARTISTA", 25, 60);
        doc.setFontSize(10);
        doc.text(`NOMBRE: ${formData.fullName}`, 25, 75);
        doc.text(`ID: ${formData.documentNumber}`, 25, 85);
        doc.text(`ALIAS: ${formData.personalId || 'NO REGISTRADO'}`, 25, 95);
        
        doc.setTextColor(139, 92, 246);
        doc.text("FIRMA:", 25, 120);
        doc.addImage(signature, 'PNG', 25, 125, 50, 20);

        // PAG 2
        doc.addPage();
        doc.setFillColor(0, 0, 0); 
        doc.rect(0, 0, pdfWidth, pdfHeight, 'F');
        doc.setTextColor(139, 92, 246);
        doc.text("REGISTRO FOTOGRÁFICO", pdfWidth/2, 20, {align: 'center'});
        
        doc.addImage(selfieData, 'JPEG', 25, 30, 50, 50);
        doc.addImage(docFrontData, 'JPEG', 25, 90, 70, 45);
        doc.addImage(docBackData, 'JPEG', 25, 145, 70, 45);

        setProcessingStep('SUBIENDO A LA NUBE...');
        const pdfBlob = doc.output('blob');
        const downloadLink = await uploadToCloud(pdfBlob);

        if (downloadLink.includes("ERROR")) {
            throw new Error("Fallo la subida a la nube");
        }

        setProcessingStep('NOTIFICANDO POR EMAIL...');
        if (typeof emailjs !== 'undefined') {
            await emailjs.send(APP_CONFIG.EMAILJS.SERVICE_ID, APP_CONFIG.EMAILJS.TEMPLATE_ID, {
                full_name: formData.fullName,
                doc_number: formData.documentNumber,
                download_link: downloadLink
            });
        }

        // Descarga automática en el móvil del usuario
        doc.save(`SPACETOWN_${formData.fullName}.pdf`);

        setIsProcessing(false); setShowSuccess(true);
        playInterfaceSound('success');
    } catch (error) {
        console.error(error);
        alert("⚠️ ERROR DE RED: No se pudo subir el archivo. Reintenta ahora.");
        setIsProcessing(false);
    }
  };

  const CaptureButton: React.FC<{ type: 'selfie' | 'documentFront' | 'documentBack', label: string }> = ({ type, label }) => {
    const isCaptured = !!formData[type];
    return (
      <button 
        type="button" onClick={() => openCamera(type)} 
        className={`flex flex-col items-center p-6 border transition-all rounded-2xl group ${
          isCaptured ? 'bg-emerald-950/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-zinc-900/30 border-zinc-800'
        }`}
      >
        <span className={`text-[8px] font-black mb-3 tracking-widest uppercase ${isCaptured ? 'text-emerald-400' : 'text-zinc-600'}`}>{label}</span>
        <div className={`w-12 h-12 border-2 rounded-full flex items-center justify-center mb-3 transition-all ${
          isCaptured ? 'border-emerald-400 bg-emerald-400' : 'border-dashed border-zinc-700 group-hover:border-violet-500'
        }`}>
          {isCaptured ? (
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
          ) : (
            <span className="text-xl text-zinc-700">+</span>
          )}
        </div>
        <span className={`text-[7px] font-bold uppercase tracking-widest ${isCaptured ? 'text-emerald-400' : 'text-violet-400'}`}>
          {isCaptured ? 'LISTO' : 'CAPTURAR'}
        </span>
      </button>
    );
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black font-orbitron">
        <div className="max-w-md w-full p-10 bg-zinc-900/50 border-2 border-emerald-500 rounded-[2rem] text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-4 uppercase neon-text">ÉXITO TOTAL</h2>
          <p className="text-zinc-400 text-[10px] mb-8 uppercase tracking-widest leading-relaxed">
            1. EL PDF SE DESCARGÓ EN ESTE EQUIPO.<br/>
            2. EL LINK LLEGÓ A TU EMAIL SPACES TOWN.<br/>
            3. REGISTRO OFICIALIZADO.
          </p>
          <button onClick={() => window.location.reload()} className="w-full py-4 bg-white text-black font-black rounded-xl uppercase tracking-widest text-xs">
            NUEVO REGISTRO
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ParticleBackground />
      {isProcessing && <ProcessingOverlay step={processingStep} />}
      {!termsAccepted ? <TermsModal onAccept={() => setTermsAccepted(true)} /> : (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-12">
          <div className="max-w-4xl w-full bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-8 sm:p-14 rounded-[3rem] shadow-2xl relative">
            <header className="text-center mb-12">
              <h1 className="text-4xl sm:text-6xl font-black font-orbitron text-white uppercase neon-text">Space Town</h1>
              <p className="text-[9px] font-bold text-violet-400 tracking-[0.6em] uppercase">Artist Identity System</p>
            </header>
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField label="Nombre Legal" id="fullName" value={formData.fullName} onChange={handleChange} />
                <div className="group">
                  <label className="block text-[9px] font-black text-zinc-500 mb-2 uppercase tracking-[0.4em]">Tipo ID</label>
                  <select name="documentType" value={formData.documentType} onChange={handleChange} className="w-full px-5 py-4 bg-zinc-900/40 border border-zinc-800 text-white rounded-xl outline-none font-bold">
                    <option value="" disabled>SELECT TYPE</option>
                    {Object.values(DocumentType).map((type) => <option key={type} value={type}>{type.toUpperCase()}</option>)}
                  </select>
                </div>
                <InputField label="Número ID" id="documentNumber" value={formData.documentNumber} onChange={handleChange} />
                <InputField label="Nombre Artístico" id="personalId" value={formData.personalId} onChange={handleChange} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <CaptureButton type="selfie" label="Face ID" />
                <CaptureButton type="documentFront" label="ID Front" />
                <CaptureButton type="documentBack" label="ID Back" />
              </div>

              <div className="space-y-4">
                <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">Firma Autorizada</label>
                <div className="h-44 bg-black/50 border border-zinc-800 rounded-2xl relative overflow-hidden">
                  <SignaturePad ref={signaturePadRef} onDrawStart={() => setIsSigned(true)} />
                  {!isSigned && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[9px] text-zinc-800 font-black uppercase tracking-[0.8em]">Sign Below</div>}
                </div>
              </div>
              
              <button type="submit" className="w-full py-5 bg-violet-600 text-white font-black font-orbitron rounded-xl uppercase tracking-widest shadow-xl hover:bg-violet-500 transition-all active:scale-95">GENERAR Y ENVIAR</button>
            </form>
          </div>
        </div>
      )}
      <CameraModal isOpen={isCameraModalOpen} onClose={() => setIsCameraModalOpen(false)} onCapture={handleCapture} purpose={cameraFor} />
    </>
  );
};

export default App;
