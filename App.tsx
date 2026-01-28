
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
    TEMPLATE_ID: "template_tod2pkl", // Plantilla para Inicio
    TEMPLATE_ID_END: "template_tod2pkl" // Plantilla para Cierre (debe aceptar session_duration)
  }
};

// Logo Space Town - Base64 Verificado (Círculo Minimalista Espacial)
const LOGO_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAABXElEQVR4nO2asUoDQRRFD9SInY2InSBYWFmI2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYitnIAsBfM/K/tHbgAAAAASUVORK5CYII=";

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
  const [initialPdfUrl, setInitialPdfUrl] = useState('');

  const signaturePadRef = useRef<SignaturePadRef>(null);

  // --- Utilidades de Formato ---
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 600;
          canvas.height = img.height * (600 / img.width);
          canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
    });
  };

  // --- Generador de PDF Legal ---
  const createLegalBase = (doc: jsPDF, title: string) => {
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    
    // Margen decorativo (Violeta)
    doc.setFillColor(109, 40, 217); 
    doc.rect(0, 0, 5, h, 'F');
    
    // Encabezado
    doc.setFillColor(245, 245, 250);
    doc.rect(15, 10, w - 30, 25, 'F');
    try {
      doc.addImage(LOGO_PNG, 'PNG', 20, 12, 20, 20);
    } catch (e) {}
    
    doc.setTextColor(30, 30, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("SPACE TOWN RECORDS - LEGAL DEPT.", 45, 22);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(title.toUpperCase(), 45, 28);
    
    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("ESTE DOCUMENTO ES UN REGISTRO OFICIAL GENERADO POR EL SISTEMA SPACE TOWN. CALI, COLOMBIA.", w/2, h - 10, { align: 'center' });
    return 45; // Nueva posición Y
  };

  // --- Lógica Principal ---
  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const signature = signaturePadRef.current?.getSignature();
    if (!formData.fullName || !formData.personalId || !formData.selfie || !signature) {
      alert("⚠️ Error: Todos los campos y la firma son obligatorios para el ingreso legal.");
      return;
    }

    setIsProcessing(true);
    setProcessingStep("GENERANDO ACTA DE REGISTRO...");

    try {
      const [selfie, docF, docB] = await Promise.all([
        compressImage(formData.selfie!),
        formData.documentFront ? compressImage(formData.documentFront) : Promise.resolve(''),
        formData.documentBack ? compressImage(formData.documentBack) : Promise.resolve('')
      ]);

      const doc = new jsPDF();
      let y = createLegalBase(doc, "Acta de Registro e Ingreso Artístico");
      
      // Datos del Artista
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("1. INFORMACIÓN DEL ARTISTA", 15, y);
      doc.line(15, y + 2, 100, y + 2);
      y += 10;
      
      doc.setFont("helvetica", "normal");
      doc.text(`NOMBRE ARTÍSTICO: ${formData.personalId}`, 15, y); y += 6;
      doc.text(`NOMBRE LEGAL: ${formData.fullName}`, 15, y); y += 6;
      doc.text(`IDENTIFICACIÓN: ${formData.documentType} - ${formData.documentNumber}`, 15, y); y += 6;
      doc.text(`FECHA Y HORA DE INGRESO: ${new Date().toLocaleString()}`, 15, y); y += 15;

      // Evidencia Fotográfica
      doc.setFont("helvetica", "bold");
      doc.text("2. REGISTRO BIOMÉTRICO", 15, y);
      y += 5;
      doc.addImage(selfie, 'JPEG', 15, y, 50, 50);
      if (docF) doc.addImage(docF, 'JPEG', 75, y, 60, 35);
      if (docB) doc.addImage(docB, 'JPEG', 140, y, 60, 35);
      y += 55;

      // Firma
      doc.setFont("helvetica", "bold");
      doc.text("3. CONSENTIMIENTO Y FIRMA", 15, y);
      y += 5;
      doc.addImage(signature, 'PNG', 15, y, 60, 25);
      doc.setFontSize(8);
      doc.text("FIRMA ELECTRÓNICA VALIDADA", 15, y + 32);

      const pdfBlob = doc.output('blob');
      let cloudUrl = "INTERNAL_STORAGE";
      
      try {
        const up = new FormData(); up.append('file', pdfBlob, 'acta_ingreso.pdf');
        const res = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: up });
        const json = await res.json();
        if (json.status === 'success') cloudUrl = json.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      } catch (e) {}

      setInitialPdfUrl(cloudUrl);
      const startTime = Date.now();
      
      // Guardar en local para persistencia
      localStorage.setItem('st_start', startTime.toString());
      localStorage.setItem('st_name', formData.fullName);
      localStorage.setItem('st_alias', formData.personalId);
      localStorage.setItem('st_pdf', cloudUrl);

      setSessionStartTime(startTime);
      doc.save(`REGISTRO_${formData.personalId}.pdf`);
      setIsProcessing(false);
    } catch (error) {
      console.error(error);
      alert("Error al validar el ingreso.");
      setIsProcessing(false);
    }
  };

  const handleFinishSession = async () => {
    const totalDuration = formatTime(elapsedTime);
    if (!confirm(`¿Desea cerrar la sesión de grabación?\nTiempo Total: ${totalDuration}`)) return;

    setIsProcessing(true);
    setProcessingStep("GENERANDO ACTA DE SALIDA...");

    try {
      const doc = new jsPDF();
      let y = createLegalBase(doc, "Acta de Finalización y Entrega");

      doc.setFont("helvetica", "bold");
      doc.text("DETALLES DE LA SESIÓN FINALIZADA", 15, y);
      y += 10;
      
      doc.setFont("helvetica", "normal");
      doc.text(`ARTISTA: ${formData.personalId}`, 15, y); y += 7;
      doc.text(`RESPONSABLE: ${formData.fullName}`, 15, y); y += 7;
      doc.text(`HORA INGRESO: ${new Date(sessionStartTime!).toLocaleTimeString()}`, 15, y); y += 7;
      doc.text(`HORA SALIDA: ${new Date().toLocaleTimeString()}`, 15, y); y += 10;
      
      // Cuadro de Tiempo resaltado
      doc.setFillColor(240, 230, 255);
      doc.rect(15, y, 180, 20, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(109, 40, 217);
      doc.text(`DURACIÓN TOTAL DE GRABACIÓN: ${totalDuration}`, 105, y + 13, { align: 'center' });

      // Enviar reporte final por Email
      if (typeof emailjs !== 'undefined') {
        await emailjs.send(APP_CONFIG.EMAILJS.SERVICE_ID, APP_CONFIG.EMAILJS.TEMPLATE_ID_END, {
          full_name: formData.fullName,
          personal_id: formData.personalId,
          session_duration: totalDuration,
          exit_time: new Date().toLocaleTimeString(),
          initial_pdf: initialPdfUrl
        });
      }

      doc.save(`CIERRE_${formData.personalId}.pdf`);
      localStorage.clear();
      setIsProcessing(false);
      setShowFinished(true);
    } catch (e) {
      setIsProcessing(false);
      alert("Error en el reporte final.");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('st_start');
    if (saved) {
      setSessionStartTime(parseInt(saved));
      setFormData(p => ({
        ...p,
        fullName: localStorage.getItem('st_name') || '',
        personalId: localStorage.getItem('st_alias') || ''
      }));
      setInitialPdfUrl(localStorage.getItem('st_pdf') || '');
      setTermsAccepted(true);
    }
    if (typeof emailjs !== 'undefined') emailjs.init(APP_CONFIG.EMAILJS.PUBLIC_KEY);
  }, []);

  useEffect(() => {
    let timer: number;
    if (sessionStartTime) {
      timer = window.setInterval(() => setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000)), 1000);
    }
    return () => clearInterval(timer);
  }, [sessionStartTime]);

  if (showFinished) return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6 font-orbitron">
      <div className="max-w-md w-full bg-zinc-900 border-2 border-emerald-500 p-10 rounded-[3rem] text-center shadow-2xl">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
        <h2 className="text-2xl font-black text-white mb-2 uppercase">SESIÓN REPORTADA</h2>
        <p className="text-zinc-500 text-[10px] mb-8 tracking-widest">REGISTRO DE TIEMPO ENVIADO A LA NUBE</p>
        <button onClick={() => window.location.reload()} className="w-full py-4 bg-white text-black font-black rounded-xl uppercase text-xs tracking-widest">Finalizar Flujo</button>
      </div>
    </div>
  );

  if (sessionStartTime) return (
    <>
      <ParticleBackground />
      {isProcessing && <ProcessingOverlay step={processingStep} />}
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-2xl w-full bg-zinc-950/80 border border-violet-500/20 p-12 rounded-[4rem] backdrop-blur-3xl shadow-2xl">
          <img src={LOGO_PNG} className="w-16 h-16 mx-auto mb-8 invert opacity-50" alt="logo" />
          <h2 className="text-4xl font-black font-orbitron text-white mb-2 tracking-tighter">ESTUDIO ACTIVO</h2>
          <p className="text-[9px] text-violet-400 font-bold tracking-[0.6em] mb-12 uppercase">Artista: {formData.personalId}</p>
          
          <div className="py-16 bg-black/40 border border-zinc-800 rounded-[3rem] shadow-inner mb-12">
            <span className="text-8xl font-black font-orbitron text-white tracking-widest tabular-nums">{formatTime(elapsedTime)}</span>
          </div>

          <button 
            onClick={handleFinishSession}
            className="w-full py-6 bg-red-600/10 border border-red-500/50 text-red-500 font-black font-orbitron rounded-2xl uppercase tracking-[0.4em] hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
          >
            Finalizar Sesión y Reportar
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <ParticleBackground />
      {isProcessing && <ProcessingOverlay step={processingStep} />}
      {!termsAccepted ? <TermsModal onAccept={() => setTermsAccepted(true)} /> : (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-zinc-950/90 border border-zinc-900 p-8 sm:p-16 rounded-[4rem] shadow-2xl relative">
            <header className="text-center mb-16">
              <img src={LOGO_PNG} className="w-16 h-16 mx-auto mb-6 invert" alt="logo" />
              <h1 className="text-6xl font-black font-orbitron text-white uppercase tracking-tighter">Space Town</h1>
              <div className="h-1 w-24 bg-violet-600 mx-auto mt-4 rounded-full"></div>
              <p className="text-[10px] text-zinc-500 font-bold tracking-[0.8em] uppercase mt-4">Protocolo de Ingreso Legal</p>
            </header>

            <form onSubmit={handleStartSession} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Nombre Completo (Legal)</label>
                  <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value.toUpperCase()})} className="w-full px-6 py-4 bg-zinc-900 border border-zinc-800 text-white rounded-xl font-bold uppercase focus:border-violet-600 outline-none" required />
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Nombre Artístico / Alias</label>
                  <input type="text" value={formData.personalId} onChange={e => setFormData({...formData, personalId: e.target.value.toUpperCase()})} className="w-full px-6 py-4 bg-zinc-900 border border-zinc-800 text-white rounded-xl font-bold uppercase focus:border-violet-600 outline-none" required />
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Tipo ID</label>
                  <select value={formData.documentType} onChange={e => setFormData({...formData, documentType: e.target.value as DocumentType})} className="w-full px-6 py-4 bg-zinc-900 border border-zinc-800 text-white rounded-xl font-bold uppercase focus:border-violet-600 outline-none">
                    {Object.values(DocumentType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Número de Documento</label>
                  <input type="text" value={formData.documentNumber} onChange={e => setFormData({...formData, documentNumber: e.target.value.toUpperCase()})} className="w-full px-6 py-4 bg-zinc-900 border border-zinc-800 text-white rounded-xl font-bold uppercase focus:border-violet-600 outline-none" required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { k: 'selfie', l: 'Selfie Ingreso' },
                  { k: 'documentFront', l: 'ID Cara A' },
                  { k: 'documentBack', l: 'ID Cara B' }
                ].map(item => (
                  <button key={item.k} type="button" onClick={() => { setCameraFor(item.k as any); setIsCameraModalOpen(true); }} className={`p-8 border-2 rounded-3xl transition-all ${formData[item.k as keyof FormState] ? 'bg-violet-900/10 border-violet-600 shadow-lg shadow-violet-900/20' : 'bg-zinc-900/50 border-zinc-800'}`}>
                    <span className="text-[8px] font-black uppercase text-zinc-600 block mb-3">{item.l}</span>
                    <div className="text-3xl text-white">{formData[item.k as keyof FormState] ? '✓' : '+'}</div>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Firma Digital del Artista</label>
                  {isSigned && <button type="button" onClick={() => { signaturePadRef.current?.clear(); setIsSigned(false); }} className="text-[8px] font-bold text-red-500 uppercase tracking-widest">[ BORRAR FIRMA ]</button>}
                </div>
                <div className="h-48 bg-black/60 border border-zinc-800 rounded-3xl relative overflow-hidden">
                  <SignaturePad ref={signaturePadRef} onDrawStart={() => setIsSigned(true)} />
                  {!isSigned && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[8px] text-zinc-800 font-black uppercase tracking-[0.8em]">Espacio de Firma</div>}
                </div>
              </div>

              <button type="submit" className="w-full py-6 bg-white text-black font-black font-orbitron rounded-2xl uppercase tracking-[0.4em] hover:bg-violet-600 hover:text-white transition-all shadow-xl active:scale-95">Validar e Iniciar Grabación</button>
            </form>
          </div>
        </div>
      )}
      <CameraModal isOpen={isCameraModalOpen} onClose={() => setIsCameraModalOpen(false)} onCapture={f => { setFormData(p => ({...p, [cameraFor!]: f})); setIsCameraModalOpen(false); }} purpose={cameraFor} />
    </>
  );
};

export default App;
