
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
  CLUB_NAME: "SPACE TOWN CLUB",
  RECIPIENT_EMAIL: "appspacetown@gmail.com", 
  EMAILJS: {
    SERVICE_ID: "service_n97bgi4",     
    PUBLIC_KEY: "HHnp6ci-SEnxKhFPA", 
    TEMPLATE_ID: "template_tod2pkl",
  }
};

const LOGO_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAABXElEQVR4nO2asUoDQRRFD9SInY2InSBYWFmI2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYidiJ2InYitnIAsBfM/K/tHbgAAAAASUVORK5CYII=";

declare global {
  interface Window {
    emailjs: any;
  }
}

interface FormState {
  fullName: string;
  documentType: DocumentType | '';
  documentNumber: string;
  artisticName: string;
  selfie?: string; 
  documentFront?: string;
  documentBack?: string;
}

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormState>({
    fullName: '', documentType: DocumentType.CedulaDeCiudadania, documentNumber: '', artisticName: '',
  });
  const [isSigned, setIsSigned] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraFor, setCameraFor] = useState<'selfie' | 'documentFront' | 'documentBack' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showFinished, setShowFinished] = useState(false);

  const signaturePadRef = useRef<SignaturePadRef>(null);

  const getFullTimestamp = () => new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  const uploadPdfToCloud = async (pdfBlob: Blob): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); 

    try {
      const upData = new FormData();
      upData.append('file', pdfBlob, 'contrato_vip_spacetown.pdf');
      const res = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: upData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const json = await res.json();
      return json.status === 'success' ? json.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/') : 'Link no generado';
    } catch (e: any) {
      clearTimeout(timeoutId);
      return 'Link no disponible (Servidor saturado)';
    }
  };

  const applyLegalTemplate = (doc: jsPDF, title: string, page: number) => {
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.1);
    doc.rect(10, 10, w - 20, h - 20);

    doc.setFillColor(240, 240, 245);
    doc.rect(margin, margin, w - (margin * 2), 25, 'F');
    try { doc.addImage(LOGO_PNG, 'PNG', margin + 5, margin + 2, 20, 20); } catch(e) {}
    
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(APP_CONFIG.CLUB_NAME, margin + 30, margin + 12);
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("REGISTRO ÚNICO DE ACCESO Y RESPONSABILIDAD CIVIL", margin + 30, margin + 18);
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(`DOC ID: ${formData.documentNumber || 'N/A'}`, w - margin - 5, margin + 10, { align: 'right' });
    doc.text(`FOLIO: ${Math.floor(Math.random()*9000)+1000}`, w - margin - 5, margin + 15, { align: 'right' });

    doc.setFontSize(7);
    doc.text(`Documento generado digitalmente - PÁGINA ${page}`, w/2, h - 15, { align: 'center' });
    doc.text(`Timestamp: ${getFullTimestamp()}`, w/2, h - 12, { align: 'center' });
    
    return margin + 40;
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const signature = signaturePadRef.current?.getSignature();
    
    if (!formData.fullName || !formData.documentNumber || !formData.selfie || !signature || !isSigned) {
      alert("⚠️ Complete todos los campos, incluída la firma.");
      return;
    }

    setIsProcessing(true);
    setProcessingStep("FORMALIZANDO CONTRATO LEGAL...");

    try {
      const doc = new jsPDF();
      let y = applyLegalTemplate(doc, "Registro de Ingreso", 1);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("1. IDENTIFICACIÓN DEL TITULAR", 20, y);
      doc.line(20, y + 2, 190, y + 2);
      y += 10;

      const data = [
        ["NOMBRE COMPLETO:", formData.fullName],
        ["ALIAS ARTÍSTICO:", formData.artisticName || "NINGUNO"],
        ["TIPO DE DOCUMENTO:", formData.documentType],
        ["NÚMERO DE IDENTIDAD:", formData.documentNumber],
        ["FECHA DE REGISTRO:", getFullTimestamp()]
      ];

      data.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold"); doc.text(label, 25, y);
        doc.setFont("helvetica", "normal"); doc.text(value, 80, y);
        y += 7;
      });

      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("2. REGISTRO FOTOGRÁFICO DE SEGURIDAD", 20, y);
      y += 8;
      doc.addImage(formData.selfie, 'JPEG', 25, y, 40, 40);
      if (formData.documentFront) doc.addImage(formData.documentFront, 'JPEG', 75, y, 55, 35);
      
      y += 50;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("3. CLÁUSULAS DEL REGLAMENTO INTERNO", 20, y);
      doc.line(20, y + 2, 190, y + 2);
      y += 10;

      const terminos = [
        "01. ADMISIÓN: El club se reserva el derecho de permanencia según protocolos de seguridad.",
        "02. BIOMETRÍA: El usuario autoriza la captura de su imagen para control de acceso (Ley 1581/2012).",
        "03. RESPONSABILIDAD: El invitado es responsable de su conducta y del consumo moderado.",
        "04. SALIDA: El usuario se compromete a reportar su salida oficial para finalizar el registro."
      ];

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      terminos.forEach(t => {
        doc.text(t, 25, y);
        y += 6;
      });

      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("4. ACEPTACIÓN Y FIRMA DIGITAL", 20, y);
      y += 8;
      
      const declaracion = `Yo, ${formData.fullName}, identificado con ${formData.documentType} No. ${formData.documentNumber}, declaro bajo gravedad de juramento que acepto libremente los términos y condiciones anteriormente descritos para el ingreso a SPACE TOWN CLUB.`;
      const splitDec = doc.splitTextToSize(declaracion, 160);
      doc.setFont("helvetica", "italic");
      doc.text(splitDec, 25, y);
      
      y += (splitDec.length * 5) + 5;
      doc.addImage(signature, 'PNG', 25, y, 50, 20);
      y += 25;
      doc.setFont("helvetica", "normal");
      doc.text("__________________________", 25, y);
      doc.text("FIRMA DEL ARTISTA/INVITADO", 25, y + 5);

      const pdfBlob = doc.output('blob');
      doc.save(`CONTRATO_VIP_${formData.documentNumber}.pdf`);

      setProcessingStep("SINCRONIZANDO EXPEDIENTE...");
      const link = await uploadPdfToCloud(pdfBlob);
      
      if (window.emailjs) {
        await window.emailjs.send(APP_CONFIG.EMAILJS.SERVICE_ID, APP_CONFIG.EMAILJS.TEMPLATE_ID, {
          to_email: APP_CONFIG.RECIPIENT_EMAIL,
          full_name: formData.fullName,
          doc_number: formData.documentNumber,
          artistic_name: formData.artisticName || "N/A",
          download_link: link,
          pdf_link: link,
          name: formData.fullName,
          message: `CONTRATO FIRMADO: Acceso validado para ${formData.fullName}.`
        });
      }

      localStorage.setItem('st_club_active', JSON.stringify({ active: true, formData }));
      setIsSessionActive(true);

    } catch (err) {
      console.error(err);
      setIsSessionActive(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinishSession = async () => {
    if (!confirm(`¿Confirmar salida oficial de ${formData.fullName}?`)) return;
    setIsProcessing(true);
    setProcessingStep("GENERANDO REPORTE DE SALIDA...");
    try {
      const doc = new jsPDF();
      let y = applyLegalTemplate(doc, "Cierre de Registro", 1);
      doc.setFont("helvetica", "bold");
      doc.text("REPORTE DE SALIDA OFICIAL", 20, y);
      y += 15;
      doc.text(`ARTISTA: ${formData.fullName}`, 25, y);
      doc.text(`HORA: ${getFullTimestamp()}`, 120, y);
      const pdfBlob = doc.output('blob');
      doc.save(`SALIDA_VIP_${formData.documentNumber}.pdf`);
      const link = await uploadPdfToCloud(pdfBlob);
      if (window.emailjs) {
        await window.emailjs.send(APP_CONFIG.EMAILJS.SERVICE_ID, APP_CONFIG.EMAILJS.TEMPLATE_ID, {
          to_email: APP_CONFIG.RECIPIENT_EMAIL,
          full_name: formData.fullName,
          doc_number: formData.documentNumber,
          download_link: link,
          pdf_link: link,
          name: formData.fullName,
          message: `SALIDA CONFIRMADA: El artista ha abandonado el club.`
        });
      }
    } catch (e) { console.error(e); } finally {
      localStorage.removeItem('st_club_active');
      setIsProcessing(false);
      setShowFinished(true);
      setIsSessionActive(false);
    }
  };

  const resetAll = () => {
    localStorage.removeItem('st_club_active');
    setShowFinished(false);
    setIsSessionActive(false);
    setFormData({ fullName: '', documentType: DocumentType.CedulaDeCiudadania, documentNumber: '', artisticName: '', });
    setTermsAccepted(false);
    setIsSigned(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem('st_club_active');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.active) {
          setIsSessionActive(true);
          setFormData(data.formData);
          setTermsAccepted(true);
        }
      } catch (e) { localStorage.removeItem('st_club_active'); }
    }
    if (window.emailjs) window.emailjs.init(APP_CONFIG.EMAILJS.PUBLIC_KEY);
  }, []);

  if (showFinished) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 font-orbitron">
      <div className="max-w-md w-full bg-zinc-900 border border-violet-500/30 p-12 rounded-[3rem] text-center shadow-2xl">
        <div className="w-24 h-24 bg-violet-500/10 text-violet-500 rounded-full flex items-center justify-center mx-auto mb-10 text-5xl border border-violet-500/20">✓</div>
        <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter neon-text">OPERACIÓN EXITOSA</h2>
        <p className="text-zinc-500 text-[10px] mb-12 tracking-[0.3em] uppercase font-bold">Registro de salida completado.</p>
        <button onClick={resetAll} className="w-full py-6 bg-white text-black font-black rounded-2xl uppercase text-[11px] tracking-[0.3em] hover:bg-violet-600 hover:text-white transition-all transform hover:scale-105 shadow-xl">Nuevo Registro</button>
      </div>
    </div>
  );

  if (isSessionActive) return (
    <>
      <ParticleBackground />
      {isProcessing && <ProcessingOverlay step={processingStep} />}
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-2xl w-full bg-zinc-950/70 border border-violet-500/20 p-12 rounded-[4.5rem] backdrop-blur-3xl shadow-2xl">
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-black font-orbitron text-white mb-3 tracking-tighter neon-text">VIP ACTIVO</h2>
            <div className="w-24 h-1 bg-violet-600 mx-auto mb-8 rounded-full shadow-[0_0_15px_#8b5cf6]"></div>
            <p className="text-[16px] text-white font-black tracking-[0.2em] uppercase mb-2">{formData.fullName}</p>
            <p className="text-[10px] text-violet-400 font-bold tracking-[0.4em] uppercase opacity-80">ID: {formData.documentNumber}</p>
          </div>
          <div className="py-24 px-10 bg-black/40 border border-zinc-900 rounded-[3.5rem] mb-14">
             <div className="text-violet-500 text-6xl mb-8 animate-pulse">✦</div>
             <p className="text-white text-[12px] font-black uppercase tracking-[0.5em] leading-loose">
               Bienvenido a Space Town Club.<br/>Tu identidad ha sido verificada legalmente.<br/>Disfruta la experiencia.
             </p>
          </div>
          <button onClick={handleFinishSession} className="w-full py-8 bg-red-600 text-white font-black font-orbitron rounded-[2.5rem] uppercase tracking-[0.4em] text-[12px] hover:bg-red-500 transition-all shadow-2xl active:scale-95 border border-red-500/50">Cerrar Registro Oficial</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <ParticleBackground />
      {isProcessing && <ProcessingOverlay step={processingStep} />}
      {!termsAccepted ? <TermsModal onAccept={() => setTermsAccepted(true)} /> : (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-10">
          <div className="max-w-4xl w-full bg-zinc-950/80 border border-zinc-900 p-8 sm:p-20 rounded-[5rem] shadow-2xl relative overflow-hidden">
            <header className="text-center mb-16">
              <h1 className="text-5xl sm:text-7xl font-black font-orbitron text-white uppercase tracking-tighter neon-text">{APP_CONFIG.CLUB_NAME}</h1>
              <p className="text-[10px] text-zinc-500 font-bold tracking-[0.8em] uppercase mt-6">Protocolo de Registro Legal de Artistas</p>
            </header>
            <form onSubmit={handleStartSession} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-2">Nombre Completo</label>
                  <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value.toUpperCase()})} className="w-full px-7 py-5 bg-zinc-900/50 border border-zinc-800 text-white rounded-2xl font-bold uppercase focus:border-violet-600 outline-none transition-all" placeholder="NOMBRE Y APELLIDOS" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-2">Nombre Artístico</label>
                  <input type="text" value={formData.artisticName} onChange={e => setFormData({...formData, artisticName: e.target.value.toUpperCase()})} className="w-full px-7 py-5 bg-zinc-900/50 border border-zinc-800 text-white rounded-2xl font-bold uppercase focus:border-violet-600 outline-none transition-all" placeholder="ALIAS ARTÍSTICO" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-2">Tipo de Documento</label>
                  <select value={formData.documentType} onChange={e => setFormData({...formData, documentType: e.target.value as DocumentType})} className="w-full px-7 py-5 bg-zinc-900/50 border border-zinc-800 text-white rounded-2xl font-bold uppercase focus:border-violet-600 outline-none transition-all cursor-pointer">
                    {Object.values(DocumentType).map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-2">Identificación (ID)</label>
                  <input type="text" value={formData.documentNumber} onChange={e => setFormData({...formData, documentNumber: e.target.value.toUpperCase()})} className="w-full px-7 py-5 bg-zinc-900/50 border border-zinc-800 text-white rounded-2xl font-bold uppercase focus:border-violet-600 outline-none transition-all" placeholder="NÚMERO DE ID" required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {[{ k: 'selfie', l: 'Foto Rostro' }, { k: 'documentFront', l: 'ID Frontal' }, { k: 'documentBack', l: 'ID Reverso' }].map(item => (
                  <button key={item.k} type="button" onClick={() => { setCameraFor(item.k as any); setIsCameraModalOpen(true); }} className={`p-10 border-2 rounded-[2.5rem] transition-all flex flex-col items-center group relative overflow-hidden ${formData[item.k as keyof FormState] ? 'bg-violet-900/10 border-violet-600 shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-zinc-900/30 border-zinc-800'}`}>
                    <span className="text-[8px] font-black uppercase text-zinc-600 mb-4 tracking-widest">{item.l}</span>
                    <div className="text-3xl text-white">{formData[item.k as keyof FormState] ? '✓' : '+'}</div>
                  </button>
                ))}
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-2">Firma de Consentimiento Legal</label>
                  <button 
                    type="button" 
                    onClick={() => {
                      signaturePadRef.current?.clear();
                      setIsSigned(false);
                    }}
                    className="text-[8px] font-black text-violet-500 uppercase tracking-widest hover:text-white transition-colors"
                  >
                    [ Borrar Firma ]
                  </button>
                </div>
                <div className="h-60 bg-black/60 border border-zinc-800 rounded-[3rem] relative overflow-hidden focus-within:border-violet-600 transition-all shadow-inner">
                  <SignaturePad ref={signaturePadRef} onDrawStart={() => setIsSigned(true)} />
                </div>
              </div>
              <button type="submit" className="w-full py-8 bg-white text-black font-black font-orbitron rounded-[2.5rem] uppercase tracking-[0.5em] text-[12px] hover:bg-violet-600 hover:text-white transition-all shadow-2xl active:scale-[0.98]">Firmar Contrato y Acceder</button>
            </form>
          </div>
        </div>
      )}
      <CameraModal isOpen={isCameraModalOpen} onClose={() => setIsCameraModalOpen(false)} onCapture={async f => { 
        const b64 = await fileToBase64(f);
        setFormData(p => ({...p, [cameraFor!]: b64})); 
        setIsCameraModalOpen(false); 
      }} purpose={cameraFor} />
    </>
  );
};

export default App;
