'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/AuthContext";
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function Hero() {
  const router = useRouter();
  const { user } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const calculateTransform = () => {
    // Move down as user scrolls, with a gentler movement
    const moveDown = Math.min(scrollY * 0.3, 150); // Limit the downward movement
    const translateY = window.innerWidth >= 640 ? moveDown - 150 : moveDown; // Adjust starting position for larger screens
    return translateY;
  };

  const calculateOpacity = () => {
    // Fade out more gradually
    return Math.max(0.4 - (scrollY * 0.0008), 0);
  };

  const handleGetStarted = () => {
    router.push(user ? '/dashboard' : '/login');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Robot Image */}
      <div 
        className="absolute top-1/5 -translate-y-2/3 left-1/2 w-full max-w-[800px] h-[600px] pointer-events-none"
        style={{
          transform: `translate(-50%, ${calculateTransform()})`,
          transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
          opacity: calculateOpacity()
        }}
      >
        <Image
          src="/backgrounds/Robot.png"
          alt="Robot Background"
          fill
          style={{ 
            objectFit: 'contain'
          }}
          priority
          className="select-none pointer-events-none"
        />
      </div>

      <div className="relative max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative z-10">
          <h1 className="text-5xl sm:text-7xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-purple-300">
          Turn Visitors Into Customers<br />While You Sleep
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            
            Close More Deals, Save Time, and Cut Costs <br /> with Our Smart Sales Assistants
          </p>
          <div className="relative z-20 flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-blue-600/80 to-blue-400/80 text-white px-10 py-4 rounded-xl text-lg font-medium backdrop-blur-sm hover:from-blue-600/90 hover:to-blue-400/90 transition-all shadow-xl shadow-blue-500/20"
            >
              {user ? 'Go to Dashboard' : 'Get Started →'}
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="bg-white/5 text-white px-10 py-4 rounded-xl text-lg font-medium backdrop-blur-sm hover:bg-white/10 transition-all border border-white/10"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
} 