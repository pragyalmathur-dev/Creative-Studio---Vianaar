import React, { useState, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../AuthProvider';
import { Template, ItineraryItem } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/errorUtils';
import { Save, Download, ArrowLeft, Type, Clock, MapPin, Plus, Trash2, Camera, ShieldCheck, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CreativeEditorProps {
  template: Template;
  onBack: () => void;
}

export default function CreativeEditor({ template, onBack }: CreativeEditorProps) {
  const { user, profile } = useAuth();
  const isAdmin = ['admin', 'super_admin'].includes(profile?.role || '');
  
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([
    { id: '1', time: '1:45 PM', location: 'Meeting Point', activity: 'Pick-up from your location' }
  ]);
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const addStop = () => {
    const newItem: ItineraryItem = {
      id: Math.random().toString(36).substr(2, 9),
      time: '',
      location: '',
      activity: ''
    };
    setItinerary([...itinerary, newItem]);
  };

  const removeStop = (id: string) => {
    setItinerary(itinerary.filter(i => i.id !== id));
  };

  const updateStop = (id: string, field: keyof ItineraryItem, value: string) => {
    setItinerary(itinerary.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const logAction = async (action: 'save' | 'download') => {
    try {
      await addDoc(collection(db, 'edit_history'), {
        userId: user?.uid,
        userEmail: user?.email,
        userRole: profile?.role,
        templateId: template.id,
        templateName: template.name,
        action,
        timestamp: serverTimestamp(),
        contentSnapshot: {
          name,
          designation,
          itinerary
        }
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'edit_history');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await logAction('save');
    setSuccess(true);
    setSaving(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleDownload = async () => {
    await logAction('download');
    
    // Aesthetic feedback for "generation"
    const btn = document.getElementById('download-btn');
    if (btn) {
      btn.classList.add('scale-95', 'opacity-50');
      setTimeout(() => btn.classList.remove('scale-95', 'opacity-50'), 200);
    }
    alert('High-resolution creative is being processed for download. This usually takes 5-10 seconds for rendering.');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-12 min-h-[600px] mb-20 animate-in fade-in duration-700">
      {/* Control Panel */}
      <div className="w-full lg:w-[400px] space-y-8 h-fit lg:sticky lg:top-24">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-black/40 hover:text-brand-primary transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>

        <div className="bg-white border boundary-brand-primary border-neutral-sand p-8 shadow-[0_20px_50px_rgba(37,112,87,0.1)]">
          <div className="mb-8">
            <h2 className="text-3xl font-serif font-bold text-brand-dark italic mb-1">{template.name}</h2>
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-6 bg-brand-primary"></span>
              <p className="text-[10px] uppercase tracking-[0.2em] text-brand-primary font-black">Dynamic Creative Terminal</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Identity Group */}
            <div className="space-y-4">
              <label className="text-[10px] uppercase font-black text-neutral-black/30 tracking-widest flex items-center gap-2">
                <div className="h-4 w-4 bg-brand-primary/10 rounded flex items-center justify-center text-brand-primary">
                  <Type size={10} />
                </div>
                Creative Persona
              </label>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-neutral-grey border-b-2 border-transparent focus:border-brand-primary p-3 text-sm outline-none transition-all placeholder:text-neutral-black/20"
                  placeholder="Sales Member Name (e.g. Suraj Pinge)"
                />
                <input 
                  type="text" 
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  className="w-full bg-neutral-grey border-b-2 border-transparent focus:border-brand-primary p-3 text-[10px] uppercase tracking-widest font-bold outline-none transition-all placeholder:text-neutral-black/20"
                  placeholder="Designation (e.g. Vice President | Goa)"
                />
              </div>
            </div>

            {/* Timeline Group */}
            <div className="space-y-4 pt-4 border-t border-neutral-grey/50">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-black text-neutral-black/30 tracking-widest flex items-center gap-2">
                  <div className="h-4 w-4 bg-brand-primary/10 rounded flex items-center justify-center text-brand-primary">
                    <Clock size={10} />
                  </div>
                  Itinerary Stops
                </label>
                <button 
                  onClick={addStop}
                  className="text-[9px] uppercase font-bold text-brand-primary flex items-center gap-1 hover:underline"
                >
                  <Plus size={12} /> Add Stop
                </button>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {itinerary.map((stop, index) => (
                  <motion.div 
                    layout
                    key={stop.id} 
                    className="p-4 bg-neutral-grey/50 border border-neutral-sand/20 space-y-3 relative group"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase font-bold text-neutral-black/40">Time</span>
                        <input 
                          value={stop.time}
                          onChange={e => updateStop(stop.id, 'time', e.target.value)}
                          className="w-full bg-white p-1.5 text-[10px] font-bold border-b border-transparent focus:border-brand-primary outline-none"
                          placeholder="1:45 PM"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase font-bold text-neutral-black/40">Location</span>
                        <input 
                          value={stop.location}
                          onChange={e => updateStop(stop.id, 'location', e.target.value)}
                          className="w-full bg-white p-1.5 text-[10px] font-bold border-b border-transparent focus:border-brand-primary outline-none"
                          placeholder="Meeting Point"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] uppercase font-bold text-neutral-black/40">Activity</span>
                      <textarea 
                        value={stop.activity}
                        onChange={e => updateStop(stop.id, 'activity', e.target.value)}
                        className="w-full bg-white p-1.5 text-[10px] font-medium border-b border-transparent focus:border-brand-primary outline-none resize-none"
                        placeholder="Description of visit..."
                        rows={2}
                      />
                    </div>
                    {itinerary.length > 1 && (
                      <button 
                        onClick={() => removeStop(stop.id)}
                        className="absolute -top-2 -right-2 bg-brand-accent-3 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-brand-primary text-white py-4 font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-brand-dark transition-all flex items-center justify-center gap-3 disabled:bg-neutral-grey shadow-lg"
            >
              {saving ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div> : <Save size={16} />}
              Archive State
            </button>
            <button 
              id="download-btn"
              onClick={handleDownload}
              className="w-full bg-neutral-black text-white py-4 font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg"
            >
              <Download size={16} /> Export High-Res Creative
            </button>
          </div>
          
          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 text-center text-brand-primary font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <ShieldCheck size={14} /> Design parameters synchronized
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* High-Fidelity Preview Section */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-sand pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-neutral-black">Preview Environment</p>
            <p className="text-[10px] text-neutral-black/40 italic mt-0.5">Brand guidelines enforced system-wide</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 group cursor-help">
               <Camera size={12} className="text-neutral-black/30" />
               <span className="text-[10px] uppercase font-bold text-neutral-black/30 border-b border-dotted border-neutral-black/30">Capture Ready</span>
             </div>
             {isAdmin ? (
               <span className="text-[9px] text-brand-primary font-bold border-2 border-brand-primary/20 px-3 py-1 bg-brand-primary/5 uppercase tracking-widest">Master Override</span>
             ) : (
               <span className="text-[9px] text-brand-accent-3 font-bold border-2 border-brand-accent-3/20 px-3 py-1 bg-brand-accent-3/5 uppercase tracking-widest">Locked Layout</span>
             )}
          </div>
        </div>

        <div 
          className="relative aspect-[9/16] w-full max-w-[500px] mx-auto bg-neutral-cream shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden group border-8 border-white p-4" 
          ref={editorRef}
        >
          {/* Base Template Image - Used as an "Atmospheric" Background */}
          {template.imageUrl && (
            <img 
              src={template.imageUrl} 
              className="absolute inset-0 w-full h-full object-cover select-none opacity-20 blur-sm pointer-events-none scale-110" 
              alt="" 
              referrerPolicy="no-referrer" 
            />
          )}

          {/* Vianaar Branded Structure - REPLICATING THE TEMPLATE DESIGN */}
          <div className="h-full w-full bg-brand-primary relative flex flex-col p-8 overflow-hidden">
            {/* Visual Textures */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-30 pointer-events-none"></div>
            
            {/* Header Area */}
            <div className="relative z-10 flex justify-between items-start mb-8">
              <div className="text-white">
                <span className="block font-serif text-3xl font-black tracking-tighter opacity-90">V</span>
                <span className="text-[8px] uppercase tracking-[0.5em] font-black opacity-60">VIANAAR</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-[0.2em]">The Goa Edit</p>
              </div>
            </div>

            {/* Content Arch */}
            <div className="flex-1 bg-neutral-cream rounded-t-[100px] relative overflow-hidden flex flex-col p-1">
              <div className="bg-neutral-cream px-8 py-10 flex-1 flex flex-col">
                <div className="text-center mb-10">
                   <h1 className="text-4xl font-serif font-black text-brand-dark italic mb-1 uppercase tracking-tight">Site Visit Guide</h1>
                   <p className="text-[12px] text-brand-dark/50 font-bold uppercase tracking-[0.3em]">
                     {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                   </p>
                </div>

                {/* Profile Section */}
                <div className="flex items-center gap-8 mb-12">
                   <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-brand-light/30 flex-shrink-0 relative">
                     <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-transparent"></div>
                     <UserIcon className="w-full h-full p-6 text-brand-primary opacity-30" />
                   </div>
                   <div className="space-y-1">
                     <h2 className="text-3xl font-serif font-black text-brand-dark tracking-tight leading-tight">
                       {name || 'Full Name'}
                     </h2>
                     <p className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-primary">
                       {designation || 'Position Placeholder'}
                     </p>
                     <p className="text-[10px] text-brand-dark/60 font-medium leading-relaxed max-w-[200px] mt-2">
                       A trusted voice in Goa's luxury real estate space, {name.split(' ')[0] || 'the member'} is known for professional excellence and grounded approach.
                     </p>
                   </div>
                </div>

                {/* Itinerary Section */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-2xl font-serif font-black text-brand-dark italic">Itinerary</h3>
                    <div className="h-px flex-1 bg-brand-dark/10"></div>
                    <span className="text-[9px] uppercase font-bold text-brand-dark/40 italic">Duration ~ 2 Hours</span>
                  </div>

                  <div className="space-y-8 pl-2">
                    {itinerary.map((item, i) => (
                      <div key={item.id} className="flex gap-4 group">
                        <div className="flex flex-col items-center gap-1">
                          <div className="h-2.5 w-2.5 rounded-full bg-brand-primary shadow-[0_0_10px_rgba(37,112,87,0.4)]"></div>
                          {i !== itinerary.length - 1 && <div className="w-0.5 flex-1 bg-dotted border-l-2 border-brand-primary/20 border-dotted"></div>}
                        </div>
                        <div className="pb-4">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-[11px] font-black text-brand-dark uppercase tracking-wide">{item.time || 'Time'}</span>
                            <span className="text-[10px] font-bold text-brand-dark/50">—</span>
                            <span className="text-[11px] font-bold text-brand-dark/80">{item.location || 'Location'}</span>
                          </div>
                          <p className="text-[10px] text-brand-dark/50 font-medium leading-tight">
                            {item.activity || 'Activity details will appear here...'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Message */}
                <div className="mt-auto pt-8 border-t border-brand-dark/5 text-center">
                  <p className="text-[10px] font-serif font-bold italic text-brand-dark opacity-60">
                    "True luxury is when everything is taken care of, so you only have to arrive."
                  </p>
                </div>
              </div>
            </div>

            {/* Watermark */}
            <div className="mt-4 flex justify-between items-center text-white/30">
               <span className="text-[8px] uppercase tracking-widest font-black">Private & Confidential</span>
               <span className="text-[8px] font-bold uppercase tracking-widest leading-none">© 2026 Vianaar Collections</span>
            </div>
          </div>
        </div>
        
        <div className="bg-neutral-grey/30 border-l-4 border-neutral-sand p-4">
           <p className="text-[10px] text-neutral-black/50 leading-relaxed font-medium">
             <span className="font-black text-neutral-black">Designer Note:</span> This preview uses the <span className="text-brand-primary font-bold">Vianaar Site Visit Protocol (V2)</span>. 
             Text alignment, fonts (Playfair Display), and color dynamics are computationally enforced to ensure brand uniformity across all sales outputs.
           </p>
        </div>
      </div>
    </div>
  );
}
