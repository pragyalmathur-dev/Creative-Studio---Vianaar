import React, { useState, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../AuthProvider';
import { Template, ItineraryItem } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/errorUtils';
import { Save, Download, ArrowLeft, Type, Clock, MapPin, Plus, Trash2, Camera, ShieldCheck, User as UserIcon, Car, Building2, Home, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';

interface CreativeEditorProps {
  template: Template;
  onBack: () => void;
  initialData?: any;
  autoDownload?: boolean;
}

export default function CreativeEditor({ template, onBack, initialData, autoDownload }: CreativeEditorProps) {
  const { user, profile } = useAuth();
  const isAdmin = ['admin', 'super_admin'].includes(profile?.role || '');
  
  const [name, setName] = useState(initialData?.name || 'Suraj Pinge');
  const [designation, setDesignation] = useState(initialData?.designation || 'Vice President | Goa');
  const [bio, setBio] = useState(initialData?.bio || 'Professional consultant specializing in luxury residential assets across Goa.');
  const [profileImage, setProfileImage] = useState<string | null>(initialData?.profileImage || null);
  const [selectedDate, setSelectedDate] = useState(initialData?.selectedDate || new Date().toISOString().split('T')[0]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(initialData?.itinerary || [
    { id: '1', time: '1:45 PM', location: 'Meeting Point', activity: 'Pick-up from your location' },
    { id: '2', time: '3:30 PM', location: 'La Marcella', activity: 'Visit to our luxury estate' },
    { id: '3', time: '4:30 PM', location: 'La Selva', activity: 'Visit to completed property' },
    { id: '4', time: '7:30 PM', location: 'Final Stop', activity: 'Drop-off at your location' }
  ]);
  
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (autoDownload && editorRef.current) {
      setTimeout(() => {
        handleDownload();
      }, 1000); // Give extra time for images to load if triggered automatically
    }
  }, []);

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
          bio,
          profileImage,
          selectedDate,
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
    if (!editorRef.current) return;
    
    setExporting(true);
    await logAction('download');
    
    try {
      // Small delay to ensure any pending renders are complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await toPng(editorRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 3, // Very high resolution for printing/sharing
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement('a');
      const fileName = `Vianaar-${name.replace(/\s+/g, '-')}-${selectedDate}.png`;
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to generate high-res image. Please try again or contact support.');
    } finally {
      setExporting(false);
    }
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
                    <textarea 
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      className="w-full bg-neutral-grey border-b-2 border-transparent focus:border-brand-primary p-2 text-[10px] outline-none transition-all placeholder:text-neutral-black/20 resize-none"
                      placeholder="Consultant Bio"
                      rows={2}
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
              disabled={exporting}
              className="w-full bg-neutral-black text-white py-4 font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
            >
              {exporting ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div> : <Download size={16} />}
              Export High-Res Creative
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
          className="relative aspect-[9/16] w-full max-w-[500px] mx-auto shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden group border-8 border-white select-none" 
          ref={editorRef}
        >
          {/* Section 1: Main Poster Background (The .poster class) */}
          <div className="absolute inset-0 z-0 bg-[#1f4d36] bg-gradient-to-br from-[#5f874d] to-[#1f4d36]">
             {/* Texture Overlay (Shadows & Lights) */}
             <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.18)_0%,transparent_25%),radial-gradient(circle_at_80%_30%,rgba(0,0,0,0.15)_0%,transparent_30%),radial-gradient(circle_at_60%_70%,rgba(0,0,0,0.12)_0%,transparent_30%)]"></div>
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.12)_0%,transparent_20%),radial-gradient(circle_at_70%_25%,rgba(255,255,255,0.08)_0%,transparent_25%),radial-gradient(circle_at_30%_60%,rgba(255,255,255,0.08)_0%,transparent_20%)]"></div>
          </div>

          {/* Section 2: Top Bar Branding */}
          <div className="absolute top-[3.5%] left-[6%] right-[6%] flex justify-between items-center z-20">
            <div className="flex items-center gap-3 text-white font-sans font-bold tracking-wider text-[12px]">
              <div className="flex h-6 w-5 relative">
                <span className="absolute w-[2px] h-full bg-white rounded-full left-0 origin-top skew-x-[18deg]"></span>
                <span className="absolute w-[2px] h-full bg-white rounded-full left-[4px] origin-top skew-x-[12deg]"></span>
                <span className="absolute w-[2px] h-full bg-white rounded-full left-[8px] origin-top"></span>
                <span className="absolute w-[2px] h-full bg-white rounded-full left-[12px] origin-top -skew-x-[12deg]"></span>
                <span className="absolute w-[2px] h-full bg-white rounded-full left-[16px] origin-top -skew-x-[18deg]"></span>
              </div>
              VIANAAR
            </div>
            <div className="text-white font-sans text-[10px] tracking-wide">
              THE GOA EDIT
            </div>
          </div>

          {/* Section 3: The Cream Card (The .card class) */}
          <div className="absolute top-[10%] left-[11%] right-[11%] bottom-[6%] bg-[#f5f2ea] rounded-t-[200px] z-10 flex flex-col overflow-hidden shadow-2xl">
            
            {/* Segment 1: Header/Title (18% height approx) */}
            <div className="h-[18%] border-b-2 border-[#ddd6ca] flex flex-col justify-center items-center text-center px-4 pt-4">
               <h1 className="text-2xl font-serif font-bold text-[#21553f] italic mb-1 uppercase tracking-tight">Site Visit Guide</h1>
               <p className="text-[10px] text-[#21553f]/40 font-bold uppercase tracking-[0.3em] font-sans">
                 {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
               </p>
            </div>

            {/* Segment 2: Profile (30% height approx) */}
            <div className="h-[30%] border-b-2 border-[#ddd6ca] flex flex-col justify-center items-center px-6 text-center">
               <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white/50 mb-2 relative flex-shrink-0">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      className="w-full h-full object-cover" 
                      alt="Profile" 
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#21553f]/10">
                      <UserIcon size={24} className="text-[#21553f] opacity-30" />
                    </div>
                  )}
               </div>
               <div className="space-y-0.5">
                  <h2 className="text-xl font-serif font-bold text-[#21553f] tracking-tight leading-tight">
                    {name || 'Suraj Pinge'}
                  </h2>
                  <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#21553f]/60 font-sans">
                    {designation || 'Vice President | Goa'}
                  </p>
                  <p className="text-[9px] text-[#21553f]/50 font-medium leading-relaxed max-w-[220px] mt-1.5 font-sans italic line-clamp-2">
                    {bio}
                  </p>
               </div>
            </div>

            {/* Segment 3: Itinerary (32% height approx) */}
            <div className="h-[32%] border-b-2 border-[#ddd6ca] px-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-serif font-bold text-[#21553f] italic">Itinerary</h3>
                  <div className="h-[1px] flex-1 bg-[#21553f]/10"></div>
                  <span className="text-[9px] font-bold text-[#21553f]/40 italic font-sans">{calculateDuration()}</span>
                </div>

                <div className="space-y-2.5 relative">
                  <div className="absolute left-[13px] top-3 bottom-3 w-0.5 border-l-2 border-[#21553f]/10 border-dotted"></div>
                  
                  {itinerary.slice(0, 4).map((item) => {
                    const content = (item.activity + ' ' + item.location).toLowerCase();
                    let Icon = Building2;
                    if (content.match(/pick[- ]?up|car|cab|drive|transfer|travel/)) Icon = Car;
                    else if (content.match(/visit|estate|property|site|building|la /)) Icon = Building2;
                    else if (content.match(/meeting|talk|discuss|presentation/)) Icon = UserIcon;
                    else if (content.match(/drop[- ]?off|finish|end|home/)) Icon = MapPin;
                    
                    return (
                      <div key={item.id} className="flex gap-3 items-start relative z-10">
                        <div className="w-[28px] h-[28px] rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 border border-[#21553f]/5">
                           <Icon size={12} className="text-[#21553f]" />
                        </div>
                        <div className="pt-0.5 max-w-[80%]">
                          <div className="flex items-baseline gap-2">
                            <span className="text-[10px] font-bold text-[#21553f] uppercase tracking-wide font-sans">{item.time}</span>
                            <span className="text-[10px] font-bold text-[#21553f] font-serif italic">— {item.location}</span>
                          </div>
                          <p className="text-[9px] text-[#21553f]/50 font-medium leading-tight font-sans line-clamp-1">
                            {item.activity}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
            </div>

            {/* Segment 4: Good To Know (Remaining height) */}
            <div className="p-8 flex-1 flex flex-col justify-center text-[#21553f]">
                <h2 className="text-xl font-serif font-bold mb-3">Good To Know</h2>
                <div className="grid grid-cols-3 gap-3">
                  <div className="border-l-2 border-[#21553f] pl-2 text-[9px] leading-tight font-sans text-[#2c6a4f]">
                    A dedicated pick-up can be arranged from your location of choice in North Goa.
                  </div>
                  <div className="border-l-2 border-[#21553f] pl-2 text-[9px] leading-tight font-sans text-[#2c6a4f]">
                    Easy walking shoes are recommended; the visit includes outdoor walkthroughs.
                  </div>
                  <div className="border-l-2 border-[#21553f] pl-2 text-[9px] leading-tight font-sans text-[#2c6a4f]">
                    Carry relevant documents for your discussion.
                  </div>
                </div>
            </div>
          </div>

          {/* Section 4: Footer Line */}
          <div className="absolute bottom-[2%] w-full px-10 text-center text-white italic text-[12px] z-20 opacity-90 drop-shadow-sm font-serif">
            True luxury is when everything is taken care of, so you only have to arrive.
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
