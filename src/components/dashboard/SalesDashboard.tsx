import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../AuthProvider';
import { Template, EditHistory } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/errorUtils';
import { FileEdit, History, Download, Eye, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface SalesDashboardProps {
  onSelectTemplate: (template: Template, initialData?: any, autoDownload?: boolean) => void;
}

export default function SalesDashboard({ onSelectTemplate }: SalesDashboardProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [history, setHistory] = useState<EditHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        // Fetch assigned templates
        const templatesQuery = query(
          collection(db, 'templates'),
          where('assignedTo', 'array-contains', user?.uid)
        );
        const templatesSnap = await getDocs(templatesQuery);
        const templatesList = templatesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template));
        setTemplates(templatesList);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'templates');
      }

      try {
        // Fetch recent history
        const historyQuery = query(
          collection(db, 'edit_history'),
          where('userId', '==', user?.uid),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        const historySnap = await getDocs(historyQuery);
        const historyList = historySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EditHistory));
        setHistory(historyList);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'edit_history');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div></div>;

  return (
    <div className="space-y-12">
      <section>
        <div className="flex items-end justify-between mb-8 border-b border-neutral-sand pb-4">
          <div>
            <h2 className="text-3xl font-serif text-brand-dark mb-1">Master Templates</h2>
            <p className="text-sm text-neutral-black/60 uppercase tracking-wider font-semibold">Your Assigned Creatives</p>
          </div>
          <span className="text-xs text-neutral-black/40 font-mono italic">Showing {templates.length} templates</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.length > 0 ? (
            templates.map((template, idx) => (
              <motion.div 
                key={template.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="group bg-white border border-neutral-sand hover:border-brand-primary transition-all duration-500 overflow-hidden"
              >
                <div className="aspect-[4/3] bg-neutral-grey relative overflow-hidden">
                  <img 
                    src={template.imageUrl} 
                    alt={template.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-brand-dark/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                     <button 
                       onClick={() => onSelectTemplate(template)}
                       className="bg-white text-brand-dark px-6 py-2 flex items-center gap-2 font-semibold shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
                     >
                       Edit Template <ArrowRight size={16} />
                     </button>
                  </div>
                </div>
                <div className="p-5 flex justify-between items-center bg-white">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-neutral-black">{template.name}</h3>
                    <div className="flex gap-2 mt-1">
                      {Object.entries(template.editableFields).map(([key, val]) => (
                        val && <span key={key} className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-neutral-grey text-neutral-black/60 rounded-sm">{key}</span>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => onSelectTemplate(template)}
                    className="p-2 text-brand-primary hover:bg-neutral-grey transition-colors"
                  >
                    <FileEdit size={20} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white border border-dashed border-neutral-sand">
              <p className="text-neutral-black/50 font-serif italic text-lg">No templates assigned yet.</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-8 border-b border-neutral-sand pb-4">
          <div>
            <h2 className="text-2xl font-serif text-brand-dark mb-1">Recent Activity</h2>
            <p className="text-sm text-neutral-black/60 uppercase tracking-wider font-semibold">Your Edit History</p>
          </div>
          <History size={20} className="text-brand-accent-2" />
        </div>

        <div className="bg-white border border-neutral-sand">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-grey/50 border-b border-neutral-sand text-[10px] uppercase tracking-widest font-bold text-neutral-black/60">
                <th className="px-6 py-3">Template</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Date & Time</th>
                <th className="px-6 py-3">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-grey">
              {history.length > 0 ? (
                history.map((item) => (
                  <tr key={item.id} className="text-sm hover:bg-neutral-cream transition-colors duration-200">
                    <td className="px-6 py-4 font-semibold text-brand-dark">{item.templateName}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => {
                          const template = templates.find(t => t.id === item.templateId);
                          if (template) {
                            onSelectTemplate(template, item.contentSnapshot, item.action === 'download');
                          } else {
                            alert('Base template not found. It might have been removed.');
                          }
                        }}
                        className={`group px-3 py-1.5 text-[10px] uppercase font-bold rounded-full flex items-center gap-2 transition-all ${
                          item.action === 'download' 
                            ? 'bg-brand-light text-brand-dark hover:bg-brand-primary hover:text-white' 
                            : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white'
                        }`}
                      >
                        {item.action === 'download' ? <Download size={10} /> : <Eye size={10} />}
                        {item.action === 'download' ? 'Download' : 'View Snapshot'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-neutral-black/60">
                      {item.timestamp?.toDate().toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {Object.keys(item.contentSnapshot).map(field => (
                          <span key={field} className="text-[10px] font-mono text-brand-accent-4">
                            [{field}]
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-neutral-black/40 italic">
                    No recent activity found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
