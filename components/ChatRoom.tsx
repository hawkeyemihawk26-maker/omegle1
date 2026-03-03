import React, { useState, useEffect, useRef } from 'react';
import { Message, PartnerData } from '../types';
import { SkipForward, AlertCircle, User, Zap, StopCircle, CornerDownRight } from 'lucide-react';

interface ChatRoomProps {
  partner: PartnerData;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onNext: () => void;
  onStop: () => void;
  isPartnerDisconnected: boolean;
  isPartnerTyping?: boolean;
  onTyping?: (isTyping: boolean) => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ 
  partner, 
  messages, 
  onSendMessage, 
  onNext, 
  onStop,
  isPartnerDisconnected,
  isPartnerTyping = false,
  onTyping
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping]);

  // Auto-focus input when partner is connected
  useEffect(() => {
    if (!isPartnerDisconnected) {
      inputRef.current?.focus();
    }
  }, [isPartnerDisconnected]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isPartnerDisconnected) return;
    onSendMessage(inputText.trim());
    setInputText('');
    if (onTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
        onStop();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] sm:h-[calc(100vh-100px)] mt-16 max-w-5xl mx-auto w-full px-2 sm:px-6 pb-2 sm:pb-6 transition-all duration-500 ease-out animate-fade-in">
      
      {/* Main Glass Container */}
      <div className="flex-1 glass-panel rounded-2xl sm:rounded-[2rem] flex flex-col overflow-hidden shadow-2xl border border-white/10 relative backdrop-blur-xl">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
        
        {/* Header - HUD Style */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-black/40 border-b border-white/5 z-10">
          <div className="flex items-center gap-4">
            <div className="relative group">
               <div className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${isPartnerDisconnected ? 'bg-slate-800' : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 group-hover:border-primary/50'}`}>
                  <User className={`w-5 h-5 transition-colors ${isPartnerDisconnected ? 'text-slate-500' : 'text-indigo-300'}`} />
               </div>
               <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[3px] border-[#0f111a] transition-all duration-500 ${isPartnerDisconnected ? 'bg-slate-500' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)] animate-pulse'}`} />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 tracking-wide text-sm sm:text-base">
                  {isPartnerDisconnected ? 'Disconnected' : (partner.displayName || 'Stranger')}
                </h3>
                {partner.gender && partner.gender !== 'Other' && (
                  <span className="text-[10px] bg-white/5 px-1.5 rounded text-slate-400 border border-white/5 uppercase tracking-wider font-semibold">{partner.gender.charAt(0)}</span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1 mt-0.5">
                {partner.interests.length > 0 ? (
                    partner.interests.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-[10px] text-indigo-300/80 font-medium">#{tag}</span>
                    ))
                ) : (
                    <span className="text-[10px] text-slate-500 font-medium italic">No common interests</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
             <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Session ID</span>
                <span className="text-[10px] font-mono text-slate-400">{partner.socketId.slice(0, 6)}...</span>
             </div>

            <button 
              onClick={onStop}
              className="group p-2.5 rounded-xl border border-transparent hover:border-rose-500/30 hover:bg-rose-500/10 transition-all duration-200"
              title="End Chat (Esc)"
            >
              <StopCircle className="w-6 h-6 text-slate-400 group-hover:text-rose-400 transition-colors" />
            </button>
            <button 
              onClick={onNext}
              className="group flex items-center gap-2 pl-4 pr-5 py-2.5 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-white/5 hover:border-primary/30 shadow-lg"
            >
              <span className="text-slate-300 group-hover:text-white transition-colors">Next</span>
              <SkipForward className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin bg-gradient-to-b from-black/20 to-transparent relative">
          
          {/* Watermark/Background hint */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
            <Zap className="w-64 h-64" />
          </div>

          <div className="flex justify-center my-6">
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-300 shadow-lg shadow-indigo-500/5">
              Secure Connection Established
            </span>
          </div>

          {messages.map((msg, index) => {
             const isSystem = msg.sender === 'system';
             const isMe = msg.sender === 'me';
             const isFirstInGroup = index === 0 || messages[index - 1].sender !== msg.sender;
             
             if (isSystem) {
               return (
                 <div key={msg.id} className="flex justify-center my-6 animate-fade-in">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 backdrop-blur-md text-xs font-medium text-slate-400 shadow-sm">
                      <AlertCircle className="w-3 h-3" />
                      {msg.text}
                    </div>
                 </div>
               );
             }

             return (
              <div 
                key={msg.id} 
                className={`flex w-full group animate-slide-up ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[85%] sm:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                   
                   {/* Avatar for messages */}
                   <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mb-1 ${!isFirstInGroup ? 'opacity-0' : 'opacity-100'} ${isMe ? 'bg-primary/20' : 'bg-slate-700'}`}>
                      {isMe ? <div className="w-2 h-2 rounded-full bg-primary" /> : <User className="w-3 h-3 text-slate-400" />}
                   </div>

                   <div 
                    className={`relative px-5 py-3.5 text-[15px] leading-relaxed shadow-md backdrop-blur-sm transition-all duration-200 hover:shadow-lg
                      ${isMe 
                        ? 'bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] text-white rounded-2xl rounded-tr-sm border border-white/10' 
                        : 'bg-[#1e293b]/80 border border-white/5 text-slate-100 rounded-2xl rounded-tl-sm hover:bg-[#1e293b]'
                      }
                    `}
                  >
                    {msg.text}
                    <div className={`text-[10px] mt-1 font-medium opacity-0 group-hover:opacity-60 transition-opacity text-right absolute -bottom-5 ${isMe ? 'right-0 text-slate-400' : 'left-0 text-slate-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
             );
          })}
          
          {isPartnerTyping && !isPartnerDisconnected && (
            <div className="flex w-full justify-start animate-fade-in">
              <div className="flex max-w-[85%] sm:max-w-[70%] flex-row items-end gap-2">
                 <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mb-1 bg-slate-700">
                    <User className="w-3 h-3 text-slate-400" />
                 </div>
                 <div className="relative px-5 py-4 bg-[#1e293b]/80 border border-white/5 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
              </div>
            </div>
          )}
          
          {isPartnerDisconnected && (
            <div className="flex flex-col items-center justify-center gap-6 py-12 animate-fade-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.3s', animationName: 'fadeIn' }}>
               <div className="relative">
                 <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full"></div>
                 <div className="relative p-5 rounded-full bg-slate-900 border border-slate-800 shadow-2xl">
                    <User className="w-10 h-10 text-slate-500" />
                 </div>
               </div>
               
               <div className="text-center space-y-1">
                 <h4 className="text-lg font-bold text-white">Stranger disconnected</h4>
                 <p className="text-slate-500 text-sm">The conversation has ended.</p>
               </div>

               <button 
                 onClick={onNext}
                 className="group relative px-8 py-3 bg-white text-black rounded-full text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:scale-105 transition-all overflow-hidden"
               >
                 <span className="relative z-10 flex items-center gap-2">
                   Find New Partner <SkipForward className="w-4 h-4" />
                 </span>
               </button>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-5 bg-black/40 backdrop-blur-xl border-t border-white/5">
          <div className={`relative flex items-center gap-3 transition-all duration-300 ${isPartnerDisconnected ? 'opacity-50 grayscale' : 'opacity-100'}`}>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isPartnerDisconnected}
              placeholder={isPartnerDisconnected ? "Conversation ended." : "Type your message..."}
              className="w-full bg-white/5 hover:bg-white/10 focus:bg-black/50 border border-white/10 hover:border-white/20 focus:border-primary/50 text-slate-100 placeholder-slate-500 rounded-2xl pl-6 pr-32 py-4 outline-none transition-all shadow-inner font-medium"
            />
            
            <div className="absolute right-3 flex items-center gap-2">
                <span className="hidden sm:inline-flex text-[10px] font-mono text-slate-600 border border-white/5 px-2 py-1 rounded bg-black/20">
                    ENTER
                </span>
                <button
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isPartnerDisconnected}
                className="p-2.5 bg-gradient-to-br from-primary to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 active:scale-95 disabled:opacity-0 disabled:scale-75 transition-all duration-300 ease-out"
                >
                <CornerDownRight className="w-5 h-5" />
                </button>
            </div>
          </div>
          
          {!isPartnerDisconnected && (
            <div className="text-[10px] text-slate-600 mt-3 text-center font-medium tracking-wide">
               PRESS <span className="text-slate-500">ESC</span> TO END &middot; PRESS <span className="text-slate-500">ENTER</span> TO SEND
            </div>
          )}
        </div>

      </div>
    </div>
  );
};