'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  Auth,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Define available avatars
const DEFAULT_AVATARS = [
  '/avatars/1.jpeg',
  '/avatars/2.jpeg',
  '/avatars/3.jpeg',
  '/avatars/4.jpeg',
  '/avatars/5.jpeg',
  '/avatars/6.jpeg'
];

export interface User extends Omit<FirebaseUser, 'toJSON'> {
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateUserProfile: (updatedUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface UserData {
  email: string | null;
  avatarUrl: string;
  createdAt: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get and set the token in cookies
          const token = await firebaseUser.getIdToken();
          document.cookie = `firebase-token=${token}; path=/`;

          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : null;
          
          setUser({
            ...firebaseUser,
            avatarUrl: userData?.avatarUrl || '/avatars/1.jpeg'
          } as User);
          
          if (!userDoc.exists()) {
            // Create user document with default avatar if it doesn't exist
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              email: firebaseUser.email,
              avatarUrl: '/avatars/1.jpeg',
              createdAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        // Clear the token cookie when user logs out
        document.cookie = 'firebase-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Create user document with default avatar
    const randomAvatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: userCredential.user.email,
      avatarUrl: randomAvatar,
      createdAt: new Date().toISOString()
    });
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) {
      // Create user document with default avatar
      const randomAvatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        avatarUrl: randomAvatar,
        createdAt: new Date().toISOString()
      });
    }
  };

  const updateUserProfile = async (updatedUser: User): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      // Update local state FIRST for immediate UI update
      const newUser = {
        ...user,
        avatarUrl: updatedUser.avatarUrl
      } as User;
      
      setUser(newUser);

      // Then update Firestore in the background
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        avatarUrl: updatedUser.avatarUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });

    } catch (error) {
      // If Firestore update fails, revert the local state
      setUser(user);
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
    signUp,
    signOut: () => firebaseSignOut(auth),
    signInWithGoogle,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 