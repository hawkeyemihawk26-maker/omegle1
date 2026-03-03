import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { Landing } from './components/Landing';
import { ChatRoom } from './components/ChatRoom';
import { soundService } from './services/soundService';
import { 
  joinQueue, 
  leaveQueue, 
  findAndClaimMatch, 
  subscribeToMatches, 
  subscribeToMessages, 
  sendMessage, 
  endMatch,
  subscribeToMatchStatus,
  Match
} from './services/supabaseService';
import { supabase } from './supabaseClient';
import { UserPreferences, ChatState, Message, PartnerData } from './types';
import { Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [appState, setAppState] = useState<ChatState>('landing');
  const [isConnected, setIsConnected] = useState(true); // Supabase is "always connected" via REST/Realtime
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isPartnerDisconnected, setIsPartnerDisconnected] = useState(false);
  const userPreferences = useRef<UserPreferences | null>(null);
  
  // Supabase specific state
  const [userId] = useState(() => {
    const saved = sessionStorage.getItem('omegle_clone_user_id');
    if (saved) return saved;
    const newId = uuidv4();
    sessionStorage.setItem('omegle_clone_user_id', newId);
    return newId;
  });
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const matchChannelRef = useRef<any>(null);
  const statusChannelRef = useRef<any>(null);
  const processedMatchIdRef = useRef<string | null>(null);
  const searchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Presence for Online Count
  useEffect(() => {
    const channel = supabase.channel('global_presence');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  // Cleanup on window close/refresh
  useEffect(() => {
    const handleUnload = () => {
      leaveQueue(userId);
      if (currentMatch) {
        endMatch(currentMatch.id);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [userId, currentMatch]);

  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Match Found (via Subscription or Polling)
  const handleMatchFound = async (match: Match) => {
    // Prevent duplicate match handling
    if (processedMatchIdRef.current === match.id) return;
    processedMatchIdRef.current = match.id;

    console.log('Initializing match:', match.id);
    soundService.play('match');

    // Clear search interval
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }

    // Cleanup any existing channels before starting new ones
    if (matchChannelRef.current) {
      supabase.removeChannel(matchChannelRef.current);
      matchChannelRef.current = null;
    }
    if (statusChannelRef.current) {
      supabase.removeChannel(statusChannelRef.current);
      statusChannelRef.current = null;
    }

    // Determine if I am host or peer
    const isHost = match.host_id === userId;
    const partnerId = isHost ? match.peer_id : match.host_id;
    const partnerName = isHost ? match.peer_name : match.host_name;
    const partnerGender = isHost ? match.peer_gender : match.host_gender;

    setCurrentMatch(match);
    setPartner({
      socketId: partnerId,
      displayName: partnerName || 'Stranger', 
      interests: [], 
      gender: partnerGender || 'Unknown'
    });
    setAppState('chatting');
    setMessages([]);
    setIsPartnerDisconnected(false);
    setIsPartnerTyping(false);

    // Subscribe to messages in the room
    const channel = subscribeToMessages(match.id, (payload: any) => {
      if (payload.senderId !== userId) {
        setMessages(prev => [
          ...prev, 
          { 
            id: uuidv4(), 
            text: payload.text, 
            sender: 'stranger', 
            timestamp: Date.now() 
          }
        ]);
        setIsPartnerTyping(false);
        soundService.play('message');
      }
    }, (payload: any) => {
      if (payload.senderId !== userId) {
        setIsPartnerTyping(payload.isTyping);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (payload.isTyping) {
          typingTimeoutRef.current = setTimeout(() => setIsPartnerTyping(false), 3000);
        }
      }
    });
    matchChannelRef.current = channel;

    // Subscribe to match status (for disconnection)
    const statusChannel = subscribeToMatchStatus(match.id, () => {
      setIsPartnerDisconnected(true);
      soundService.play('disconnect');
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          text: 'Stranger has left the chat.',
          sender: 'system',
          timestamp: Date.now()
        }
      ]);
      // Cleanup channel
      if (matchChannelRef.current) {
        supabase.removeChannel(matchChannelRef.current);
        matchChannelRef.current = null;
      }
      if (statusChannelRef.current) {
        supabase.removeChannel(statusChannelRef.current);
        statusChannelRef.current = null;
      }
    });
    statusChannelRef.current = statusChannel;
  };

  // Subscribe to being matched
  useEffect(() => {
    const subscription = subscribeToMatches(userId, (match) => {
      console.log('Match received via subscription:', match);
      handleMatchFound(match);
    });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  const handleStartSearch = async (prefs: UserPreferences) => {
    userPreferences.current = prefs;
    setAppState('searching');
    setIsPartnerDisconnected(false);
    setMessages([]);
    setPartner(null);
    setCurrentMatch(null);

    // 1. Join Queue
    await joinQueue(userId, prefs.interests, prefs.displayName, prefs.gender);

    // 2. Start Polling for Matches (Active Search)
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    
    searchIntervalRef.current = setInterval(async () => {
      const match = await findAndClaimMatch(userId, prefs.interests, prefs.displayName, prefs.gender);
      if (match) {
        console.log('Match found via active search:', match);
        handleMatchFound(match);
      }
    }, 2000); // Check every 2 seconds
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !currentMatch || !matchChannelRef.current) return;
    
    // Send via Realtime
    await sendMessage(matchChannelRef.current, {
      text,
      senderId: userId
    });

    // Optimistically add to UI
    setMessages(prev => [
      ...prev,
      {
        id: uuidv4(),
        text: text,
        sender: 'me',
        timestamp: Date.now()
      }
    ]);
  };

  const handleNext = async () => {
    processedMatchIdRef.current = null;
    // End current match if exists
    if (currentMatch) {
      await endMatch(currentMatch.id);
      if (matchChannelRef.current) {
        supabase.removeChannel(matchChannelRef.current);
        matchChannelRef.current = null;
      }
      if (statusChannelRef.current) {
        supabase.removeChannel(statusChannelRef.current);
        statusChannelRef.current = null;
      }
    }
    
    // Stop searching if searching
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
      await leaveQueue(userId);
    }

    // Restart search
    if (userPreferences.current) {
      handleStartSearch(userPreferences.current);
    } else {
      setAppState('landing');
    }
  };

  const handleStop = async () => {
    processedMatchIdRef.current = null;
    // End current match if exists
    if (currentMatch) {
      await endMatch(currentMatch.id);
      if (matchChannelRef.current) {
        supabase.removeChannel(matchChannelRef.current);
        matchChannelRef.current = null;
      }
      if (statusChannelRef.current) {
        supabase.removeChannel(statusChannelRef.current);
        statusChannelRef.current = null;
      }
    }

    // Stop searching if searching
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
      await leaveQueue(userId);
    }

    setAppState('landing');
    setPartner(null);
    setMessages([]);
    setIsPartnerDisconnected(false);
    setCurrentMatch(null);
  };

  const handleTyping = (isTyping: boolean) => {
    if (matchChannelRef.current) {
      import('./services/supabaseService').then(({ sendTypingStatus }) => {
        sendTypingStatus(matchChannelRef.current, isTyping, userId);
      });
    }
  };

  return (
    <div className="min-h-screen relative font-sans text-slate-100">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header isConnected={isConnected} onlineCount={onlineCount} />

        <main className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {appState === 'landing' && (
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col"
              >
                <Landing 
                  onStart={handleStartSearch} 
                  isConnecting={false} 
                  isConnected={isConnected}
                />
              </motion.div>
            )}

            {appState === 'searching' && (
              <motion.div
                key="searching"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.4 }}
                className="flex-1 flex flex-col items-center justify-center p-4"
              >
                <div className="relative mb-12">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-glow"></div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="relative w-24 h-24 glass-panel rounded-full flex items-center justify-center border border-primary/30"
                  >
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  </motion.div>
                  {/* Radar Ripples */}
                  <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-20"></div>
                </div>
                
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-3">
                  Scanning Frequency...
                </h2>
                <p className="text-slate-400 max-w-md text-center mb-6">
                  Looking for someone interested in <span className="text-slate-200 font-medium">{userPreferences.current?.interests.join(', ') || 'anything'}</span>
                </p>
                
                <button 
                  onClick={handleStop}
                  className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                  Cancel Search
                </button>
              </motion.div>
            )}

            {appState === 'chatting' && partner && (
              <motion.div
                key="chatting"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="flex-1 flex flex-col"
              >
                <ChatRoom 
                  partner={partner}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onNext={handleNext}
                  onStop={handleStop}
                  isPartnerDisconnected={isPartnerDisconnected}
                  isPartnerTyping={isPartnerTyping}
                  onTyping={handleTyping}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;
