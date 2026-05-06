import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, query, collection, where, getDocs, deleteDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const data = profileSnap.data() as UserProfile;
          if (user.email === 'pragyalmathur@gmail.com' && data.role !== 'admin') {
            await setDoc(profileRef, { role: 'admin' }, { merge: true });
            data.role = 'admin';
          }
          setProfile(data);
        } else {
          // Check if they are in the pre-registered list
          const q = query(collection(db, 'profiles'), where('email', '==', user.email));
          const querySnap = await getDocs(q);
          
          if (!querySnap.empty) {
            const existingData = querySnap.docs[0].data();
            const existingId = querySnap.docs[0].id;
            
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              role: existingData.role || 'sales',
              displayName: user.displayName || existingData.displayName || ''
            };
            
            await setDoc(profileRef, {
              ...newProfile,
              claimedAt: serverTimestamp()
            });
            
            if (existingId !== user.uid) {
              await deleteDoc(doc(db, 'profiles', existingId));
            }
            
            setProfile(newProfile);
          } else {
            // User logged in but no profile found in directory (Revoked or never added)
            if (user.email !== 'pragyalmathur@gmail.com') {
              console.warn("Access revoked or not authorized.");
              await signOut(auth);
              setProfile(null);
            } else {
              // Create root admin profile
              const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                role: 'admin',
                displayName: user.displayName || 'Root Admin'
              };
              await setDoc(profileRef, {
                ...newProfile,
                createdAt: serverTimestamp()
              });
              setProfile(newProfile);
            }
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        throw new Error("Invalid credentials. If you haven't set a password yet, please use the Register option.");
      }
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string) => {
    // Check if email is in allowlist
    const q = query(collection(db, 'profiles'), where('email', '==', email.toLowerCase().trim()));
    const snap = await getDocs(q);
    
    if (snap.empty && email !== 'pragyalmathur@gmail.com') {
      throw new Error("Access Denied: This email ID is not recognized by the Vianaar Directory.");
    }
    
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("This account already exists. Please use the Login option instead.");
      }
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, loginWithEmail, registerWithEmail, logout }}>
      {children}
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
