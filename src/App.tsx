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
  const { user, profile, loading, signIn, loginWithEmail, registerWithEmail, resetPassword } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [portal, setPortal] = useState<'admin' | 'user' | null>(null);
  const [authMode, setAuthMode] = useState<'options' | 'login' | 'register'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
        setSuccess("Registration successful! If you are not the first admin, your account status will be 'Pending Approval'.");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
      setAuthLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setError(null);
    setAuthLoading(true);
    try {
      await resetPassword(email);
      setSuccess("Password reset email sent. Please check your inbox.");
    } catch (err: any) {
      setError(err.message);
    } finally {
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

  if (profile?.status === 'pending') {
    return (
      <div className="min-h-screen bg-neutral-cream flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]">
        <div className="max-w-md w-full bg-white p-12 shadow-2xl border border-neutral-sand text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-brand-light/30 rounded-full flex items-center justify-center text-brand-primary animate-pulse">
              <ShieldCheck size={40} />
            </div>
          </div>
          <h2 className="text-3xl font-serif font-bold text-brand-dark italic">Registration Pending</h2>
          <p className="text-sm text-neutral-black/60 leading-relaxed">
            Your identity <span className="font-bold text-brand-primary">({profile.email})</span> has been submitted for verification. 
            A Super Admin will review your request shortly.
          </p>
          <div className="pt-4">
            <button 
              onClick={() => useAuth().logout()}
              className="text-[10px] uppercase font-bold tracking-widest text-brand-primary hover:underline"
            >
              Sign out and try later
            </button>
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
                  
                  {/* Admin Portal Group */}
                  <div className="space-y-2">
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
                  </div>

                  {/* User Portal Group */}
                  <div className="space-y-2">
                    <button 
                      onClick={() => { setPortal('user'); setAuthMode('login'); }}
                      className="w-full group flex items-center justify-between p-6 bg-white border border-neutral-sand hover:border-brand-accent-2 transition-all duration-300"
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
                  </div>
                </motion.div>
              ) : (
                <motion.form 
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleAuth}
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
                      {portal === 'admin' ? (authMode === 'login' ? 'Administrative Login' : 'Admin Registration') : 'Sales Member Login'}
                    </h2>
                    <p className="text-xs text-neutral-black/50 font-medium">
                      {authMode === 'login' 
                        ? 'Enter your authorized credentials to access the terminal.' 
                        : 'First person to register will be designated as Super Admin.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {authMode === 'register' && (
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-neutral-black/40 tracking-widest">Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full bg-neutral-grey border-b-2 border-transparent focus:border-brand-primary p-3 text-sm outline-none transition-all"
                          placeholder="Your Name"
                        />
                      </div>
                    )}
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
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-bold text-neutral-black/40 tracking-widest">Passcode</label>
                        {authMode === 'login' && (
                          <button type="button" onClick={handleReset} className="text-[9px] uppercase font-bold text-brand-primary hover:underline">Forgot?</button>
                        )}
                      </div>
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-neutral-grey border-b-2 border-transparent focus:border-brand-primary p-3 text-sm outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-brand-accent-3/10 border-l-4 border-brand-accent-3 text-[10px] text-brand-accent-3 font-bold">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="p-3 bg-brand-light/10 border-l-4 border-brand-primary text-[10px] text-brand-primary font-bold">
                      {success}
                    </div>
                  )}

                  <div className="space-y-3">
                    <button 
                      disabled={authLoading}
                      type="submit"
                      className="w-full bg-brand-primary text-white py-4 font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-brand-dark transition-all transform hover:scale-[1.02] shadow-lg disabled:bg-neutral-grey disabled:scale-100"
                    >
                      {authLoading ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div> : <ShieldCheck size={18} />}
                      {authMode === 'login' ? 'Authorize Identity' : 'Submit Registration'}
                    </button>

                    {portal === 'admin' && (
                      <div className="pt-2 text-center">
                        <button 
                          type="button"
                          onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                          className="text-[10px] uppercase font-bold tracking-widest text-brand-primary hover:underline"
                        >
                          {authMode === 'login' ? 'No account? Register Now' : 'Back to Login'}
                        </button>
                      </div>
                    )}

                    {portal === 'admin' && authMode === 'login' && (
                      <>
                        <div className="relative pt-2">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-neutral-sand"></div>
                          </div>
                          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                            <span className="bg-white px-3 text-neutral-black/30">Or direct access</span>
                          </div>
                        </div>

                        <button 
                          type="button"
                          disabled={authLoading}
                          onClick={signIn}
                          className="w-full border border-neutral-sand text-neutral-black py-4 font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-neutral-grey transition-all transform hover:scale-[1.02]"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Continue with Google
                        </button>
                      </>
                    )}
                  </div>
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
          {['admin', 'super_admin'].includes(profile?.role || '') ? (
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
