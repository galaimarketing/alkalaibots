'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import Hero from '@/components/Hero';
import BackgroundEffect from '@/components/BackgroundEffect';
import Footer from '@/components/Footer';
import { useState } from 'react';

// Dynamic imports for components
const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false });

export default function Home() {
  const [isOfferExpired, setIsOfferExpired] = useState(true); // Set to true to show as expired

  return (
    <div className="min-h-screen">
      <BackgroundEffect />
      <div className="relative z-10">
        <Navbar />
        <Hero />

        {/* Content wrapper to ensure proper z-index */}
        <div className="relative z-10">
          {/* Features Section */}
          <section id="features" className="relative py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
                <p className="text-xl text-gray-400">Everything you need to create amazing AI assistants</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Instant Results Card */}
                <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600/80 to-blue-400/80 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Instant Results</h3>
                  <p className="text-gray-300">Convert 80% of visitors into customers with AI that never sleeps 24/7.</p>
                </div>

                {/* Sales Machine Card */}
                <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600/80 to-blue-400/80 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Sales Machine</h3>
                  <p className="text-gray-300">AI that learns your business and closes deals with customers automatically.</p>
                </div>

                {/* ROI Tracking Card */}
                <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600/80 to-blue-400/80 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">ROI Tracking</h3>
                  <p className="text-gray-300">Watch your revenue grow with real-time conversions & bookings analytics.</p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="relative py-24 bg-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
                <p className="text-xl text-gray-400">Get started in just a few simple steps</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600/80 to-blue-400/80 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <span className="text-2xl font-bold text-white">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Sign Up</h3>
                  <p className="text-gray-300">Create your account and access the dashboard.</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600/80 to-blue-400/80 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Train Your Bot</h3>
                  <p className="text-gray-300">Upload your data and customize bot behavior.</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600/80 to-blue-400/80 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Integrate</h3>
                  <p className="text-gray-300">Add the chatbot to your website with one line of code.</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600/80 to-blue-400/80 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <span className="text-2xl font-bold text-white">4</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Go Live</h3>
                  <p className="text-gray-300">Launch your AI assistant and start selling more.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing" className="relative py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-white mb-4">Buy Once, Use Forever</h2>
                <p className="text-xl text-gray-400">Let our AI Assistant help you close more deals</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Free Plan */}
                <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 relative">
                  {/* Add expired banner */}
                  {isOfferExpired && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-500/80 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Offer Ended
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-2">Free</h3>
                  <div className="text-4xl font-bold text-white mb-4">$0</div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Only One AI Assistant
                    </li>
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      24/7 Availability
                    </li>
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Custom Branding
                    </li>
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Customizable AI Behavior
                    </li>
                    {/* ... other list items */}
                  </ul>
                  <button
                    className={`w-full bg-gradient-to-r from-blue-600/80 to-blue-400/80 text-white py-3 rounded-xl font-medium backdrop-blur-sm transition-all ${isOfferExpired ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-600/90 hover:to-blue-400/90'
                      }`}
                    disabled={isOfferExpired}
                  >
                    Get Started
                  </button>
                </div>

                {/* Pro Plan */}
                <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-blue-500/20 relative">
                  {/* Popular badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-400 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-white mb-4">$79<span className="text-lg font-normal text-gray-400">/mo</span></div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      All Free features
                    </li>
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Unlimited AI Assistants
                    </li>
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Collect Warm Leads Data
                    </li>
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Track Conversations & Orders
                    </li>
                    {/* ... other list items */}
                  </ul>
                  <button className="w-full bg-gradient-to-r from-blue-600/80 to-blue-400/80 text-white py-3 rounded-xl font-medium backdrop-blur-sm hover:from-blue-600/90 hover:to-blue-400/90 transition-all">
                    Get Started
                  </button>
                </div>

                {/* Enterprise Plan */}
                <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 relative">
                  {/* Add enterprise banner */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600/80 to-purple-400/80 text-white px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                    Scale Without Limits
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                  <div className="text-4xl font-bold text-white mb-4">Custom</div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      All Pro features
                    </li>
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Fully Custom Solutions
                    </li>
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Revenue-Boosting Features
                    </li>
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Data Ownership and Security
                    </li>
                    {/* ... other list items */}
                  </ul>
                  <Link href="/contact" className="block">
                    <button className="w-full bg-white/5 text-white py-3 rounded-xl font-medium backdrop-blur-sm hover:bg-white/10 transition-all border border-white/10">
                      Contact Sales
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>

        <Footer />
      </div>
    </div>
  );
}
