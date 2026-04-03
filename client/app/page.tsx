"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, Loader2, Lock, User, BadgeCheck, AlertCircle, CheckCircle, RefreshCw, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [isRegister, setIsRegister] = useState(false);
  // NEW: Added email to formData
  const [formData, setFormData] = useState({ fullName: '', email: '', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState({ idPattern: '', allowedDomain: '' });
  
  const [migrationMode, setMigrationMode] = useState(false);
  const [newId, setNewId] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if(API_URL) {
        axios.get(`${API_URL}/public-settings`)
        .then(res => setRules(res.data))
        .catch(() => setError("System Offline"));
    }
  }, [API_URL]);

  const isValidPassword = (pwd: string) => /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/.test(pwd);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);

    if (!API_URL) { setError("Config Missing (.env)"); setLoading(false); return; }

    // CLIENT VALIDATION
    if (isRegister) {
        if (!isValidPassword(formData.password)) {
            setError("Password too weak (Min 8 chars, 1 Num, 1 Special)");
            setLoading(false); return;
        }
        // NEW: STRICT DOMAIN CHECK
        if (rules.allowedDomain && !formData.email.endsWith(rules.allowedDomain)) {
            setError(`Security Policy: Email must end with ${rules.allowedDomain}`);
            setLoading(false); return;
        }
        if (rules.idPattern && !new RegExp(rules.idPattern).test(formData.username)) {
            setError(`Invalid ID Format. Required: ${rules.idPattern}`);
            setLoading(false); return;
        }
    }

    const endpoint = isRegister ? '/register' : '/login';
    
    try {
      const res = await axios.post(`${API_URL}${endpoint}`, formData);
      if (!isRegister) {
        localStorage.setItem('token', res.data.token);
        
        if (res.data.role === 'trapped_ghost') {
            router.push('/honeypot'); 
        } 
        else if (res.data.role === 'admin') {
            router.push('/sys-mainframe-root'); 
        } 
        else {
            router.push('/dashboard');
        }

      } else {
        setSuccess("ID Registered. Please Log In.");
        setIsRegister(false);
      }
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.message === "MIGRATION_REQUIRED") {
          setMigrationMode(true); 
      } else {
          setError(err.response?.data?.message || "Connection Failed");
      }
    } finally {
        if(!migrationMode) setLoading(false);
    }
  };

  const handleMigration = async () => {
      if(!newId) return;
      try {
          await axios.post(`${API_URL}/migrate-id`, { 
              oldId: formData.username, 
              password: formData.password, 
              newId 
          });
          setSuccess("ID Updated! Login with new ID.");
          setMigrationMode(false);
          setFormData({ ...formData, username: newId });
      } catch (err: any) {
          setError(err.response?.data?.message || "Migration Failed");
      }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#05070a] relative overflow-hidden font-sans">
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <a href="/honeypot" className="opacity-0 absolute bottom-0 left-0 text-[1px] pointer-events-auto cursor-default" tabIndex={-1}>
        Debug: Administrator System Recovery Console
      </a>

      <AnimatePresence>
          {error && <motion.div initial={{y:-50, opacity:0}} animate={{y:0, opacity:1}} exit={{opacity:0}} className="fixed top-5 bg-red-500/20 border border-red-500 text-red-200 px-6 py-3 rounded-xl backdrop-blur-md flex items-center gap-2 shadow-lg z-50"><AlertCircle size={18}/> {error}</motion.div>}
          {success && <motion.div initial={{y:-50, opacity:0}} animate={{y:0, opacity:1}} exit={{opacity:0}} className="fixed top-5 bg-emerald-500/20 border border-emerald-500 text-emerald-200 px-6 py-3 rounded-xl backdrop-blur-md flex items-center gap-2 shadow-lg z-50"><CheckCircle size={18}/> {success}</motion.div>}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-[450px] p-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative">
          
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 mb-4 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]"><ShieldCheck size={32} className="text-emerald-400" /></div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1 uppercase">{isRegister ? 'New Agent' : 'Secure Login'}</h1>
            <p className="text-slate-400 text-xs tracking-widest uppercase">Identity Verification Protocol</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
               <>
                 <div className="relative group">
                    <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="text" required placeholder="Full Legal Name" className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all" onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                 </div>
                 {/* NEW: Official Email Field */}
                 <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="email" required placeholder={`Official Email (${rules.allowedDomain || '@domain.com'})`} className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all" onChange={(e) => setFormData({...formData, email: e.target.value})} />
                 </div>
               </>
            )}
            
            <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="text" required placeholder={isRegister && rules.idPattern ? `ID Format: ${rules.idPattern}` : "Corporate ID"} className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all" onChange={(e) => setFormData({...formData, username: e.target.value})} />
            </div>
            
            <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="password" required placeholder="Passcode" className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all" onChange={(e) => setFormData({...formData, password: e.target.value})} />
                {isRegister && formData.password && !isValidPassword(formData.password) && (
                    <span className="text-[10px] text-red-400 absolute -bottom-4 left-2">Weak: Need 8+ chars, number, special char</span>
                )}
            </div>

            <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 mt-6">
              {loading ? <Loader2 className="animate-spin" size={22}/> : <>{isRegister ? 'Register' : 'Authenticate'} <ArrowRight size={18} /></>}
            </button>
          </form>
          <div className="mt-6 text-center"><button onClick={() => {setIsRegister(!isRegister); setError(''); setSuccess('')}} className="text-slate-500 text-xs hover:text-white transition-colors uppercase tracking-wider">{isRegister ? "Login" : "Register ID" }</button></div>
        </div>
      </motion.div>

      {/* MIGRATION MODAL */}
      <AnimatePresence>
          {migrationMode && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                      <div className="flex flex-col items-center mb-6">
                          <RefreshCw size={40} className="text-emerald-400 animate-spin mb-4"/>
                          <h2 className="text-xl font-bold text-white">Policy Update Required</h2>
                          <p className="text-slate-400 text-sm text-center mt-2">Admin has updated ID protocols. Your old ID <b>{formData.username}</b> is no longer valid. Please rename it to match <b>{rules.idPattern}</b>.</p>
                      </div>
                      <input type="text" placeholder="New ID (e.g. CYBER-2026)" className="w-full bg-black border border-slate-700 rounded-xl p-3 text-white mb-4" onChange={(e) => setNewId(e.target.value)}/>
                      <button onClick={handleMigration} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl text-white font-bold">Migrate & Login</button>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}