"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { 
  Shield, Lock, Unlock, ChevronRight, Briefcase, 
  FileText, Power, UploadCloud, Search, X, CheckCircle, AlertCircle, 
  Activity, Database, LayoutGrid, FolderOpen, Trash2, Edit3, AlertTriangle, 
  Clock, Download 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeptStats {
  count: number;
  hasAccess: boolean;
  expiresAt?: string;
  securityLevel?: 'Low' | 'Medium' | 'High';
}

interface FileItem {
  id: string | number;
  filename: string;
  owner: string;
  ownerName?: string; 
  status: 'Locked' | 'Unlocked';
  department?: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const GlassCard = ({ children, className = "", onClick, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: delay, type: "spring" }}
    whileHover={{ y: -5, scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"/>
    {children}
  </motion.div>
);

const Badge = ({ children, color }: { children: React.ReactNode, color: string }) => (
  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${color} backdrop-blur-md shadow-sm flex items-center gap-1`}>
    {children}
  </span>
);

export default function Dashboard() {
  const [view, setView] = useState<'hub' | 'department'>('hub');
  const [currentDept, setCurrentDept] = useState('');
  const [stats, setStats] = useState<Record<string, DeptStats>>({});
  const [files, setFiles] = useState<FileItem[]>([]);
  const [accessType, setAccessType] = useState('STANDARD');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [username, setUsername] = useState('');
  
  const [modals, setModals] = useState({ auth: false, request: false, upload: false, delete: false, rename: false });
  const [targetFile, setTargetFile] = useState<{id: string|number, name: string} | null>(null);
  const [newNameInput, setNewNameInput] = useState('');

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deptPassword, setDeptPassword] = useState('');
  const [reqData, setReqData] = useState({ department: 'HR', duration: '30', reason: '' });
  
  const [uploadData, setUploadData] = useState<{file: File | null, passcode: string, status: string}>({ 
      file: null, passcode: '', status: 'Locked' 
  });

  const [fullName, setFullName] = useState('');
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const filteredDepartments = Object.keys(stats).filter(dept => dept.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredFiles = files.filter(file => file.filename.toLowerCase().includes(searchTerm.toLowerCase()) || file.owner.toLowerCase().includes(searchTerm.toLowerCase()));

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const closeModal = () => { 
      setModals({ auth: false, request: false, upload: false, delete: false, rename: false }); 
      setTargetFile(null);
      setNewNameInput('');
      setUploadData({ file: null, passcode: '', status: 'Locked' });
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/');
    try {
      const res = await axios.get(`${API_URL}/dashboard-stats`, { headers: { Authorization: `Bearer ${token}` } });
      setStats(res.data.stats);
      setFullName(res.data.fullName);
      setUsername(res.data.username);
    } catch (e: any) {
        if(e.response?.status === 503) showToast("SYSTEM LOCKDOWN ACTIVE", 'error');
        else router.push('/'); 
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const enterDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`${API_URL}/department-data`, { department: currentDept, password: deptPassword }, { headers: { Authorization: `Bearer ${token}` } });
      setFiles(res.data.files);
      setAccessType(res.data.accessType);
      setView('department');
      setSearchTerm('');
      showToast(`Welcome to ${currentDept}`, 'success');
      closeModal();
    } catch (err: any) { 
        if(err.response && err.response.status === 404) {
            showToast("ERROR: Sector Decommissioned", 'error');
            closeModal();
            fetchStats();
        } else {
            showToast("Access Denied: Invalid Credentials", 'error'); 
        }
    } 
    finally { setLoading(false); }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file) return showToast("Please select a valid file", "error");

    setLoading(true);
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    formData.append('file', uploadData.file);
    formData.append('department', currentDept);
    formData.append('passcode', uploadData.passcode);
    formData.append('status', uploadData.status);
    
    try {
      await axios.post(`${API_URL}/upload`, formData, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Secure Physical Upload Complete", 'success');
      closeModal();
      try {
        const res = await axios.post(`${API_URL}/department-data`, { department: currentDept, password: deptPassword }, { headers: { Authorization: `Bearer ${token}` } });
        setFiles(res.data.files);
        fetchStats();
      } catch (refreshErr) {}
    } catch (err: any) { 
        showToast(err.response?.data?.message || "Upload Rejected", 'error'); 
    }
    finally { setLoading(false); }
  };

  const triggerDelete = (id: string|number, name: string) => { setTargetFile({ id, name }); setModals(prev => ({ ...prev, delete: true })); };
  const triggerRename = (id: string|number, name: string) => { setTargetFile({ id, name }); setNewNameInput(name); setModals(prev => ({ ...prev, rename: true })); };

  // --- VIEW FILE FUNCTION ---
  const viewFile = async (fileId: string | number) => {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      try {
          const response = await axios.get(`${API_URL}/view/${fileId}`, {
              headers: { Authorization: `Bearer ${token}` },
              responseType: 'blob' 
          });

          const fileType = response.headers['content-type'] || 'application/pdf';
          const blob = new Blob([response.data], { type: fileType });
          const url = window.URL.createObjectURL(blob);
          
          window.open(url, '_blank');
          showToast("File Opened in Secure Viewer", "success");
      } catch (err) {
          showToast("View Failed: Access Denied", "error");
      } finally {
          setLoading(false);
      }
  };

  // --- DOWNLOAD FUNCTION ---
  const downloadFile = async (fileId: string | number, filename: string) => {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      try {
          const response = await axios.get(`${API_URL}/download/${fileId}`, {
              headers: { Authorization: `Bearer ${token}` },
              responseType: 'blob' 
          });

          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', filename); 
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          
          showToast("Secure Download Complete", "success");
      } catch (err) {
          showToast("Download Failed: Access Denied", "error");
      } finally {
          setLoading(false);
      }
  };

  const confirmDelete = async () => {
      if(!targetFile) return;
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
          await axios.post(`${API_URL}/delete-own-file`, { id: targetFile.id }, { headers: { Authorization: `Bearer ${token}` } });
          setFiles(prev => prev.filter(f => f.id !== targetFile.id));
          showToast("Data Incinerated", 'info');
          fetchStats(); 
          closeModal();
      } catch(e) { showToast("Delete Access Denied", 'error'); }
      finally { setLoading(false); }
  };

  const confirmRename = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!targetFile || !newNameInput) return;
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
          await axios.post(`${API_URL}/rename-file`, { id: targetFile.id, newName: newNameInput }, { headers: { Authorization: `Bearer ${token}` } });
          setFiles(prev => prev.map(f => f.id === targetFile.id ? { ...f, filename: newNameInput } : f));
          showToast("Protocol Rewritten", 'success');
          closeModal();
      } catch(e) { showToast("Rewrite Access Denied", 'error'); }
      finally { setLoading(false); }
  };

  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
        await axios.post(`${API_URL}/request-access`, reqData, { headers: { Authorization: `Bearer ${token}` } });
        showToast("Request Sent for Approval", 'success');
        closeModal();
        fetchStats();
    } catch(e) { showToast("Request Failed", 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-200 font-sans selection:bg-violet-500/30 overflow-x-hidden relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[120px] animate-pulse"/>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000"/>
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-emerald-600/10 rounded-full blur-[100px] animate-pulse delay-700"/>
      </div>

      <div className="fixed top-6 right-6 z-[100] flex flex-col items-end pointer-events-none gap-2">
        <AnimatePresence>
            {toasts.map(t => (
                <motion.div key={t.id} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`px-4 py-3 rounded-2xl backdrop-blur-md shadow-2xl flex items-center gap-3 border ${t.type==='success'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-300':t.type==='error'?'bg-red-500/10 border-red-500/20 text-red-300':'bg-blue-500/10 border-blue-500/20 text-blue-300'}`}>
                    {t.type==='success'?<CheckCircle size={18}/>:t.type==='error'?<AlertCircle size={18}/>:<Activity size={18}/>}
                    <span className="text-sm font-medium">{t.message}</span>
                </motion.div>
            ))}
        </AnimatePresence>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-10 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Shield className="text-white" size={28}/>
            </div>
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">SecureVault</h1>
                <p className="text-sm text-slate-400 font-medium">Welcome back, {fullName}</p>
            </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 w-full md:w-auto bg-white/5 border border-white/10 p-2 rounded-3xl backdrop-blur-md shadow-xl">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={view === 'hub' ? "Filter Departments..." : "Search Files..."} className="w-full bg-transparent border-none outline-none text-sm text-white pl-11 pr-4 placeholder-slate-500" />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2"><X size={14} className="text-slate-500 hover:text-white"/></button>}
            </div>
            {view === 'hub' && <button onClick={() => setModals({ ...modals, request: true })} className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all" title="Request Access"><Lock size={18}/></button>}
            <button onClick={() => { localStorage.clear(); router.push('/'); }} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-3 rounded-full transition-all" title="Logout"><Power size={18}/></button>
          </motion.div>
        </header>

        <AnimatePresence mode='wait'>
            {view === 'hub' && (
                <motion.div key="hub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                    <div className="flex items-center gap-2 mb-6">
                        <LayoutGrid size={18} className="text-violet-400"/>
                        <h2 className="text-lg font-medium text-slate-300">Available Sectors</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDepartments.map((dept, i) => {
                            const info = stats[dept] || { count: 0, hasAccess: false };
                            const isUnlocked = info.hasAccess;
                            return (
                                <GlassCard key={dept} delay={i * 0.05} onClick={() => { setCurrentDept(dept); setDeptPassword(''); setModals({...modals, auth: true}) }} className="group cursor-pointer hover:border-violet-500/30">
                                    <div className="p-8">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className={`p-4 rounded-2xl ${isUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-400 group-hover:text-white'} transition-colors`}><Briefcase size={28}/></div>
                                            <Badge color={isUnlocked ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'}>{isUnlocked ? 'AUTHORIZED' : 'RESTRICTED'}</Badge>
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">{dept}</h3>
                                        <div className="flex items-center justify-between text-sm text-slate-400">
                                            <span>{info.count} Encrypted Files</span>
                                            <span className={`text-[10px] font-bold ${info.securityLevel==='High'?'text-red-400':info.securityLevel==='Medium'?'text-amber-400':'text-blue-400'}`}>LVL: {info.securityLevel?.toUpperCase() || 'STD'}</span>
                                        </div>
                                        {isUnlocked && <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-emerald-300 font-medium"><Clock size={12}/> Expires: {new Date(info.expiresAt!).toLocaleTimeString()}</div>}
                                    </div>
                                </GlassCard>
                            )
                        })}
                    </div>
                </motion.div>
            )}

            {view === 'department' && (
                <motion.div key="dept" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.3 }}>
                    <div className="flex justify-between items-center mb-8">
                        <button onClick={() => setView('hub')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5"><ChevronRight className="rotate-180" size={20}/> Back to Hub</button>
                        <button onClick={() => setModals({...modals, upload: true})} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-violet-500/20 flex items-center gap-2 transition-all active:scale-95"><UploadCloud size={18}/> Upload Physical File</button>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl">
                        <div className="flex items-end justify-between mb-8 pb-6 border-b border-white/10">
                            <div><h2 className="text-4xl font-bold text-white mb-2">{currentDept}</h2><p className="text-slate-400 flex items-center gap-2"><FolderOpen size={16} className="text-violet-400"/> / Root / {currentDept} / <span className="text-violet-400 font-bold">{accessType}</span></p></div>
                            <div className="text-right hidden sm:block"><span className="text-4xl font-bold text-white block">{files.length}</span><span className="text-sm text-slate-500 uppercase tracking-wider">Total Documents</span></div>
                        </div>
                        {filteredFiles.length === 0 ? <div className="text-center py-20"><div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4"><Database className="text-slate-600" size={32}/></div><p className="text-slate-500">No matching files found.</p></div> : 
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredFiles.map((file, i) => (
                                    <motion.div 
                                        key={file.id} 
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        transition={{ delay: i * 0.03 }} 
                                        onClick={() => viewFile(file.id)} 
                                        className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-violet-500/30 rounded-2xl p-5 cursor-pointer transition-all shadow-lg hover:shadow-violet-500/10"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-black/20 rounded-xl text-violet-400 group-hover:scale-110 transition-transform"><FileText size={20}/></div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); downloadFile(file.id, file.filename); }} 
                                                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                                                    title="Download Physical Copy"
                                                >
                                                    <Download size={14}/>
                                                </button>

                                                {file.owner === username && (
                                                    <>
                                                        <button onClick={(e) => { e.stopPropagation(); triggerRename(file.id, file.filename); }} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"><Edit3 size={14}/></button>
                                                        <button onClick={(e) => { e.stopPropagation(); triggerDelete(file.id, file.filename); }} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={14}/></button>
                                                    </>
                                                )}
                                                {file.status === 'Locked' ? <Lock size={16} className="text-amber-500/70 mt-1"/> : <Unlock size={16} className="text-emerald-500/70 mt-1"/>}
                                            </div>
                                        </div>
                                        <h4 className="text-white font-medium truncate mb-1 group-hover:text-violet-300 transition-colors">{file.filename}</h4>
                                        <p className="text-xs text-slate-500 truncate">
                                            By {file.ownerName || file.owner} <span className="opacity-50">({file.owner})</span>
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        }
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {(modals.auth || modals.request || modals.upload || modals.delete || modals.rename) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={closeModal}>
                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-[#0F1218] border border-white/10 shadow-2xl rounded-3xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"/>
                        <div className="p-8 relative z-10">
                            
                            {modals.delete && (
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse border border-red-500/30"><AlertTriangle size={32} className="text-red-500"/></div>
                                    <h3 className="text-2xl font-bold text-white tracking-tight">Incinerate Data?</h3>
                                    <p className="text-slate-400 text-sm">Permanently purge <span className="text-white font-mono bg-white/10 px-1 rounded">{targetFile?.name}</span>? This deletes the physical file from the server.</p>
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <button onClick={closeModal} className="py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 font-medium transition-all">Abort</button>
                                        <button onClick={confirmDelete} disabled={loading} className="py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 transition-all">{loading ? <Activity className="animate-spin" size={18}/> : <><Trash2 size={18}/> INCINERATE</>}</button>
                                    </div>
                                </div>
                            )}

                            {modals.rename && (
                                <form onSubmit={confirmRename} className="space-y-4">
                                    <div className="flex justify-between items-center mb-2"><h3 className="text-xl font-bold text-white flex items-center gap-2"><Edit3 size={20} className="text-blue-400"/> Rewrite Protocol</h3><button type="button" onClick={closeModal}><X size={20} className="text-slate-400 hover:text-white"/></button></div>
                                    <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Current Filename</label><div className="text-sm text-white font-mono mb-4 border-b border-white/10 pb-2">{targetFile?.name}</div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">New Designation</label><input autoFocus type="text" value={newNameInput} onChange={e=>setNewNameInput(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-all font-mono"/></div>
                                    <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all mt-4">{loading ? <Activity className="animate-spin" size={18}/> : "EXECUTE REWRITE"}</button>
                                </form>
                            )}

                            {modals.auth && <form onSubmit={enterDepartment} className="space-y-6"><div className="flex justify-between mb-4"><h3 className="text-xl font-bold text-white">Security Check</h3><button type="button" onClick={closeModal}><X size={20} className="text-slate-400"/></button></div><div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Password</label><input autoFocus type="password" value={deptPassword} onChange={e=>setDeptPassword(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:border-violet-500 outline-none transition-all" placeholder="Enter credentials..."/></div><button disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-violet-500/20 transition-all flex justify-center items-center gap-2">{loading ? <Activity className="animate-spin"/> : <>Unlock <ChevronRight size={18}/></>}</button></form>}
                            
                            {modals.request && <form onSubmit={sendRequest} className="space-y-4"><div className="flex justify-between mb-2"><h3 className="text-xl font-bold text-white">Access Request</h3><button type="button" onClick={closeModal}><X size={20} className="text-slate-400"/></button></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Department</label><select className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none" onChange={e=>setReqData({...reqData, department: e.target.value})}>{Object.keys(stats).map(d=><option key={d} value={d}>{d}</option>)}</select></div><div><label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Duration</label><select className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none" onChange={e=>setReqData({...reqData, duration: e.target.value})}><option value="15">15 Min</option><option value="30">30 Min</option><option value="60">1 Hour</option></select></div></div><div><label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Reason</label><textarea rows={3} placeholder="Why do you need access?" className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none resize-none" onChange={e=>setReqData({...reqData, reason: e.target.value})}/></div><button disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-all">{loading ? 'Sending...' : 'Send Request'}</button></form>}
                            
                            {modals.upload && (
                                <form onSubmit={handleUpload} className="space-y-4">
                                    <div className="flex justify-between mb-2">
                                        <h3 className="text-xl font-bold text-white">Upload Physical File</h3>
                                        <button type="button" onClick={closeModal}><X size={20} className="text-slate-400"/></button>
                                    </div>
                                    <div className="relative group">
                                        <input 
                                            type="file" 
                                            required
                                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-violet-500 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-500/20 file:text-violet-400 hover:file:bg-violet-500/30" 
                                            onChange={e=>setUploadData({...uploadData, file: e.target.files ? e.target.files[0] : null})}
                                        />
                                        <p className="text-[10px] text-slate-500 mt-2">Allowed: PDF, JPG, PNG, DOCX, TXT. (Max 10MB)</p>
                                    </div>
                                    <input type="password" required placeholder="Verify Password" className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-violet-500" onChange={e=>setUploadData({...uploadData, passcode: e.target.value})}/>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={()=>setUploadData({...uploadData, status:'Locked'})} className={`flex-1 p-3 rounded-xl border text-sm font-bold transition-all ${uploadData.status==='Locked'?'bg-amber-500/20 border-amber-500 text-amber-400':'border-white/10 text-slate-500'}`}>Private</button>
                                        <button type="button" onClick={()=>setUploadData({...uploadData, status:'Unlocked'})} className={`flex-1 p-3 rounded-xl border text-sm font-bold transition-all ${uploadData.status==='Unlocked'?'bg-emerald-500/20 border-emerald-500 text-emerald-400':'border-white/10 text-slate-500'}`}>Public</button>
                                    </div>
                                    <button disabled={loading} className="w-full bg-white hover:bg-slate-200 text-black font-bold py-3 rounded-xl transition-all shadow-lg">
                                        {loading ? <Activity className="animate-spin mx-auto" size={20}/> : 'Encrypt & Upload'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}