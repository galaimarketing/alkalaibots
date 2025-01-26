'use client';

import dynamic from 'next/dynamic';
import BackgroundEffect from '@/components/BackgroundEffect';

const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });

export default function About() {
  return (
    <div className="min-h-screen">
      <BackgroundEffect />
      <Navbar />
      <main className="relative z-10 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-8">About AlkalaiBots</h1>
            
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
              <p className="text-gray-400 mb-6">
                At AlkalaiBots, we're on a mission to revolutionize how businesses interact with their customers through intelligent AI solutions. Based in Riyadh, we're proud to be at the forefront of Saudi Arabia's technological transformation.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">Our Story</h2>
              <p className="text-gray-400 mb-6">
                Founded in 2024, AlkalaiBots emerged from a simple observation: businesses needed a better way to engage with their customers 24/7. Our team of AI experts and developers came together to create an intelligent solution that combines cutting-edge technology with ease of use.
              </p>
              <p className="text-gray-400 mb-6">
                Today, we're helping businesses across Saudi Arabia and the Middle East transform their customer service operations with AI-powered assistants that understand context, learn from interactions, and provide meaningful support.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">Our Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0d1117] p-6 rounded-lg border border-[#1e293b]">
                  <h3 className="text-xl font-bold text-white mb-3">Innovation</h3>
                  <p className="text-gray-400">Constantly pushing the boundaries of what's possible with AI technology.</p>
                </div>
                <div className="bg-[#0d1117] p-6 rounded-lg border border-[#1e293b]">
                  <h3 className="text-xl font-bold text-white mb-3">Excellence</h3>
                  <p className="text-gray-400">Committed to delivering the highest quality solutions to our clients.</p>
                </div>
                <div className="bg-[#0d1117] p-6 rounded-lg border border-[#1e293b]">
                  <h3 className="text-xl font-bold text-white mb-3">Trust</h3>
                  <p className="text-gray-400">Building lasting relationships through transparency and reliability.</p>
                </div>
                <div className="bg-[#0d1117] p-6 rounded-lg border border-[#1e293b]">
                  <h3 className="text-xl font-bold text-white mb-3">Impact</h3>
                  <p className="text-gray-400">Making a real difference in how businesses serve their customers.</p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">Our Achievements</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-[#0d1117] p-6 rounded-lg border border-[#1e293b]">
                  <div className="text-3xl font-bold text-blue-500 mb-2">500+</div>
                  <p className="text-gray-400">Businesses Empowered</p>
                </div>
                <div className="bg-[#0d1117] p-6 rounded-lg border border-[#1e293b]">
                  <div className="text-3xl font-bold text-blue-500 mb-2">1M+</div>
                  <p className="text-gray-400">Customer Interactions</p>
                </div>
                {/* Add more achievement stats */}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 