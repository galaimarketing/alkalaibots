'use client';

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserData {
  avatarUrl?: string;
}

export default function Navbar() {
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string>('/avatars/1.jpeg');

  useEffect(() => {
    if (user?.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
    }
  }, [user?.avatarUrl]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Spacer div to prevent content from going under navbar */}
      <div className="h-20" />
      
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="hover:opacity-90 transition-opacity">
                <Image
                  src="/logo.png"
                  alt="AlkalaiBots"
                  width={100}
                  height={100}
                  priority
                />
              </Link>
            </div>

            <div className="hidden md:flex items-center justify-center flex-1 gap-8">
              <Link href="/#features" className="text-gray-300 hover:text-white transition-colors">Features</Link>
              <Link href="/#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</Link>
              <Link href="/#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link>
              <Link href="/about" className="text-gray-300 hover:text-white transition-colors">About</Link>
              <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link>
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-white/40 transition-colors"
                  >
                    <Image
                      src={avatarUrl}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-4 w-48 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-lg overflow-hidden">
                      <div className="py-1 divide-y divide-white/10">
                        <Link
                          href="/dashboard/settings"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-white/10 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-4 py-2 text-gray-300 hover:bg-white/10 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {user ? (
                <Link 
                  href="/dashboard" 
                  className="hidden md:block bg-gradient-to-r from-blue-600/80 to-blue-400/80 text-white px-6 py-2 rounded-xl font-medium backdrop-blur-sm hover:from-blue-600/90 hover:to-blue-400/90 transition-all shadow-lg shadow-blue-500/20"
                >
                  Dashboard
                </Link>
              ) : (
                <Link 
                  href="/login" 
                  className="bg-gradient-to-r from-blue-600/80 to-blue-400/80 text-white px-6 py-2 rounded-xl font-medium backdrop-blur-sm hover:from-blue-600/90 hover:to-blue-400/90 transition-all shadow-lg shadow-blue-500/20"
                >
                  Get Started
                </Link>
              )}

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden text-gray-300 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {showMobileMenu && (
            <div className="md:hidden py-4 border-t border-white/10 mt-2">
              <div className="flex flex-col gap-2">
                <Link href="/#features" className="text-gray-300 hover:text-white transition-colors px-4 py-2">Features</Link>
                <Link href="/#how-it-works" className="text-gray-300 hover:text-white transition-colors px-4 py-2">How It Works</Link>
                <Link href="/#pricing" className="text-gray-300 hover:text-white transition-colors px-4 py-2">Pricing</Link>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors px-4 py-2">About</Link>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors px-4 py-2">Contact</Link>
                {user && (
                  <Link 
                    href="/dashboard" 
                    className="mt-2 bg-gradient-to-r from-blue-600/80 to-blue-400/80 text-white px-4 py-2 rounded-xl font-medium backdrop-blur-sm hover:from-blue-600/90 hover:to-blue-400/90 transition-all shadow-lg shadow-blue-500/20"
                  >
                    Dashboard
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
} 