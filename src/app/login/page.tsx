'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/auth/AuthForm';
import BackgroundEffect from '@/components/BackgroundEffect';

export default function Login() {
  const [error, setError] = useState('');
  const router = useRouter();
  const { signIn, user } = useAuth();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  useEffect(() => {
    if (user) {
      router.replace(redirectPath || '/dashboard');
    }
  }, [user, router, redirectPath]);

  const handleSubmit = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      router.push(redirectPath || '/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen">
      <BackgroundEffect />
      <div className="relative z-10">
        <AuthForm mode="signin" onSubmit={handleSubmit} error={error} />
      </div>
    </div>
  );
} 