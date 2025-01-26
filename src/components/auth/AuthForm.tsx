'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import GoogleAuthButton from '@/components/GoogleAuthButton';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onSubmit: (email: string, password: string) => void;
  error?: string;
}

export default function AuthForm({ mode, onSubmit, error }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/logomark.png"
              alt="AlkalaiBots Logo"
              width={64}
              height={64}
              className="mx-auto"
            />
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-white">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <Link href="/signup" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/10">
          <div className="space-y-6">
            <GoogleAuthButton />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#0a0a0a] text-gray-400">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 bg-transparent border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all backdrop-blur-sm"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 bg-transparent border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all backdrop-blur-sm"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600/80 to-blue-400/80 text-white px-6 py-3 rounded-xl text-lg font-medium backdrop-blur-sm hover:from-blue-600/90 hover:to-blue-400/90 transition-all shadow-xl shadow-blue-500/20"
              >
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 