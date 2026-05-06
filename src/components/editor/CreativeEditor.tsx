import React, { useState, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../AuthProvider';
import { Template } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/errorUtils';
import { Save, Download, ArrowLeft, Type, Calendar, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CreativeEditorProps {
  template: Template;
  onBack: () => void;
}

export default function CreativeEditor({ template, onBack }: CreativeEditorProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    itinerary: '',
    bio: ''
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const logAction = async (action: 'save' | 'download') => {
    try {
      await addDoc(collection(db, 'edit_history'), {
        userId: user?.uid,
        userEmail: user?.email,
        templateId: template.id,
        templateName: template.name,
        action,
        timestamp: serverTimestamp(),
        contentSnapshot: {
          ...(template.editableFields.name && { name: formData.name }),
          ...(template.editableFields.itinerary && { itinerary: formData.itinerary }),
          ...(template.editableFields.bio && { bio: formData.bio })
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
    // In a real app, this would trigger an image generation or PDF creation
    // For this prototype, we simulate the action and log it
    await logAction('download');
    
    // Aesthetic feedback
    const btn = document.getElementById('download-btn');
    if (btn) {
      btn.classList.add('scale-95', 'opacity-50');
      setTimeout(() => btn.classList.remove('scale-95', 'opacity-50'), 200);
    }
    alert('Creative generated and download initiated.');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-12 min-h-[600px]">
      {/* Control Panel */}
      <div className="w-full lg:w-96 space-y-8 h-fit lg:sticky lg:top-24">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-black/40 hover:text-brand-primary transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>

        <div className="bg-white border boundary-brand-primary border-neutral-sand p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-serif font-bold text-neutral-black">{template.name}</h2>
            <p className="text-xs uppercase tracking-widest text-brand-primary font-bold mt-1">Creative Editor</p>
          </div>

          <div className="space-y-6">
            {template.editableFields.name && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] uppercase font-bold text-neutral-black/40"><Type size={12} /> Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-neutral-grey border-b-2 border-transparent focus:border-brand-primary p-3 text-sm outline-none transition-all"
                  placeholder="Enter sales member name..."
                />
              </div>
            )}

            {template.editableFields.itinerary && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] uppercase font-bold text-neutral-black/40"><Calendar size={12} /> Itinerary Details</label>
                <textarea 
                  value={formData.itinerary}
                  onChange={e => setFormData({...formData, itinerary: e.target.value})}
                  className="w-full bg-neutral-grey border-b-2 border-transparent focus:border-brand-primary p-3 text-sm outline-none transition-all min-h-[100px] resize-none"
                  placeholder="Schedule or site visit details..."
                />
              </div>
            )}

            {template.editableFields.bio && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] uppercase font-bold text-neutral-black/40"><UserIcon size={12} /> Sales Bio</label>
                <textarea 
                  value={formData.bio}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                  className="w-full bg-neutral-grey border-b-2 border-transparent focus:border-brand-primary p-3 text-sm outline-none transition-all min-h-[80px] resize-none"
                  placeholder="Short professional summary..."
                />
              </div>
            )}
          </div>

          <div className="mt-10 flex flex-col gap-3">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-brand-primary text-white py-4 font-bold text-xs uppercase tracking-widest hover:bg-brand-dark transition-all flex items-center justify-center gap-2 disabled:bg-neutral-grey"
            >
              {saving ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div> : <Save size={16} />}
              Save Progress
            </button>
            <button 
              id="download-btn"
              onClick={handleDownload}
              className="w-full bg-neutral-black text-white py-4 font-bold text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              <Download size={16} /> Download Creative
            </button>
          </div>
          
          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-center text-brand-primary font-bold text-xs flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={14} /> Changes logged successfully
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Preview Section */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-black/40">Live Preview Output</p>
          <span className="text-[10px] text-brand-accent-3 font-bold border border-brand-accent-3 px-2 py-0.5 rounded">RESTRICTED LAYOUT</span>
        </div>

        <div className="relative aspect-[4/5] bg-white shadow-2xl overflow-hidden group border border-neutral-sand" ref={editorRef}>
          {/* Base Creative Image */}
          <img src={template.imageUrl} className="w-full h-full object-cover select-none" alt="" referrerPolicy="no-referrer" />
          
          {/* Brand Overlay (Immutible) */}
          <div className="absolute top-8 left-8">
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-black text-white drop-shadow-lg mix-blend-overlay opacity-80 select-none">VIANAAR</span>
            </div>
          </div>

          {/* Dynamic Content Overlays (Restricted Positioning) */}
          <div className="absolute inset-x-8 bottom-12 space-y-6">
            {formData.name && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-[10px] uppercase font-bold text-white/60 tracking-widest mb-1 select-none">Presented by</p>
                <h3 className="text-4xl font-serif font-bold text-brand-light drop-shadow-md select-none">{formData.name}</h3>
              </motion.div>
            )}

            {formData.itinerary && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/90 backdrop-blur-sm p-6 border-l-4 border-brand-primary max-w-sm">
                 <p className="text-[10px] uppercase font-bold text-brand-dark tracking-widest mb-2 select-none">Planned Sequence</p>
                 <p className="text-brand-dark font-medium leading-relaxed select-none">{formData.itinerary}</p>
              </motion.div>
            )}

            {formData.bio && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xs">
                <p className="text-white/80 text-xs italic font-medium leading-relaxed drop-shadow select-none">"{formData.bio}"</p>
              </motion.div>
            )}
          </div>
          
          {/* Watermark/Copyright */}
          <div className="absolute bottom-4 right-8">
             <p className="text-[8px] uppercase tracking-tighter text-white/40 font-bold select-none">© 2026 VIANAAR LUXURY COLLECTION</p>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-neutral-black/40 italic">Brand elements, logos, and layout structure are locked and cannot be moved or altered.</p>
      </div>
    </div>
  );
}
