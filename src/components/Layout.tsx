import React from 'react';
import { useAuth } from './AuthProvider';
import { LogOut, User as UserIcon, Layout as LayoutIcon, History } from 'lucide-react';
import { motion } from 'motion/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();

  if (!profile) return <>{children}</>;

  return (
    <div className="min-h-screen bg-neutral-cream flex flex-col">
      <header className="bg-white border-b border-neutral-sand px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-brand-primary tracking-tight">VIANAAR</span>
          <div className="h-4 w-[1px] bg-neutral-sand mx-2 hidden sm:block"></div>
          <span className="text-xs uppercase tracking-widest text-neutral-black/60 hidden sm:block font-medium">Creative Editor</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end text-right">
            <span className="text-sm font-semibold">{profile.displayName || 'User'}</span>
            <span className="text-[10px] uppercase tracking-wider text-brand-primary font-bold">{profile.role}</span>
          </div>
          <button 
            onClick={() => logout()}
            className="p-2 hover:bg-neutral-grey rounded-full transition-colors text-neutral-black/70 hover:text-brand-accent-3"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>

      <footer className="py-8 text-center text-xs text-neutral-black/40 font-medium">
        &copy; {new Date().getFullYear()} VIANAAR. All Rights Reserved. Built for Excellence.
      </footer>
    </div>
  );
}
