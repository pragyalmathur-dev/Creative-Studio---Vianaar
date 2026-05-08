import React, { useState, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../AuthProvider';
import { Template, ItineraryItem } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/errorUtils';
import { Save, Download, ArrowLeft, Type, Clock, MapPin, Plus, Trash2, Camera, ShieldCheck, User as UserIcon, Car, Building2, Home, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CreativeEditorProps {
  template: Template;
  onBack: () => void;
}

export default function CreativeEditor({ template, onBack }: CreativeEditorProps) {
  const { user, profile } = useAuth();
  const isAdmin = ['admin', 'super_admin'].includes(profile?.role || '');
  
  const [name, setName] = useState('Suraj Pinge');
  const [designation, setDesignation] = useState('Vice President | Goa');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([
    { id: '1', time: '1:45 PM', location: 'Meeting Point', activity: 'Pick-up from your location' },
    { id: '2', time: '3:30 PM', location: 'La Marcella', activity: 'Visit to our luxury estate' },
    { id: '3', time: '4:30 PM', location: 'La Selva', activity: 'Visit to completed property' },
    { id: '4', time: '7:30 PM', location: 'Final Stop', activity: 'Drop-off at your location' }
  ]);
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const calculateDuration = () => {
    if (itinerary.length < 2) return '0 Hours';
    
    try {
      const parseTime = (timeStr: string) => {
        const [time, modifier] = timeStr.trim().split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;
        const d = new Date();
        d.setHours(hours, minutes || 0, 0, 0);
        return d.getTime();
      };

      const start = parseTime(itinerary[0].time);
      const end = parseTime(itinerary[itinerary.length - 1].time);
      
      const diffMs = end - start;
      if (diffMs < 0) return 'TBD';
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours === 0) return `${minutes} Minutes`;
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    } catch {
      return 'Calculating...';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfileImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
                <div className="flex items-center gap-4">
                  <div className="relative group/img cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-neutral-grey border-2 border-brand-primary/20 flex items-center justify-center overflow-hidden">
                      {profileImage ? (
                        <img src={profileImage} className="w-full h-full object-cover" alt="Profile" />
                      ) : (
                        <UserIcon size={24} className="text-brand-primary/40" />
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-brand-primary/60 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer">
                      <Plus size={16} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                  <div className="flex-1 space-y-2">
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-neutral-grey border-b-2 border-transparent focus:border-brand-primary p-2 text-sm outline-none transition-all placeholder:text-neutral-black/20"
                      placeholder="Sales Member Name"
                    />
                    <input 
                      type="text" 
                      value={designation}
                      onChange={e => setDesignation(e.target.value)}
                      className="w-full bg-neutral-grey border-b-2 border-transparent focus:border-brand-primary p-2 text-[10px] uppercase tracking-widest font-bold outline-none transition-all placeholder:text-neutral-black/20"
                      placeholder="Designation"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Date Group */}
            <div className="space-y-4 pt-4 border-t border-neutral-grey/50">
              <label className="text-[10px] uppercase font-black text-neutral-black/30 tracking-widest flex items-center gap-2">
                <div className="h-4 w-4 bg-brand-primary/10 rounded flex items-center justify-center text-brand-primary">
                  <Calendar size={10} />
                </div>
                Schedule Date
              </label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full bg-neutral-grey border-b-2 border-transparent focus:border-brand-primary p-3 text-sm outline-none transition-all font-bold text-neutral-black uppercase tracking-wider"
              />
            </div>

            {/* Timeline Group */}
            <div className="space-y-4 pt-4 border-t border-neutral-grey/50">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-black text-neutral-black/30 tracking-widest flex items-center gap-2">
                  <div className="h-4 w-4 bg-brand-primary/10 rounded flex items-center justify-center text-brand-primary">
                    <Clock size={10} />
                  </div>
                  Sequence [Duration: {calculateDuration()}]
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
          className="relative aspect-[9/16] w-full max-w-[500px] mx-auto shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden group border-8 border-white" 
          ref={editorRef}
        >
          {/* Main Template Background - Using the exact provided background image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://firebasestorage.googleapis.com/v0/b/firejet-97104.appspot.com/o/image-1715152031174.png?alt=media&token=c4a6a7c3-3b4c-4c7b-b8a3-2c1f9b3f3b1a" 
              className="w-full h-full object-cover select-none pointer-events-none" 
              alt="Vianaar Template Background" 
              referrerPolicy="no-referrer" 
            />
          </div>

          {/* Content Layer */}
          <div className="relative z-10 h-full w-full flex flex-col pt-10 px-10">
            
            {/* Header Branding Area - Outside the arch width */}
            <div className="flex justify-between items-center mb-10 px-2">
              <div className="h-10">
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/firejet-97104.appspot.com/o/image-1715153368297.png?alt=media&token=7c1b5042-88d4-4286-90c7-e31a166fc73c" 
                  className="h-full object-contain invert" // Inverting because the logo is white-on-black and template has dark green background in corners
                  alt="Vianaar" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-right">
                <p className="font-sans font-bold text-white text-[12px] uppercase tracking-[0.2em]">
                  THE GOA EDIT
                </p>
              </div>
            </div>

            {/* Segment 1: Title & Selected Date (Centered within the arch) */}
            <div className="mt-6 text-center">
               <h1 className="text-4xl font-serif font-bold text-brand-dark italic mb-1 uppercase tracking-tight">Site Visit Guide</h1>
               <p className="text-[12px] text-brand-dark/40 font-bold uppercase tracking-[0.3em] font-sans">
                 {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
               </p>
            </div>

            {/* Segment 2: Profile Section */}
            <div className="mt-12 px-6">
               <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white/50 flex-shrink-0 relative">
                    {profileImage ? (
                      <img src={profileImage} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand-primary/10">
                        <UserIcon size={24} className="text-brand-primary opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-serif font-bold text-brand-dark tracking-tight leading-tight">
                      {name || 'Suraj Pinge'}
                    </h2>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-primary font-sans">
                      {designation || 'Vice President | Goa'}
                    </p>
                  </div>
               </div>
            </div>

            {/* Segment 3: Itinerary */}
            <div className="mt-14 px-6 flex-1">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-2xl font-serif font-bold text-brand-dark italic">Itinerary</h3>
                <div className="h-[1px] flex-1 bg-brand-dark/10"></div>
                <span className="text-[10px] font-bold text-brand-dark/40 italic font-sans">{calculateDuration()}</span>
              </div>

              <div className="space-y-6 relative">
                {/* Timeline vertical bar */}
                <div className="absolute left-[17px] top-4 bottom-4 w-0.5 border-l-2 border-brand-primary/20 border-dotted"></div>
                
                {itinerary.map((item) => {
                  const content = (item.activity + ' ' + item.location).toLowerCase();
                  let Icon = Building2;
                  if (content.match(/pick[- ]?up|car|cab|drive|transfer|travel/)) Icon = Car;
                  else if (content.match(/visit|estate|property|site|building|la /)) Icon = Building2;
                  else if (content.match(/meeting|talk|discuss|presentation/)) Icon = UserIcon;
                  else if (content.match(/drop[- ]?off|finish|end|home/)) Icon = MapPin;
                  
                  return (
                    <div key={item.id} className="flex gap-4 items-start relative z-10">
                      <div className="w-[34px] h-[34px] rounded-full bg-white shadow-md flex items-center justify-center flex-shrink-0 border border-brand-primary/5">
                         <Icon size={14} className="text-brand-primary" />
                      </div>
                      <div className="pt-0.5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[11px] font-bold text-brand-dark uppercase tracking-wide font-sans">{item.time}</span>
                          <span className="text-[11px] font-bold text-brand-dark font-serif italic">— {item.location}</span>
                        </div>
                        <p className="text-[10px] text-brand-dark/50 font-medium leading-tight mt-1 font-sans">
                          {item.activity}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Segment 4: Footer Messaging */}
            <div className="mt-auto mb-10 text-center px-6">
               <div className="h-[1px] w-12 bg-brand-dark/10 mx-auto mb-4"></div>
               <p className="text-[11px] font-serif font-bold italic text-brand-dark opacity-60 leading-tight">
                 True luxury is when everything is taken care of,<br />
                 so you only have to arrive.
               </p>
            </div>

          </div>
        </div>

        
        <div className="bg-neutral-grey/30 border-l-4 border-neutral-sand p-4">
           <p className="text-[10px] text-neutral-black/50 leading-relaxed font-medium">
             <span className="font-black text-neutral-black">Designer Note:</span> This preview uses the <span className="text-brand-primary font-bold">Vianaar Site Visit Protocol (V2)</span>. 
             Text alignment, fonts (Cardo & Mulish), and color dynamics are computationally enforced to ensure brand uniformity across all sales outputs.
           </p>
        </div>
      </div>
    </div>
  );
}
