'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRealtime } from '@/hooks/useRealtime';
import { useState, useEffect } from 'react';

export default function Home() {
  const { isConnected } = useRealtime({});
  const [stats, setStats] = useState({ shipments: 0, vehicles: 0 });
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats({ shipments: data.totalShipments || 0, vehicles: data.vehicles?.length || 0 }))
      .catch(() => {});
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 relative overflow-hidden bg-space-black">

      {/* Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-nasa-blue/20 via-space-black to-space-black opacity-50"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-nebula-purple/10 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-glow/10 rounded-full blur-[128px] animate-pulse delay-1000"></div>
      </div>

      <div className="z-10 w-full max-w-7xl flex flex-col items-center">
        
        {/* Status Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex justify-between items-center mb-16 px-4 py-3 rounded-full glass-panel border-white/5"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <code className="font-mono text-xs md:text-sm text-cyan-glow tracking-wider">
              {isConnected ? 'REALTIME: CONNECTED' : 'REALTIME: CONNECTING...'}
            </code>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs font-mono text-gray-400">
            <span className="text-cyan-glow">{stats.shipments} SHIPMENTS</span>
            <span>|</span>
            <span className="text-green-400">{stats.vehicles} VEHICLES</span>
            <span>|</span>
            <span className="text-white">{currentTime || '--:--:--'}</span>
          </div>
        </motion.div>

        {/* Hero Section */}
        <div className="relative z-10 flex flex-col items-center justify-center py-10 md:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <h1 className="text-7xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 mb-2 tracking-tighter font-sans">
              LOGIQ
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-glow to-nebula-purple opacity-20 blur-2xl -z-10"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-col items-center gap-4 mb-16"
          >
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-cyan-glow to-transparent"></div>
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl font-light tracking-wide">
              Autonomous Logistics Management System
            </p>
            <span className="px-3 py-1 rounded-full bg-nasa-blue/20 border border-nasa-blue/50 text-cyan-glow text-xs font-mono tracking-widest uppercase">
              Powered by Next-Gen OOP Architecture
            </span>
          </motion.div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
            <Link href="/dashboard/customer" className="group w-full">
              <motion.div 
                whileHover={{ y: -5 }}
                className="glass-card p-8 rounded-2xl h-full flex flex-col items-center text-center group-hover:border-cyan-glow/50"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-glow/20 to-nasa-blue/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5 shadow-[0_0_15px_rgba(0,217,255,0.1)]">
                  <svg className="w-8 h-8 text-cyan-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white font-mono group-hover:text-cyan-glow transition-colors">Customer</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Initiate shipments and track cargo across the global network using our polymorphic fleet.</p>
              </motion.div>
            </Link>

            <Link href="/dashboard/driver" className="group w-full">
              <motion.div 
                whileHover={{ y: -5 }}
                className="glass-card p-8 rounded-2xl h-full flex flex-col items-center text-center group-hover:border-nasa-red/50"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nasa-red/20 to-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5 shadow-[0_0_15px_rgba(252,61,33,0.1)]">
                  <svg className="w-8 h-8 text-nasa-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white font-mono group-hover:text-nasa-red transition-colors">Driver</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Access mission control, accept assignments, and manage delivery vectors.</p>
              </motion.div>
            </Link>

            <Link href="/dashboard/admin" className="group w-full">
              <motion.div 
                whileHover={{ y: -5 }}
                className="glass-card p-8 rounded-2xl h-full flex flex-col items-center text-center group-hover:border-nebula-purple/50"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nebula-purple/20 to-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                  <svg className="w-8 h-8 text-nebula-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white font-mono group-hover:text-nebula-purple transition-colors">Admin</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Oversee system telemetry, fleet analytics, and global logistics operations.</p>
              </motion.div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
