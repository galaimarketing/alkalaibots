'use client';

import { useAuth } from "@/contexts/AuthContext";
import dynamic from 'next/dynamic';
import Sidebar from '@/app/components/dashboard/Sidebar';
import BackgroundEffect from '@/components/BackgroundEffect';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <BackgroundEffect />
        <Navbar />
        <div className="relative z-10 flex">
          <Sidebar />
          <main className="pl-20 pt-6 pb-4 w-full max-w-7xl mx-auto px-4">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 