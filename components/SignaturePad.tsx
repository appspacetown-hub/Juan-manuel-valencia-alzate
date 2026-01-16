import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';

type Point = {
  x: number;
  y: number;
};

export type SignaturePadRef = {
  clear: () => void;
  getSignature: () => string | undefined;
};

interface SignaturePadProps {
  onDrawStart: () => void;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const configureCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const { width, height } = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    context.scale(dpr, dpr);

    // Firma en color platino con ligero brillo
    context.strokeStyle = '#e4e4e7'; 
    context.lineWidth = 2.5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.shadowBlur = 4;
    context.shadowColor = 'rgba(255, 255, 255, 0.2)';
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(configureCanvas, 50);
    window.addEventListener('resize', configureCanvas);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', configureCanvas);
    };
  }, [configureCanvas]);

  const getCoordinates = (event: MouseEvent | TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else return null;

    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = useCallback((event: MouseEvent | TouchEvent) => {
    if (event.cancelable) event.preventDefault();
    const coords = getCoordinates(event);
    if (!coords) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    context.beginPath();
    context.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    props.onDrawStart();
  }, [props.onDrawStart]);

  const draw = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDrawing) return;
    if (event.cancelable) event.preventDefault();
    const coords = getCoordinates(event);
    if (!coords) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    context.lineTo(coords.x, coords.y);
    context.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [startDrawing, draw, stopDrawing]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (canvas && context) {
        const { width, height } = canvas.getBoundingClientRect();
        context.clearRect(0, 0, width, height);
      }
    },
    getSignature: () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext('2d');
        if (!context) return undefined;
        const pixelBuffer = new Uint32Array(context.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
        const hasContent = pixelBuffer.some(color => color !== 0);
        return hasContent ? canvas.toDataURL('image/png') : undefined;
      }
      return undefined;
    }
  }));

  return <canvas ref={canvasRef} className="w-full h-full cursor-crosshair touch-none" />;
});

export default SignaturePad;