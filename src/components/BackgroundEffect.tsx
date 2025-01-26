'use client';

import { useEffect, useState } from 'react';

const floatingAnimation = `
  @keyframes floatEffect {
    0% {
      transform: translate(-50%, -60%);
    }
    50% {
      transform: translate(-50%, -65%);
    }
    100% {
      transform: translate(-50%, -60%);
    }
  }
`;

export default function BackgroundEffect() {
  const [starPositions, setStarPositions] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const generateStarPositions = () => {
      // Reduce number of stars for mobile
      const starCount = isMobile ? 5 : 8;
      const positions = Array.from({ length: starCount }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100
      }));

      const gradients = positions.map((pos, i) => {
        // Adjusted sizes for better mobile visibility
        const mobileSize = [0.8, 0.6, 0.7, 0.5, 0.6][i];
        const desktopSize = [0.8, 0.5, 0.6, 0.4, 0.5, 0.3, 0.4, 0.6][i];
        const size = isMobile ? mobileSize : desktopSize;
        return `radial-gradient(circle at ${pos.x}% ${pos.y}%, white ${size}px, transparent ${size}px)`;
      }).join(',\n');

      setStarPositions(gradients);
    };

    generateStarPositions();
    window.addEventListener('resize', generateStarPositions);
    return () => window.removeEventListener('resize', generateStarPositions);
  }, [isMobile]);

  return (
    <>
      <style jsx global>{floatingAnimation}</style>
      <div className="fixed inset-0 bg-[#0a0a0a] -z-10">
        <div className="absolute top-0 left-0 right-0 h-[70vh] overflow-hidden">
          <div 
            className="absolute top-0 left-1/2 w-[1400px] h-[800px] rounded-b-[100%] bg-gradient-to-b from-blue-500/25 via-blue-900/15 to-transparent"
            style={{
              filter: 'blur(20px)',
              animation: 'floatEffect 4s ease-in-out infinite'
            }}
          />
        </div>

        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: starPositions,
            backgroundSize: isMobile 
              ? '100px 100px, 90px 90px, 80px 80px, 70px 70px, 85px 85px'
              : '150px 150px, 120px 120px, 100px 100px, 80px 80px, 100px 100px, 90px 90px, 110px 110px, 130px 130px',
            backgroundPosition: isMobile
              ? '0 0, 30px 30px, -20px 40px, 50px -20px, -30px -40px'
              : '0 0, 30px 30px, -20px 40px, 50px -20px, -30px -40px, 60px 60px, -40px 80px, 70px -60px',
            opacity: isMobile ? '0.5' : '0.6'
          }} 
        />

        <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-blue-600/15 via-blue-500/5 to-transparent" />
      </div>
    </>
  );
} 