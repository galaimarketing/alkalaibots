'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/auth/AuthForm';
import BackgroundEffect from '@/components/BackgroundEffect';

export default function Signup() {
  const [error, setError] = useState('');
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    try {
      await signUp(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to create account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen">
      <BackgroundEffect />
      <div className="relative z-10">
        <AuthForm mode="signup" onSubmit={handleSubmit} error={error} />
      </div>
    </div>
  );
} 