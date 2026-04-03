"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Save, Trash2, Terminal, Database, LogOut, Check, X, User, Siren, Settings, Plus, Lock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminConsole() {
  const [data, setData] = useState<any>({ 
      settings: { allowedDomain: '', idPattern: '', lockdown: false, sectors: [] }, 
      files: [], 
      requests: [], 
      logs: [] 
  });
  const [editSettings, setEditSettings] = useState({ allowedDomain: '', idPattern: '' });
  
  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorLevel, setNewSectorLevel] = useState('Medium');
  const [sectorToDelete, setSectorToDelete] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/');
    try {
        const res = await axios.get(`${API_URL}/admin/data`, { headers: { Authorization: `Bearer ${token}` } });
        setData(res.data);
        if (loading) {
            setEditSettings({ 
                allowedDomain: res.data.settings.allowedDomain, 
                idPattern: res.data.settings.idPattern 
            });
        }
        setLoading(false);
    } catch (e) { router.push('/'); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await axios.get(`${API_URL}/admin/data`, { headers: { Authorization: `Bearer ${token}` } });
            setData((prev: any) => ({
                ...prev,
                files: res.data.files,
                requests: res.data.requests,
                logs: res.data.logs,
                settings: { ...prev.settings, lockdown: res.data.settings.lockdown, sectors: res.data.settings.sectors } 
            }));
        } catch (e) {}
    }, 3000); 
    return () => clearInterval(interval);
  }, []);

  const saveFirewallRules = async () => {
      const token = localStorage.getItem('token');
      const newSettings = { ...editSettings, lockdown: data.settings.lockdown };
      await axios.post(`${API_URL}/admin/settings`, newSettings, { headers: { Authorization: `Bearer ${token}` } });
      alert("FIREWALL RULES UPDATED");
      fetchData();
  };

  const toggleLockdown = async () => {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/admin/lockdown`, { enabled: !data.settings.lockdown }, { headers: { Authorization: `Bearer ${token}` } });
      setData((prev: any) => ({ ...prev, settings: { ...prev.settings, lockdown: !prev.settings.lockdown } }));
  };

  const handleRequest = async (requestId: string, action: 'Approve' | 'Deny') => {
      const token = localStorage.getItem('token');
      setData((prev: any) => ({
          ...prev,
          requests: prev.requests.map((r:any) => r.id === requestId ? {...r, status: action === 'Approve' ? 'Approved' : 'Denied'} : r)
      }));
      await axios.post(`${API_URL}/admin/approve-request`, { requestId, action }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
  };

  const deleteFile = async (id: any) => {
      if(!confirm("PERMANENTLY DELETE FILE?")) return;
      const token = localStorage.getItem('token');
      setData((prev: any) => ({ ...prev, files: prev.files.filter((f:any) => f.id !== id) }));
      await axios.post(`${API_URL}/admin/delete-file`, { id }, { headers: { Authorization: `Bearer ${token}` } });
  };

  const addSector = async () => {
      if(!newSectorName) return;
      const token = localStorage.getItem('token');
      const newSectorObj = { name: newSectorName, level: newSectorLevel };
      const updatedSectors = [...(data.settings.sectors || []), newSectorObj];
      setData((prev: any) => ({ ...prev, settings: { ...prev.settings, sectors: updatedSectors }}));
      setNewSectorName('');
      await axios.post(`${API_URL}/admin/add-sector`, newSectorObj, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
  };

  const initiateDeleteSector = (name: string) => { setSectorToDelete(name); };
  const confirmDeleteSector = async () => {
      if(!sectorToDelete) return;
      const token = localStorage.getItem('token');
      const updatedSectors = data.settings.sectors.filter((s: any) => (typeof s === 'string' ? s : s.name) !== sectorToDelete);
      setData((prev: any) => ({ ...prev, settings: { ...prev.settings, sectors: updatedSectors }}));
      await axios.post(`${API_URL}/admin/delete-sector`, { name: sectorToDelete }, { headers: { Authorization: `Bearer ${token}` } });
      setSectorToDelete(null);
      fetchData();
  };

  if (loading) return <div className="bg-black h-screen text-green-500 font-mono flex items-center justify-center">INITIALIZING ROOT...</div>;

  const isLockdown = data.settings.lockdown;
  const theme = isLockdown ? 'text-red-500 border-red-500 selection:bg-red-900' : 'text-green-500 border-green-500 selection:bg-green-900';
  const inputTheme = isLockdown ? 'bg-red-900/10 border-red-500 text-red-500 placeholder-red-800' : 'bg-green-900/10 border-green-500 text-green-500 placeholder-green-800';
  const btnHover = isLockdown ? 'hover:bg-red-500 hover:text-black' : 'hover:bg-green-500 hover:text-black';

  return (
    <div className={`scanline-container min-h-screen bg-black font-mono p-4 lg:p-8 transition-colors duration-500 ${theme}`}>
      <header className={`flex flex-col md:flex-row justify-between items-center mb-8 border-b pb-6 gap-4 ${theme}`}>
        <div className="flex items-center gap-4 w-full md:w-auto">
             <div className={`p-3 border ${theme}`}><ShieldAlert size={32} className={isLockdown ? 'animate-pulse' : ''}/></div>
             <div><h1 className="text-2xl md:text-3xl font-bold tracking-widest uppercase">ADMIN</h1><p className="text-xs opacity-70">{isLockdown ? '⚠ CRITICAL: SYSTEM LOCKDOWN ACTIVE' : 'STATUS: NORMAL OPERATIONS'}</p></div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
            <button onClick={toggleLockdown} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 border font-bold transition-colors ${btnHover} ${isLockdown ? 'bg-red-900/20 animate-pulse' : ''}`}><Siren size={20}/> {isLockdown ? 'LIFT LOCKDOWN' : 'INITIATE LOCKDOWN'}</button>
            <button onClick={() => {localStorage.clear(); router.push('/')}} className={`border px-4 py-2 transition-colors ${btnHover}`}><LogOut size={20}/></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-8">
              <div className={`border p-5 ${theme}`}>
                  <div className="flex items-center gap-2 border-b pb-2 mb-4 font-bold"><Settings size={18}/> FIREWALL RULES</div>
                  <div className="space-y-4">
                      <div><label className="text-xs opacity-70 block mb-1">STRICT DOMAIN POLICY</label><input type="text" value={editSettings.allowedDomain} onChange={e => setEditSettings({...editSettings, allowedDomain: e.target.value})} className={`w-full p-2 border bg-black outline-none font-mono text-sm ${inputTheme}`}/></div>
                      <div><label className="text-xs opacity-70 block mb-1">ID REGEX PATTERN</label><input type="text" value={editSettings.idPattern} onChange={e => setEditSettings({...editSettings, idPattern: e.target.value})} className={`w-full p-2 border bg-black outline-none font-mono text-sm ${inputTheme}`}/></div>
                      <button onClick={saveFirewallRules} className={`w-full py-2 border font-bold flex items-center justify-center gap-2 ${theme} ${btnHover}`}><Save size={16}/> UPDATE PROTOCOLS</button>
                  </div>
              </div>

              {/* SECTOR MANAGEMENT */}
              <div className={`border p-5 ${theme}`}>
                  <div className="flex items-center gap-2 border-b pb-2 mb-4 font-bold"><Database size={18}/> SECTOR MANAGEMENT</div>
                  <div className="space-y-4">
                      <div className="flex gap-2">
                          <input type="text" placeholder="NAME..." value={newSectorName} onChange={e => setNewSectorName(e.target.value)} className={`flex-1 p-2 border bg-black outline-none font-mono text-sm ${inputTheme}`}/>
                          
                          {/* THEMED DROPDOWN (Corrected) */}
                          <select 
                            value={newSectorLevel} 
                            onChange={e => setNewSectorLevel(e.target.value)} 
                            className={`w-28 p-2 border outline-none font-mono text-xs ${inputTheme} text-current appearance-none cursor-pointer`}
                          >
                              <option value="Low" className="bg-black">LOW</option>
                              <option value="Medium" className="bg-black">MED</option>
                              <option value="High" className="bg-black">HIGH</option>
                              <option value="Critical" className="bg-black">CRIT</option>
                          </select>
                          
                          <button onClick={addSector} className={`px-3 border font-bold ${theme} ${btnHover}`}><Plus size={16}/></button>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {data.settings.sectors && data.settings.sectors.map((sector: any) => {
                              const name = typeof sector === 'string' ? sector : sector.name;
                              const level = typeof sector === 'string' ? 'STD' : sector.level;
                              return (
                                  <div key={name} className={`flex justify-between items-center p-2 border ${theme} bg-transparent hover:bg-white/5 transition-colors`}>
                                      <div><span className="text-sm font-bold block uppercase">{name}</span><span className="text-[10px] opacity-60 flex items-center gap-1"><Lock size={8}/> LEVEL: {level}</span></div>
                                      <button onClick={() => initiateDeleteSector(name)} className={`p-1 ${theme} hover:text-white hover:bg-red-600 transition-colors border border-transparent hover:border-red-600`}><Trash2 size={14}/></button>
                                  </div>
                              )
                          })}
                      </div>
                  </div>
              </div>

              <div className={`border p-5 flex-1 ${theme}`}>
                  <div className="flex items-center gap-2 border-b pb-2 mb-4 font-bold"><User size={18}/> PENDING CLEARANCE</div>
                  <div className="overflow-y-auto max-h-[300px] space-y-3">
                      {data.requests.filter((r:any) => r.status==='Pending').length === 0 && <div className="text-center opacity-50 py-4 text-sm">NO PENDING REQUESTS</div>}
                      {data.requests.filter((r:any) => r.status==='Pending').map((r: any) => (
                          <div key={r.id} className="p-3 border border-current bg-white/5">
                              <div className="flex justify-between items-start mb-2"><span className="font-bold text-sm">{r.username}</span><span className="text-[10px] opacity-70">{new Date(r.requestedAt).toLocaleTimeString()}</span></div>
                              <div className="text-xs mb-3 opacity-80">REQ: <span className="font-bold">{r.department}</span> ({r.duration}m)<br/>REASON: "{r.reason}"</div>
                              <div className="grid grid-cols-2 gap-2">
                                  <button onClick={() => handleRequest(r.id, 'Deny')} className="py-1 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black flex justify-center items-center transition-colors"><X size={16}/></button>
                                  <button onClick={() => handleRequest(r.id, 'Approve')} className="py-1 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black flex justify-center items-center transition-colors"><Check size={16}/></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
          <div className="lg:col-span-2 space-y-8">
              <div className={`border p-4 h-[400px] flex flex-col ${theme}`}>
                  <div className="flex items-center gap-2 border-b pb-2 mb-2 font-bold"><Terminal size={16}/> LIVE AUDIT STREAM</div>
                  <div className="overflow-y-auto flex-1 font-xs space-y-1 pr-2">
                      {data.logs.map((log: any, i: number) => (
                          <div key={log.id || i} className="flex gap-4 border-b border-white/5 pb-1 hover:bg-white/5 text-xs">
                              <span className="opacity-50 w-24 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                              <span className={`w-14 shrink-0 font-bold ${log.type === 'ALERT' ? 'text-red-500 animate-pulse' : log.type==='WARN'?'text-yellow-500':'text-blue-500'}`}>{log.type}</span>
                              <span className="flex-1 break-all">{log.message}</span>
                              <span className="opacity-50 w-24 shrink-0 truncate text-right">{log.user}</span>
                          </div>
                      ))}
                  </div>
              </div>
              <div className={`border p-4 h-[300px] flex flex-col ${theme}`}>
                   <div className="flex items-center gap-2 border-b pb-2 mb-2 font-bold"><Database size={16}/> ENCRYPTED REPOSITORY ({data.files.length})</div>
                   <div className="overflow-y-auto flex-1 text-xs pr-2">
                       {data.files.map((f: any, i: number) => (
                           <div key={f.id || i} className="grid grid-cols-12 items-center py-2 border-b border-white/10 hover:bg-white/5">
                               <div className="col-span-4 font-bold truncate pr-2">{f.filename}</div>
                               <div className="col-span-3 opacity-70">{f.department}</div>
                               <div className="col-span-3 opacity-50 truncate">{f.owner}</div>
                               <div className="col-span-2 text-right"><button onClick={() => deleteFile(f.id)} className="text-red-500 hover:text-white transition-colors p-1"><Trash2 size={14}/></button></div>
                           </div>
                       ))}
                   </div>
              </div>
          </div>

          <AnimatePresence>
            {sectorToDelete && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} className={`w-full max-w-md bg-black border-2 ${theme} shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 relative`}>
                        <div className="text-center space-y-6">
                            <div className={`w-16 h-16 mx-auto border-2 rounded-full flex items-center justify-center ${isLockdown ? 'border-red-500 bg-red-900/20' : 'border-green-500 bg-green-900/20'}`}><AlertTriangle size={32} className={isLockdown ? 'text-red-500' : 'text-green-500'}/></div>
                            <div>
                                <h3 className={`text-xl font-bold uppercase tracking-widest mb-2 ${isLockdown ? 'text-red-500' : 'text-green-500'}`}>Purge Sector?</h3>
                                <p className="text-white font-mono text-xs opacity-80 leading-relaxed">WARNING: Deleting sector <span className="font-bold border-b border-white/50">{sectorToDelete}</span> will result in immediate data loss. This action overrides all security protocols.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setSectorToDelete(null)} className={`py-3 border font-bold hover:bg-white/10 transition-colors uppercase text-xs ${theme}`}>Cancel</button>
                                <button onClick={confirmDeleteSector} className="py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-xs shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all">Confirm Purge</button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
          </AnimatePresence>
      </div>
    </div>
  );
}