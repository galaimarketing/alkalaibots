'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/AuthContext";

export default function GetStartedButton() {
  const router = useRouter();
  const { user } = useAuth();

  const handleClick = () => {
    router.push(user ? '/dashboard' : '/login');
  };

  return (
    <button
      onClick={handleClick}
      className="bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors"
    >
      {user ? 'Go to Dashboard' : 'Create Your Assistant'}
    </button>
  );
} 