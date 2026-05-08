import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, addDoc, setDoc, serverTimestamp, onSnapshot, orderBy, where, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../AuthProvider';
import { Template, EditHistory, UserProfile, UserRole } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/errorUtils';
import { Plus, Users, Layout as LayoutIcon, Table as TableIcon, History, Search, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminDashboardProps {
  onSelectTemplate: (template: Template, initialData?: any, autoDownload?: boolean) => void;
}

export default function AdminDashboard({ onSelectTemplate }: AdminDashboardProps) {
  const { user, profile } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [history, setHistory] = useState<EditHistory[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    imageUrl: '',
    assignedTo: [] as string[],
    editableFields: { name: true, itinerary: true, bio: true }
  });

  useEffect(() => {
    // Fetch initial templates
    const fetchTemplates = async () => {
      try {
        const snap = await getDocs(collection(db, 'templates'));
        setTemplates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template)));
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'templates');
      }
    };

    // Fetch users (sales members)
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'profiles'), orderBy('email')));
        setUsers(snap.docs.map(doc => doc.data() as UserProfile));
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'profiles');
      }
    };

    // Real-time listener for audit log
    const historyQuery = query(collection(db, 'edit_history'), orderBy('timestamp', 'desc'));
    const unsubscribeHistory = onSnapshot(historyQuery, (snap) => {
      setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EditHistory)));
      setLoading(false);
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'edit_history'));

    fetchTemplates();
    fetchUsers();
    return () => unsubscribeHistory();
  }, []);

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newTemplate.name || !newTemplate.imageUrl) return;
      await addDoc(collection(db, 'templates'), {
        ...newTemplate,
        createdAt: serverTimestamp(),
        createdBy: user?.uid
      });
      setShowAddForm(false);
      setNewTemplate({ name: '', imageUrl: '', assignedTo: [], editableFields: { name: true, itinerary: true, bio: true } });
      // Re-fetch
      const snap = await getDocs(collection(db, 'templates'));
      setTemplates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template)));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'templates');
    }
  };

  const toggleUserAssignment = (uid: string) => {
    setNewTemplate(prev => {
      const assigned = prev.assignedTo.includes(uid) 
        ? prev.assignedTo.filter(id => id !== uid)
        : [...prev.assignedTo, uid];
      return { ...prev, assignedTo: assigned };
    });
  };

  const [activeTab, setActiveTab] = useState<'templates' | 'users' | 'audit' | 'approvals'>('templates');
  
  const isSuperAdmin = profile?.role === 'super_admin';

  const handleUpdateStatus = async (profileId: string, newStatus: string, newRole?: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newRole) updateData.role = newRole;
      await setDoc(doc(db, 'profiles', profileId), updateData, { merge: true });
      // Refresh
      const snap = await getDocs(query(collection(db, 'profiles'), orderBy('email')));
      setUsers(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as any)));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `profiles/${profileId}`);
    }
  };
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    designation: 'Sales Manager',
    role: 'sales' as UserRole
  });

  const handleAddSingleUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newUser.email || !newUser.name) return;
      await addDoc(collection(db, 'profiles'), {
        email: newUser.email.toLowerCase().trim(),
        displayName: newUser.name,
        role: newUser.role,
        designation: newUser.designation,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      setShowUserForm(false);
      setNewUser({ name: '', email: '', designation: 'Sales Manager', role: 'sales' });
      // Refresh
      const snap = await getDocs(query(collection(db, 'profiles'), orderBy('email')));
      setUsers(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as any)));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'profiles');
    }
  };

  const handleDeleteUser = async (profileId: string) => {
    if (!window.confirm("Are you sure you want to remove this user's access? This action is permanent.")) return;
    try {
      await deleteDoc(doc(db, 'profiles', profileId));
      setUsers(prev => prev.filter(u => (u as any).id !== profileId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `profiles/${profileId}`);
    }
  };

  const seedSalesTeam = async () => {
    const team = [
      { name: "Suraj Pinge", designation: "Vice President" },
      { name: "Rohit Anurag", designation: "Senior Sales Manager" },
      { name: "Abhin Bajaj", designation: "Assistant Vice President" },
      { name: "Lance Godinho", designation: "Assistant Vice President" },
      { name: "Agnit Nandy", designation: "Senior Sales Manager" },
      { name: "Bibek Sen", designation: "Sales Manager" },
      { name: "Divya Arora", designation: "Senior Sales Manager" },
      { name: "Himanshu Singh", designation: "Sales Manager" },
      { name: "Nikhil Mishra", designation: "Sales Manager" },
      { name: "Sidharth Najeev", designation: "Sales Manager" },
      { name: "Ashish Kazanchi", designation: "Assistant Vice President" },
      { name: "Shomnath Mazumdar", designation: "Assistant Vice President" },
      { name: "Lawrence Michael Rodrigues", designation: "Assistant Manager" }
    ];

    try {
      for (const member of team) {
        const email = `${member.name.toLowerCase().replace(/ /g, '.')}@vianaar.com`;
        const profileId = `placeholder_${member.name.toLowerCase().replace(/ /g, '_')}`;
        
        // Check if exists
        const q = query(collection(db, 'profiles'), where('email', '==', email));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          await addDoc(collection(db, 'profiles'), {
            email,
            displayName: member.name,
            role: 'sales',
            designation: member.designation,
            createdAt: serverTimestamp(),
            status: 'pending'
          });
        }
      }
      alert("Sales team members added to the database.");
      // Refresh users
      const snap = await getDocs(query(collection(db, 'profiles'), orderBy('email')));
      setUsers(snap.docs.map(doc => ({ ...doc.data() } as any)));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'profiles');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div></div>;

  return (
    <div className="space-y-12">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Templates', value: templates.length, icon: LayoutIcon, color: 'text-brand-primary' },
          { label: 'Total Members', value: users.length, icon: Users, color: 'text-brand-accent-2' },
          { label: 'Total Edits Logged', value: history.length, icon: History, color: 'text-brand-accent-1' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-neutral-sand p-6 flex flex-col gap-2 shadow-sm">
            <stat.icon className={`${stat.color} mb-2`} size={24} />
            <span className="text-4xl font-serif font-bold text-neutral-black">{stat.value}</span>
            <span className="text-xs uppercase tracking-widest font-bold text-neutral-black/40">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="flex border-b border-neutral-sand gap-8 mb-8 overflow-x-auto">
        {[
          { id: 'templates', label: 'Templates', icon: LayoutIcon },
          { id: 'users', label: 'User Directory', icon: Users },
          ...(isSuperAdmin ? [{ id: 'approvals', label: 'Access Control', icon: ShieldCheck }] : []),
          { id: 'audit', label: 'Audit Log', icon: TableIcon }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-4 text-[10px] uppercase tracking-widest font-bold transition-all px-2 ${
              activeTab === tab.id ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-neutral-black/40 hover:text-neutral-black'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-12">
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Side: Templates & Add Form */}
            <div className="lg:col-span-1 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif font-bold text-brand-dark">Templates</h2>
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-brand-primary hover:bg-brand-dark text-white p-2 rounded-full transition-colors flex items-center gap-2 px-4 text-xs uppercase font-bold tracking-widest"
                >
                  <Plus size={16} /> New
                </button>
              </div>

              {showAddForm && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  onSubmit={handleAddTemplate}
                  className="bg-white border border-brand-primary p-6 space-y-4 shadow-xl"
                >
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Template Name (e.g. Site Visit Guide)" 
                      className="w-full border-b border-neutral-sand py-2 text-sm focus:border-brand-primary outline-none"
                      value={newTemplate.name}
                      onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
                      required
                    />
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-neutral-black/40">Master Layout File (Image/PDF)</label>
                      <div className="relative border-2 border-dashed border-neutral-sand hover:border-brand-primary p-4 transition-colors group">
                        <input 
                          type="file" 
                          accept="image/*,application/pdf"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const limit = isSuperAdmin ? 1024 * 1024 : 512 * 1024;
                              if (file.size > limit) {
                                alert(`File too large. ${isSuperAdmin ? 'Super Admin' : 'Admin'} limit is ${isSuperAdmin ? '1MB' : '500KB'}.`);
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const result = event.target?.result as string;
                                setNewTemplate({...newTemplate, imageUrl: result});
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <div className="flex flex-col items-center justify-center gap-2 py-4">
                          {newTemplate.imageUrl ? (
                            <>
                              <div className="w-16 h-16 bg-brand-light/20 flex items-center justify-center rounded">
                                <CheckCircle2 className="text-brand-primary" size={24} />
                              </div>
                              <span className="text-xs font-bold text-brand-primary">File Prepared</span>
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setNewTemplate({...newTemplate, imageUrl: ''}); }}
                                className="text-[10px] text-brand-accent-3 underline font-bold"
                              >
                                Remove and Change
                              </button>
                            </>
                          ) : (
                            <>
                              <Plus className="text-neutral-black/20 group-hover:text-brand-primary" size={32} />
                              <span className="text-xs font-bold text-neutral-black/40 group-hover:text-neutral-black">Click or Drag to Upload Template</span>
                            </>
                          )}
                        </div>
                      </div>
                      {newTemplate.imageUrl && newTemplate.imageUrl.length > 800000 && (
                        <p className="text-[10px] text-brand-accent-3 font-bold italic">Warning: This file is large and may impact performance.</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold text-neutral-black/40">Assign to Sales Members</p>
                      <div className="max-h-40 overflow-y-auto border border-neutral-grey p-2 space-y-1">
                        {users.filter(u => u.role === 'sales').map(u => (
                          <label key={u.email} className="flex items-center gap-2 text-xs p-1 hover:bg-neutral-grey rounded cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={newTemplate.assignedTo.includes(u.uid || u.email)}
                              onChange={() => {
                                const id = u.uid || u.email;
                                setNewTemplate(prev => ({
                                  ...prev,
                                  assignedTo: prev.assignedTo.includes(id) 
                                    ? prev.assignedTo.filter(val => val !== id)
                                    : [...prev.assignedTo, id]
                                }));
                              }}
                              className="accent-brand-primary"
                            />
                            <div className="flex flex-col">
                              <span className="font-semibold">{u.displayName}</span>
                              <span className="text-[10px] text-neutral-black/40">{u.email}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {Object.keys(newTemplate.editableFields).map(field => (
                        <label key={field} className="flex items-center gap-2 text-xs capitalize font-semibold">
                          <input 
                            type="checkbox"
                            checked={newTemplate.editableFields[field as keyof typeof newTemplate.editableFields]}
                            onChange={e => setNewTemplate({
                              ...newTemplate, 
                              editableFields: {
                                ...newTemplate.editableFields,
                                [field]: e.target.checked
                              }
                            })}
                            className="accent-brand-primary"
                          />
                          {field}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 bg-brand-primary text-white py-2 font-bold text-xs uppercase tracking-widest hover:bg-brand-dark transition-colors">Add Template</button>
                    <button type="button" onClick={() => setShowAddForm(false)} className="px-4 border border-neutral-sand text-xs uppercase font-bold hover:bg-neutral-grey">Cancel</button>
                  </div>
                </motion.form>
              )}

              <div className="space-y-4">
                {templates.map(t => (
                  <div key={t.id} className="flex items-center gap-4 bg-white border border-neutral-sand p-3 hover:border-brand-primary transition-colors cursor-default">
                    <div className="w-16 h-16 bg-neutral-grey overflow-hidden flex-shrink-0">
                      <img src={t.imageUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif font-bold text-neutral-black truncate">{t.name}</h4>
                      <p className="text-[10px] text-neutral-black/40 uppercase tracking-wider">{t.assignedTo.length} members assigned</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif font-bold text-brand-dark">Sales Team Directory</h2>
                <p className="text-[10px] uppercase tracking-widest text-neutral-black/40 font-bold">Manage Roles & Assignments</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowUserForm(!showUserForm)}
                  className="bg-brand-primary text-white px-6 py-2 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-brand-dark transition-all flex items-center gap-2"
                >
                  <Plus size={14} /> Add Member
                </button>
                <button 
                  onClick={seedSalesTeam}
                  className="bg-neutral-black text-white px-6 py-2 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-black transition-all"
                >
                  Bulk Seed Team
                </button>
              </div>
            </div>

            {showUserForm && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleAddSingleUser}
                className="bg-white border border-brand-primary p-6 grid grid-cols-1 md:grid-cols-4 gap-4 shadow-xl"
              >
                <input 
                  type="text" 
                  placeholder="Name" 
                  className="border-b border-neutral-sand py-2 text-sm outline-none focus:border-brand-primary"
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  required
                />
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="border-b border-neutral-sand py-2 text-sm outline-none focus:border-brand-primary"
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Designation" 
                  className="border-b border-neutral-sand py-2 text-sm outline-none focus:border-brand-primary"
                  value={newUser.designation}
                  onChange={e => setNewUser({...newUser, designation: e.target.value})}
                />
                <select
                  className="border-b border-neutral-sand py-2 text-sm outline-none focus:border-brand-primary bg-transparent font-bold uppercase tracking-widest text-[10px]"
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                >
                  <option value="sales">Sales Member</option>
                  <option value="admin">Administrator</option>
                </select>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-brand-primary text-white py-2 text-[10px] uppercase font-bold tracking-widest">Create</button>
                  <button type="button" onClick={() => setShowUserForm(false)} className="px-3 border border-neutral-sand text-[10px] uppercase font-bold">Cancel</button>
                </div>
              </motion.form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((u, i) => (
                <motion.div 
                  key={u.email}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white border border-neutral-sand p-6 shadow-sm hover:shadow-md transition-shadow relative group"
                >
                  <button 
                    onClick={() => handleDeleteUser((u as any).id || u.uid)}
                    className="absolute top-4 right-4 p-2 text-neutral-black/20 hover:text-brand-accent-3 opacity-0 group-hover:opacity-100 transition-all"
                    title="Remove Access"
                  >
                    <Plus size={18} className="rotate-45" />
                  </button>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] uppercase tracking-tighter text-brand-primary font-black px-1.5 py-0.5 bg-brand-light/20 rounded">
                        {u.role}
                      </span>
                      {u.role === 'admin' && (
                        <ShieldCheck size={12} className="text-brand-primary" />
                      )}
                    </div>
                    <span className="text-xs uppercase tracking-widest text-neutral-black/40 font-bold italic">{(u as any).designation || 'Member'}</span>
                    <h3 className="text-xl font-serif font-bold text-neutral-black">{u.displayName}</h3>
                    <p className="text-xs text-neutral-black/40 italic mb-4">{u.email}</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-green-500' : u.status === 'restricted' ? 'bg-brand-accent-3' : 'bg-neutral-sand'}`}></div>
                        <span className="text-[10px] uppercase font-bold text-neutral-black/40">
                          {u.status || 'Active'}
                        </span>
                      </div>

                      {isSuperAdmin && u.uid !== user?.uid && (
                        <div className="flex gap-2 pt-2 border-t border-neutral-grey">
                          {u.status !== 'active' && (
                            <button 
                              onClick={() => handleUpdateStatus((u as any).id || u.uid, 'active')}
                              className="text-[9px] uppercase font-bold text-brand-primary hover:underline"
                            >
                              Activate
                            </button>
                          )}
                          {u.status !== 'restricted' && (
                            <button 
                              onClick={() => handleUpdateStatus((u as any).id || u.uid, 'restricted')}
                              className="text-[9px] uppercase font-bold text-brand-accent-3 hover:underline"
                            >
                              Restrict
                            </button>
                          )}
                          {u.role !== 'admin' && (
                            <button 
                              onClick={() => handleUpdateStatus((u as any).id || u.uid, 'active', 'admin')}
                              className="text-[9px] uppercase font-bold text-neutral-black/60 hover:underline"
                            >
                              Make Admin
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {isSuperAdmin && activeTab === 'approvals' && (
          <div className="space-y-8">
            <div className="flex items-end justify-between border-b border-neutral-sand pb-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-brand-dark">Pending Approvals</h2>
                <p className="text-[10px] uppercase tracking-widest text-neutral-black/40 font-bold">Review Registration Requests</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {users.filter(u => u.status === 'pending').length === 0 && (
                <div className="col-span-2 py-12 text-center bg-neutral-grey/20 border-2 border-dashed border-neutral-sand">
                  <p className="text-sm italic text-neutral-black/30 font-bold uppercase tracking-widest">No pending requests found</p>
                </div>
              )}
              {users.filter(u => u.status === 'pending').map((u, i) => (
                <motion.div 
                  key={u.email}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white border-2 border-brand-primary/20 p-6 flex flex-col gap-4 shadow-lg"
                >
                   <div className="flex items-start justify-between">
                     <div>
                       <h3 className="text-lg font-serif font-bold text-neutral-black">{u.displayName || 'New Access Request'}</h3>
                       <p className="text-xs text-brand-primary font-bold italic">{u.email}</p>
                     </div>
                     <div className={`p-2 rounded ${u.role === 'admin' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-accent-2/10 text-brand-accent-4'}`}>
                       {u.role === 'admin' ? <ShieldCheck size={20} /> : <Users size={20} />}
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-2">
                     <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-brand-primary/20 text-brand-primary' : 'bg-brand-accent-2/20 text-brand-accent-4'}`}>
                       {u.role === 'admin' ? 'Admin Role Requested' : 'Sales Role Requested'}
                     </span>
                   </div>
                   
                   <p className="text-xs text-neutral-black/50 leading-relaxed">
                     Requested access to the <span className="font-bold text-neutral-black">{u.role === 'admin' ? 'Administrative terminal' : 'User (Sales) terminal'}</span>. Verify identity before approving.
                   </p>

                   <div className="flex gap-4 pt-4 border-t border-neutral-sand">
                     <button 
                       onClick={() => handleUpdateStatus((u as any).id || u.uid, 'active')}
                       className="flex-1 bg-brand-primary text-white py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-brand-dark transition-colors"
                     >
                       Approve Access
                     </button>
                     <button 
                       onClick={() => handleDeleteUser((u as any).id || u.uid)}
                       className="flex-1 border border-brand-accent-3 text-brand-accent-3 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-brand-accent-3 hover:text-white transition-all"
                     >
                       Reject
                     </button>
                   </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-8">
            <div className="flex items-end justify-between border-b border-neutral-sand pb-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-brand-dark">Audit Log</h2>
                <p className="text-[10px] uppercase tracking-widest text-neutral-black/40 font-bold">Real-time Activity Tracker</p>
              </div>
              <TableIcon size={20} className="text-brand-accent-4" />
            </div>

            <div className="bg-white border border-neutral-sand shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-neutral-grey/50 border-b border-neutral-sand text-[10px] uppercase tracking-widest font-bold text-neutral-black/60">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Creative</th>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-grey text-sm">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-cream transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-neutral-black truncate max-w-[150px]">{item.userEmail.split('@')[0]}</span>
                            <span className="text-[10px] text-neutral-black/40 italic truncate max-w-[150px]">{item.userEmail}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-serif font-bold text-brand-dark">{item.templateName}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => {
                              const template = templates.find(t => t.id === item.templateId);
                              if (template) {
                                onSelectTemplate(template, item.contentSnapshot, item.action === 'download');
                              } else {
                                alert('Template not found.');
                              }
                            }}
                            className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded ring-1 transition-all hover:ring-brand-primary ${
                              item.action === 'download' ? 'ring-brand-accent-2/30 text-brand-accent-4 bg-brand-accent-2/5 hover:bg-brand-accent-2/10' : 'ring-brand-primary/30 text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10'
                            }`}
                          >
                            {item.action}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-neutral-black/50 whitespace-nowrap">
                          {item.timestamp?.toDate().toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-neutral-black/30 italic">No activity logs recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
