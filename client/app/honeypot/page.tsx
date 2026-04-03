
"use client";
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
  AlertTriangle, Lock, ShieldAlert, Terminal, 
  MapPin, Skull, Activity, Radio, XCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrapPage() {
  const [stage, setStage] = useState(0); // 0: Bait, 1: Glitch, 2: Lockdown
  const [hackerInfo, setHackerInfo] = useState({ ip: 'TRACING...', city: 'UNKNOWN', isp: 'UNKNOWN', lat: 0, lon: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ENV LINK
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const IP_API_URL = process.env.NEXT_PUBLIC_IP_API;

  const forensicData = [
    "INITIATING COUNTER-MEASURES...",
    "BYPASSING PROXY CHAIN...",
    "TRIANGULATING SIGNAL...",
    "PACKET CAPTURE: SUCCESS",
    "DECRYPTING SSL TRAFFIC...",
    "IDENTITY CONFIRMED.",
    "SENDING GPS DATA TO ADMIN...",
    "SYSTEM LOCKDOWN ENGAGED."
  ];

  useEffect(() => {
    const springTrap = async () => {
      try {
        // 1. SILENT TRACE (During Bait Phase)
        const res = await axios.get(IP_API_URL || 'https://ipapi.co/json/');
        const { ip, city, region, country_name, org, latitude, longitude } = res.data;
        
        setHackerInfo({ 
            ip, 
            city: `${city}, ${region}, ${country_name}`, 
            isp: org,
            lat: latitude,
            lon: longitude
        });

        // 2. TRIGGER BACKEND ALARM
        await axios.post(`${API_URL}/trap-trigger`, { 
           ip: ip, userAgent: navigator.userAgent 
        });

        // 3. THE REVEAL SEQUENCE
        setTimeout(() => setStage(1), 3000); // 3s of boring loading
        
        // 4. THE GLITCH PHASE (Rapid Logs)
        let i = 0;
        const logInterval = setInterval(() => {
            if(i >= forensicData.length) {
                clearInterval(logInterval);
                setStage(2); // Final Lockdown
            } else {
                setLogs(prev => [...prev, forensicData[i]]);
                i++;
            }
        }, 400);

      } catch (e) {
        setStage(2); // Fail-safe
      }
    };

    springTrap();
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="min-h-screen bg-black overflow-hidden relative font-mono select-none cursor-not-allowed">
      <style jsx global>{`
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .scanline::after { content: " "; display: block; position: absolute; top: 0; left: 0; bottom: 0; right: 0; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); z-index: 2; background-size: 100% 2px, 3px 100%; pointer-events: none; }
        .glitch-text { animation: glitch 0.3s infinite; }
        @keyframes glitch { 0% { transform: translate(0) } 20% { transform: translate(-2px, 2px) } 40% { transform: translate(-2px, -2px) } 60% { transform: translate(2px, 2px) } 80% { transform: translate(2px, -2px) } 100% { transform: translate(0) } }
      `}</style>

      {/* --- STAGE 0: THE BAIT (Boring Admin Loader) --- */}
      <AnimatePresence>
        {stage === 0 && (
            <motion.div 
                exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
                className="absolute inset-0 flex items-center justify-center bg-[#f0f0f0] text-slate-800"
            >
                <div className="w-96 p-8 bg-white shadow-xl border border-slate-200 rounded-lg text-center">
                    <Activity className="mx-auto text-blue-600 animate-spin mb-4" size={40}/>
                    <h2 className="text-lg font-bold font-sans">System Recovery Console</h2>
                    <p className="text-xs text-slate-500 mt-2">Verifying Administrative Credentials...</p>
                    <div className="w-full h-1.5 bg-slate-100 mt-6 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 w-1/2 animate-[pulse_1s_infinite]"/>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-sans">Do not close this window.</p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- STAGE 2: THE TRAP (Red Alert) --- */}
      {stage >= 1 && (
        <div className="absolute inset-0 bg-[#050000] text-red-600 scanline p-4 md:p-10 flex flex-col items-center justify-center">
            
            {/* Background flashing */}
            <div className="absolute inset-0 bg-red-600/10 animate-pulse pointer-events-none"/>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif')] opacity-5 mix-blend-overlay pointer-events-none"/>

            <div className="max-w-4xl w-full relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* LEFT: THE WARNING */}
                <div className="flex flex-col justify-center space-y-6">
                    <div className="border-l-4 border-red-600 pl-6">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            className="flex items-center gap-3 mb-2"
                        >
                            <ShieldAlert size={40} className="animate-bounce"/>
                            <h1 className="text-5xl font-black tracking-tighter glitch-text text-white">CAUGHT</h1>
                        </motion.div>
                        <p className="text-xl font-bold uppercase tracking-widest text-red-500">Intrusion Detected</p>
                    </div>

                    <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-none backdrop-blur-sm">
                        <p className="text-sm text-red-400 mb-4 font-bold flex items-center gap-2"><Lock size={14}/> SYSTEM LOCKDOWN ACTIVE</p>
                        <p className="text-xs text-red-300 leading-relaxed opacity-80">
                            You have attempted to access a restricted mainframe. Your digital footprint has been captured, logged, and transmitted to the system administrator. 
                            <br/><br/>
                            This terminal has been frozen to prevent further data exfiltration.
                        </p>
                    </div>
                </div>

                {/* RIGHT: THE FORENSICS (Scare Tactics) */}
                <div className="space-y-4">
                    {/* Simulated Terminal */}
                    <div className="bg-black border border-red-800 p-4 font-mono text-xs h-48 overflow-y-auto shadow-[0_0_30px_rgba(220,38,38,0.2)]" ref={scrollRef}>
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1 text-red-400 border-b border-red-900/20 pb-1">
                                <span className="text-red-700 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                {log}
                            </div>
                        ))}
                        <div className="animate-pulse text-red-500">_</div>
                    </div>

                    {/* Hacker's Own Data Card */}
                    {stage === 2 && (
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-red-900/10 border border-red-600/50 p-6 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-20"><Skull size={64}/></div>
                            
                            <h3 className="text-white font-bold border-b border-red-800 pb-2 mb-4 flex items-center gap-2">
                                <Terminal size={16}/> TARGET IDENTITY ACQUIRED
                            </h3>
                            
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-red-500 text-[10px] uppercase block">IP Address</span>
                                    <span className="text-white font-bold text-lg bg-red-950 px-2">{hackerInfo.ip}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-red-500 text-[10px] uppercase block">Signal Origin</span>
                                        <span className="text-white flex items-center gap-1"><MapPin size={12}/> {hackerInfo.city}</span>
                                    </div>
                                    <div>
                                        <span className="text-red-500 text-[10px] uppercase block">ISP Node</span>
                                        <span className="text-white flex items-center gap-1"><Radio size={12}/> {hackerInfo.isp}</span>
                                    </div>
                                </div>
                                
                                <div className="pt-2">
                                    <span className="text-red-500 text-[10px] uppercase block">Geo-Coordinates</span>
                                    <span className="text-red-300 font-mono text-xs">{hackerInfo.lat.toFixed(4)}, {hackerInfo.lon.toFixed(4)}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="absolute bottom-0 left-0 w-full bg-red-900/20 border-t border-red-800 p-2 flex justify-between items-center px-6 text-[10px] uppercase tracking-widest text-red-500">
                <span className="animate-pulse flex items-center gap-2"><Activity size={12}/> Connection Severed</span>
                <span>Incident ID: {Math.floor(Math.random() * 99999999)}</span>
            </div>

        </div>
      )}
    </div>
  );
}