import React, { useRef, useEffect } from 'react';

const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };

    class Particle {
      x: number;
      y: number;
      radius: number;
      baseRadius: number;
      vx: number;
      vy: number;
      color: string;
      angle: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseRadius = Math.random() * 1.5 + 0.5;
        this.radius = this.baseRadius;
        this.vx = Math.random() * 0.4 - 0.2;
        this.vy = Math.random() * 0.4 - 0.2;
        this.color = `rgba(255, 255, 255, ${Math.random() * 0.4 + 0.1})`;
        this.angle = Math.random() * Math.PI * 2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Add a subtle pulsing effect to the radius
        this.angle += 0.02;
        this.radius = this.baseRadius + Math.sin(this.angle) * 0.3;

        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) this.vx *= -1;
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) this.vy *= -1;
      }

      draw() {
        if(!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      let particleCount = Math.floor((canvas.width * canvas.height) / 25000);
      if (particleCount > 120) particleCount = 120;
      if (particleCount < 40) particleCount = 40;

      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };
    
    const animate = () => {
      if(!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
        resizeCanvas();
        init();
    };

    window.addEventListener('resize', handleResize);
    resizeCanvas();
    init();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 -z-10" />;
};

export default ParticleBackground;
