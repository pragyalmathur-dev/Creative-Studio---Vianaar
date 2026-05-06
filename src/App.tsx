import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import Layout from './components/Layout';
import AdminDashboard from './components/dashboard/AdminDashboard';
import SalesDashboard from './components/dashboard/SalesDashboard';
import CreativeEditor from './components/editor/CreativeEditor';
import { Template } from './types';
import { LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { user, profile, loading, signIn, loginWithEmail } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [portal, setPortal] = useState<'admin' | 'user' | null>(null);
  const [authMode, setAuthMode] = useState<'options' | 'login'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password@123');
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="font-serif text-3xl font-bold text-brand-primary animate-pulse">VIANAAR</span>
          <div className="w-12 h-0.5 bg-brand-primary/20 overflow-hidden">
            <div className="h-full bg-brand-primary animate-[loading_1s_infinite]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-cream flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square rounded-full bg-brand-light/20 blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square rounded-full bg-brand-accent-2/10 blur-3xl"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white shadow-2xl border border-neutral-sand relative z-10 overflow-hidden"
        >
          <div className="p-12">
            <div className="text-center mb-12">
              <span className="font-serif text-5xl font-black text-brand-primary tracking-tighter">VIANAAR</span>
              <div className="flex items-center justify-center gap-2 mt-4">
                 <div className="h-[1px] w-8 bg-neutral-sand"></div>
                 <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-black/40">CREATIVE TERMINAL</span>
                 <div className="h-[1px] w-8 bg-neutral-sand"></div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {authMode === 'options' ? (
                <motion.div 
                  key="options"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <p className="text-center text-xs uppercase tracking-widest font-bold text-neutral-black/40 mb-6">Select Access Portal</p>
                  <button 
                    onClick={() => { setPortal('admin'); setAuthMode('login'); }}
                    className="w-full group flex items-center justify-between p-6 bg-white border border-neutral-sand hover:border-brand-primary transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-brand-primary/10 rounded flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                        <LogIn size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-neutral-black">Admin Portal</p>
                        <p className="text-[10px] text-neutral-black/40 uppercase tracking-wider font-semibold">Governance & Oversight</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-neutral-black/20 group-hover:text-brand-primary transition-all group-hover:translate-x-1" />
                  </button>

                  <button 
                    onClick={() => { setPortal('user'); setAuthMode('login'); }}
                    className="w-full group flex items-center justify-between p-6 bg-white border border-neutral-sand hover:border-brand-primary transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-brand-accent-2/10 rounded flex items-center justify-center text-brand-accent-4 group-hover:bg-brand-accent-2 group-hover:text-white transition-colors">
                        <LogIn size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-neutral-black">User Portal</p>
                        <p className="text-[10px] text-neutral-black/40 uppercase tracking-wider font-semibold">Sales Member Access</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-neutral-black/20 group-hover:text-brand-accent-2 transition-all group-hover:translate-x-1" />
                  </button>
                </motion.div>
              ) : (
                <motion.form 
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleLogin}
                  className="space-y-6"
                >
                  <button 
                    type="button"
                    onClick={() => { setAuthMode('options'); setError(null); }}
                    className="text-[10px] uppercase font-bold tracking-widest text-neutral-black/40 hover:text-brand-primary flex items-center gap-2 mb-4"
                  >
                    ← Back to selection
                  </button>
                  
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-brand-dark mb-1">
                      {portal === 'admin' ? 'Administrative' : 'Sales Member'} Login
                    </h2>
                    <p className="text-xs text-neutral-black/50 font-medium">Please enter your authorized identity credentials.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-neutral-black/40 tracking-widest">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-neutral-grey border-b-2 border-transparent focus:border-brand-primary p-3 text-sm outline-none transition-all"
                        placeholder="identity@vianaar.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-neutral-black/40 tracking-widest">Access Passcode</label>
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-neutral-grey border-b-2 border-transparent focus:border-brand-primary p-3 text-sm outline-none transition-all"
                        placeholder="••••••••"
                      />
                      <p className="text-[9px] text-neutral-black/30 mt-1 italic">Default: password@123</p>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-brand-accent-3/10 border-l-4 border-brand-accent-3 text-[10px] text-brand-accent-3 font-bold">
                      {error}
                    </div>
                  )}

                  <button 
                    disabled={authLoading}
                    type="submit"
                    className="w-full bg-brand-primary text-white py-4 font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-brand-dark transition-all transform hover:scale-[1.02] shadow-lg disabled:bg-neutral-grey disabled:scale-100"
                  >
                    {authLoading ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div> : <ShieldCheck size={18} />}
                    Authorize Access
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
          <div className="bg-neutral-grey/30 py-4 text-center border-t border-neutral-sand">
            <span className="text-[9px] text-neutral-black/30 font-bold uppercase tracking-[0.3em]">Secure Data Node Active</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <Layout>
      {selectedTemplate ? (
        <CreativeEditor 
          template={selectedTemplate} 
          onBack={() => setSelectedTemplate(null)} 
        />
      ) : (
        <>
          {profile?.role === 'admin' ? (
            <AdminDashboard />
          ) : (
            <SalesDashboard onSelectTemplate={setSelectedTemplate} />
          )}
        </>
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
