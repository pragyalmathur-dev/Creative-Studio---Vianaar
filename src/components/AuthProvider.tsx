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
  updatePassword,
  sendPasswordResetEmail
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
  resetPassword: (email: string) => Promise<void>;
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
          
          // Ensure pragyalmathur@gmail.com is always super_admin if they exist
          if (user.email === 'pragyalmathur@gmail.com' && data.role !== 'super_admin') {
            await setDoc(profileRef, { role: 'super_admin', status: 'active' }, { merge: true });
            data.role = 'super_admin';
            data.status = 'active';
          }
          
          if (data.status === 'restricted') {
            await signOut(auth);
            setProfile(null);
            throw new Error("Your access to this portal has been restricted by a Super Admin.");
          }
          
          setProfile(data);
        } else {
          // Check if any admin exists at all
          const adminsQuery = query(collection(db, 'profiles'), where('role', 'in', ['admin', 'super_admin']));
          const adminsSnap = await getDocs(adminsQuery);
          
          if (adminsSnap.empty) {
            // FIRST USER EVER - Make them super admin
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              role: 'super_admin',
              status: 'active',
              displayName: user.displayName || 'Super Admin'
            };
            await setDoc(profileRef, {
              ...newProfile,
              createdAt: serverTimestamp()
            });
            setProfile(newProfile);
          } else {
            // Profile doesn't exist yet, check directory or requests
            const q = query(collection(db, 'profiles'), where('email', '==', user.email));
            const querySnap = await getDocs(q);
            
            if (!querySnap.empty) {
              const existingData = querySnap.docs[0].data();
              const existingId = querySnap.docs[0].id;
              
              const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                role: existingData.role || 'sales',
                status: existingData.status || 'active',
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
              // Not in directory, if they reached here via signup, they are a new request
              const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                role: 'admin', // Default to admin for requests
                status: 'pending',
                displayName: user.displayName || 'Pending Admin'
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
    const cleanEmail = email.toLowerCase().trim();
    try {
      // 1. Try to sign in
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
    } catch (error: any) {
      console.error("Auth error code:", error.code);
      
      // 2. Handle potential first-time login (Firebase returns invalid-credential or user-not-found)
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        const q = query(collection(db, 'profiles'), where('email', '==', cleanEmail));
        const snap = await getDocs(q);
        
        if (!snap.empty || cleanEmail === 'pragyalmathur@gmail.com') {
          // Authorized in directory: Try to register if they don't have an account
          try {
            await createUserWithEmailAndPassword(auth, cleanEmail, pass);
            return;
          } catch (regErr: any) {
            if (regErr.code === 'auth/email-already-in-use') {
              // Account exists. If they get here, the password was likely wrong.
              // Note: If they have a GOOGLE account with this email, they must use Google login.
              throw new Error("Incorrect passcode for this email. If you previously used 'Continue with Google', please use that again. Otherwise, use Reset Passcode.");
            }
            throw new Error("Initialization failed: " + regErr.message);
          }
        }
        throw new Error("Access Denied: Your email is not in the authorized directory. Please contact an admin.");
      }
      
      // 3. Handle other standard errors
      if (error.code === 'auth/wrong-password') {
        throw new Error("Incorrect passcode. Please check your credentials.");
      }
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.toLowerCase().trim();
    
    // 1. Check if first user
    const adminsQuery = query(collection(db, 'profiles'), where('role', 'in', ['admin', 'super_admin']));
    const adminsSnap = await getDocs(adminsQuery);
    
    if (adminsSnap.empty) {
      // Allow registration directly
      await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      return;
    }

    // 2. Not first user, check if already in directory or needs request
    const q = query(collection(db, 'profiles'), where('email', '==', cleanEmail));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      // In directory, allow registration
      await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    } else {
      // NOT in directory - This should technically be a "Registration Request"
      // But for simplicity in this flow, we will let them register the AUTH account
      // but their profile will be 'pending' if we change the create logic.
      // However, the user specifically asked for "Super admin approves register requests".
      
      // We will allow the account creation but the profile will be created as 'pending' 
      // in the onAuthStateChanged logic if we adjust it.
      
      await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      // We'll mark the profile as pending immediately after creation
      // This will happen in onAuthStateChanged if we add logic there.
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, loginWithEmail, registerWithEmail, resetPassword, logout }}>
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
