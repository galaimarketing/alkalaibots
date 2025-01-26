'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { User } from '@/contexts/AuthContext';
import BackgroundEffect from '@/components/BackgroundEffect';

const avatars = [
  '/avatars/1.jpeg',
  '/avatars/2.jpeg',
  '/avatars/3.jpeg',
  '/avatars/4.jpeg',
  '/avatars/5.jpeg',
  '/avatars/6.jpeg',
  '/avatars/7.jpeg',
];

export default function SettingsPage() {
  const { user, updateUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [displayAvatar, setDisplayAvatar] = useState<string>('/avatars/1.jpeg');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.avatarUrl) {
      setDisplayAvatar(user.avatarUrl);
    }
  }, [user?.avatarUrl]);

  const handleAvatarChange = async (avatar: string) => {
    if (!user || updating) return;
    
    setDisplayAvatar(avatar);
    setUpdating(true);

    try {
      const updatedUser = {
        ...user,
        avatarUrl: avatar
      } as User;
      
      await updateUserProfile(updatedUser);
      toast.success('Avatar updated successfully!');
    } catch (error) {
      setDisplayAvatar(user.avatarUrl || '/avatars/1.jpeg');
      console.error('Error updating avatar:', error);
      toast.error('Failed to update avatar');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success('Password reset email sent! Please check your inbox.');
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <BackgroundEffect />
      <div className="relative z-10 p-4 sm:p-6">
        <div className="space-y-8 max-w-4xl">
          {/* Profile Settings */}
          <div className="bg-[#0d1117] rounded-lg p-6 border border-[#1e293b]">
            <h2 className="text-xl font-semibold text-white mb-4">Profile Settings</h2>
            <div className="space-y-6">
              {/* Avatar Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Profile Picture</label>
                <div className="flex gap-4 flex-wrap">
                  {avatars.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => handleAvatarChange(avatar)}
                      disabled={updating}
                      className={`relative rounded-full overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all
                        ${displayAvatar === avatar ? 'ring-2 ring-blue-500' : ''}
                      `}
                    >
                      <Image
                        src={avatar}
                        alt="Avatar option"
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Password Reset Section */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Password Settings</label>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">
                    To change your password, we'll send a password reset link to your email address: {user?.email}
                  </p>
                  <button
                    onClick={handlePasswordReset}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Reset Link...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send Password Reset Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}