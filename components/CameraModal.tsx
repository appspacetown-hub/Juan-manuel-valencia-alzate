
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  purpose: 'selfie' | 'documentFront' | 'documentBack' | null;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture, purpose }) => {
  // Use a ref for the stream to avoid dependency loops in useEffect
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isSelfie = purpose === 'selfie';
  const isDocument = purpose === 'documentFront' || purpose === 'documentBack';
  const facingMode = isSelfie ? 'user' : 'environment';

  let title = 'Tomar Foto';
  let capturedTitle = 'Previsualización';
  let altText = 'Foto capturada';
  let fileName = 'captura.png';

  if (isSelfie) {
    title = 'Tómate una Selfie';
    capturedTitle = 'Previsualización de Selfie';
    altText = 'Selfie capturada';
    fileName = 'selfie_capturada.png';
  } else if (isDocument) {
    const side = purpose === 'documentFront' ? 'Frontal' : 'Reverso';
    title = `Foto del Documento (${side})`;
    capturedTitle = `Previsualización del Documento (${side})`;
    altText = `Documento (${side}) capturado`;
    fileName = `documento_${side.toLowerCase()}.png`;
  }

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    // Ensure any previous stream is stopped
    stopCamera();
    
    setCapturedImage(null);
    setError(null);

    try {
      let mediaStream: MediaStream;
      
      try {
        // First attempt: Try with specific facingMode
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false,
        });
      } catch (err) {
        console.warn(`Failed to start camera with facingMode: ${facingMode}. Retrying with any available video source.`);
        // Fallback: Try any video source if the specific one fails (common on some devices/browsers)
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
        });
      }

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError('Permiso de cámara denegado. Por favor, habilítalo en la configuración de tu navegador.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
             setError('No se encontró ninguna cámara en este dispositivo.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
             setError('No se pudo acceder a la cámara. Es posible que esté siendo usada por otra aplicación.');
        } else {
            setError(`No se pudo iniciar la cámara: ${err.message}`);
        }
      } else {
        setError('Ocurrió un error desconocido al acceder a la cámara.');
      }
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    
    // Cleanup function to stop camera when component unmounts or modal closes
    return () => {
        stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Check if video is actually playing/ready
      if (video.videoWidth === 0 || video.videoHeight === 0) {
          return; 
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        if (isSelfie) {
          context.translate(video.videoWidth, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      }
      setCapturedImage(canvas.toDataURL('image/png'));
      // We don't necessarily need to stop the camera here if we want to allow "Retake" quickly,
      // but stopping it saves battery. The original logic stopped it.
      stopCamera();
    }
  };
  
  const handleRetake = () => {
      startCamera();
  };

  const handleUsePhoto = () => {
    if (canvasRef.current) {
        canvasRef.current.toBlob(blob => {
            if (blob) {
                const imageFile = new File([blob], fileName, { type: 'image/png' });
                onCapture(imageFile);
            }
        }, 'image/png');
    }
  };
  
  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-black/80 backdrop-blur-md border border-gray-700 p-6 rounded-2xl shadow-2xl shadow-white/10 w-full max-w-lg text-center">
        <h2 className="text-xl font-bold text-white mb-4" style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.4)' }}>
          {capturedImage ? capturedTitle : title}
        </h2>
        
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-4 border border-gray-700">
          {error ? (
              <div className="flex items-center justify-center h-full text-white font-bold px-4 text-center">{error}</div>
          ) : capturedImage ? (
            <img src={capturedImage} alt={altText} className="w-full h-full object-contain" />
          ) : (
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className={`w-full h-full object-contain ${isSelfie ? 'transform -scale-x-100' : ''}`}
                onLoadedMetadata={() => {
                    // Ensure video plays once metadata is loaded (sometimes needed on mobile)
                    videoRef.current?.play().catch(e => console.log("Play error", e));
                }}
            ></video>
          )}
           <canvas ref={canvasRef} className="hidden"></canvas>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {error ? (
             <div className="flex gap-2 w-full justify-center">
                <button onClick={handleClose} className="w-full sm:w-auto px-6 py-2 text-black font-semibold bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.6)] hover:shadow-[0_0_20px_rgba(255,255,255,0.8)] transition-all transform hover:scale-105">Cerrar</button>
                <button onClick={handleRetake} className="w-full sm:w-auto px-6 py-2 text-white font-semibold bg-transparent border border-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)] hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all transform hover:scale-105">Reintentar</button>
             </div>
          ) : capturedImage ? (
            <>
              <button onClick={handleRetake} className="w-full sm:w-auto px-6 py-2 text-white font-semibold bg-transparent border border-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)] hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all transform hover:scale-105">
                Tomar de Nuevo
              </button>
              <button onClick={handleUsePhoto} className="w-full sm:w-auto px-6 py-2 text-black font-semibold bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.6)] hover:shadow-[0_0_20px_rgba(255,255,255,0.8)] transition-all transform hover:scale-105">
                Usar esta Foto
              </button>
            </>
          ) : (
            <>
              <button onClick={handleClose} className="w-full sm:w-auto px-6 py-2 text-white font-semibold bg-transparent border border-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)] hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all transform hover:scale-105">
                Cancelar
              </button>
              <button onClick={handleCapture} className="w-full sm:w-auto px-6 py-2 text-black font-semibold bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.6)] hover:shadow-[0_0_20px_rgba(255,255,255,0.8)] transition-all transform hover:scale-105">
                Capturar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
