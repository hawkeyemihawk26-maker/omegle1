import React, { useState } from 'react';
import { UserPreferences, Gender } from '../types';
import { Play, Plus, X, Globe2, Hash, WifiOff } from 'lucide-react';
import { DEMO_MODE } from '../constants';

interface LandingProps {
  onStart: (prefs: UserPreferences) => void;
  isConnecting: boolean;
  isConnected: boolean;
}

export const Landing: React.FC<LandingProps> = ({ onStart, isConnecting, isConnected }) => {
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<Gender>('Male');
  const [preferredGender, setPreferredGender] = useState<Gender | 'Any'>('Any');
  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  const handleAddInterest = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = interestInput.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
      setInterestInput('');
    }
  };

  const removeInterest = (tag: string) => {
    setInterests(interests.filter(i => i !== tag));
  };

  const handleStart = () => {
    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 18) {
      alert("Please enter a valid age (18+).");
      return;
    }
    onStart({
      displayName: displayName.trim() || 'Stranger',
      age: ageNum,
      gender,
      preferredGender,
      interests
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-20 pb-10 px-4 sm:px-6">
      
      {/* Main Card */}
      <div className="w-full max-w-5xl glass-panel rounded-[2rem] overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-5 min-h-[600px] border-glass-border">
        
        {/* Left Side: Branding */}
        <div className="lg:col-span-2 bg-gradient-to-br from-primary/10 via-background to-background p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-20">
            <Globe2 className="w-64 h-64 text-primary" />
          </div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-medium text-primary mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Global Network
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Connect with <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Anyone, Anywhere.</span>
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Experience the next generation of random chat. Filter by interests, find your tribe, and start the conversation.
            </p>
          </div>

          <div className="relative z-10 pt-10">
            <div className="flex -space-x-3 mb-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                   ?
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-background bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                +1k
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Users Online Now</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-3 p-8 sm:p-12 bg-black/20 flex flex-col justify-center">
          
          {/* Server Offline Warning */}
          {!isConnected && !DEMO_MODE && (
            <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                <WifiOff className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-rose-400">Connection Lost</h4>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Could not connect to Supabase Realtime. Please check your internet connection.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-8">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Alias</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Anonymous"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-primary/50 focus:bg-white/10 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="18"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-primary/50 focus:bg-white/10 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">I am</label>
                <div className="relative">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-primary/50 focus:bg-white/10 outline-none appearance-none cursor-pointer"
                  >
                    <option className="bg-slate-900" value="Male">Male</option>
                    <option className="bg-slate-900" value="Female">Female</option>
                    <option className="bg-slate-900" value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Looking for</label>
                <div className="relative">
                  <select
                    value={preferredGender}
                    onChange={(e) => setPreferredGender(e.target.value as Gender | 'Any')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-primary/50 focus:bg-white/10 outline-none appearance-none cursor-pointer"
                  >
                    <option className="bg-slate-900" value="Any">Anyone</option>
                    <option className="bg-slate-900" value="Male">Male</option>
                    <option className="bg-slate-900" value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Interests</label>
              <div className="relative group">
                <input
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddInterest(e)}
                  placeholder="Add tags (e.g., Music, Tech)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-5 pr-14 py-3.5 text-white focus:border-primary/50 focus:bg-white/10 outline-none transition-all placeholder:text-slate-600"
                />
                <button 
                  onClick={() => handleAddInterest()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/5 hover:bg-primary text-slate-400 hover:text-white rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 min-h-[30px]">
                {interests.map((interest) => (
                  <span key={interest} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-lg border border-primary/20 animate-fade-in">
                    <Hash className="w-3 h-3 opacity-50" />
                    {interest}
                    <button onClick={() => removeInterest(interest)} className="hover:text-white transition-colors ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={isConnecting || (!isConnected && !DEMO_MODE)}
              className="w-full group relative mt-4 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-secondary p-[1px] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="relative h-full w-full bg-slate-900/40 rounded-xl px-8 py-4 transition-all group-hover:bg-opacity-0">
                <div className="flex items-center justify-center gap-2 font-bold text-white tracking-wide uppercase">
                  {isConnecting ? (
                     <span className="animate-pulse">Connecting...</span>
                  ) : !isConnected && !DEMO_MODE ? (
                    <span>Server Offline</span>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Start Chat
                    </>
                  )}
                </div>
              </div>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};
