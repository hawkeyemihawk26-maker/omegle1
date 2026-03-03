import React from 'react';
import { Wifi, WifiOff, TestTube, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { DEMO_MODE } from '../constants';

interface HeaderProps {
  isConnected: boolean;
  onlineCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ isConnected, onlineCount }) => {
  return (
    <header className="h-16 glass-header flex items-center justify-between px-4 sm:px-8 fixed top-0 w-full z-50">
      <div className="flex items-center gap-3">
        <motion.div 
          whileHover={{ 
            rotateY: 180,
            scale: 1.1,
            transition: { duration: 0.6 }
          }}
          style={{ perspective: 1000 }}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 cursor-pointer"
        >
          <MessageSquare className="w-5 h-5 text-white fill-current" />
        </motion.div>
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-white">Omegle</span>
          <span className="text-primary">Chat</span>
        </h1>
        {DEMO_MODE && (
           <span className="hidden sm:flex items-center gap-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
             <TestTube className="w-3 h-3" />
             Demo Mode
           </span>
        )}
      </div>
      
      <div className="flex items-center gap-6">
        {onlineCount !== undefined && !DEMO_MODE && (
           <div className="hidden sm:flex flex-col items-end">
             <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Online</span>
             <span className="text-sm text-slate-200 font-mono">{onlineCount}</span>
           </div>
        )}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
          isConnected 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        }`}>
          {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span className="hidden xs:inline uppercase tracking-tight">{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>
    </header>
  );
};