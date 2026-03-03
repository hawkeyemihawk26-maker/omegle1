import { supabase } from '../supabaseClient';

export interface Match {
  id: string;
  host_id: string;
  host_name: string;
  host_gender: string;
  peer_id: string;
  peer_name: string;
  peer_gender: string;
  created_at: string;
  status: string;
}

export const joinQueue = async (userId: string, interests: string[], displayName: string, gender: string) => {
  // Clear any existing entries for this user first
  await supabase.from('queue').delete().eq('client_id', userId);

  const { error } = await supabase
    .from('queue')
    .insert([{ client_id: userId, interests, display_name: displayName, gender }]);
  
  if (error) console.error('Error joining queue:', error);
  return error;
};

export const leaveQueue = async (userId: string) => {
  const { error } = await supabase
    .from('queue')
    .delete()
    .eq('client_id', userId);

  if (error) console.error('Error leaving queue:', error);
  return error;
};

export const findAndClaimMatch = async (myUserId: string, _myInterests: string[], myDisplayName: string, myGender: string) => {
  // 1. Find a candidate (not me) who joined in the last 30 seconds
  const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
  
  const { data: candidates, error } = await supabase
    .from('queue')
    .select('*')
    .neq('client_id', myUserId)
    .gt('created_at', thirtySecondsAgo)
    .order('created_at', { ascending: true })
    .limit(1);

  if (error || !candidates || candidates.length === 0) {
    return null;
  }

  const candidate = candidates[0];

  // 2. Try to claim them by deleting them from the queue
  // We use a filter on ID to ensure we only delete if they are still there
  const { data: deletedRows, error: deleteError } = await supabase
    .from('queue')
    .delete()
    .eq('id', candidate.id) // Use the unique row ID, not client_id just in case
    .select();

  if (deleteError || !deletedRows || deletedRows.length === 0) {
    // Failed to claim (someone else took them or they left)
    return null;
  }
  
  // Create the match
  const { data: matchData, error: matchError } = await supabase
    .from('matches')
    .insert([
      { 
        host_id: myUserId, 
        host_name: myDisplayName,
        host_gender: myGender,
        peer_id: candidate.client_id, 
        peer_name: candidate.display_name,
        peer_gender: candidate.gender,
        status: 'active' 
      }
    ])
    .select()
    .single();

  if (matchError) {
    console.error('Error creating match:', matchError);
    return null;
  }

  return matchData;
};

export const subscribeToMatches = (userId: string, onMatch: (match: Match) => void) => {
  // Listen for matches where I am the peer (someone found me)
  const channel = supabase.channel(`user_matches:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `peer_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Match found (I am peer):', payload.new);
        onMatch(payload.new as Match);
      }
    )
    .subscribe();
    
  return channel;
};

export const subscribeToMessages = (roomId: string, onMessage: (msg: any) => void, onTyping?: (payload: any) => void) => {
  const channel = supabase.channel(`room:${roomId}`);
  
  channel
    .on('broadcast', { event: 'message' }, (payload) => {
      onMessage(payload.payload);
    })
    .on('broadcast', { event: 'typing' }, (payload) => {
      if (onTyping) onTyping(payload.payload);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to room ${roomId}`);
      }
    });
    
  return channel;
};

export const sendMessage = async (channel: any, message: any) => {
  if (!channel) return;
  await channel.send({
    type: 'broadcast',
    event: 'message',
    payload: message,
  });
};

export const sendTypingStatus = async (channel: any, isTyping: boolean, senderId: string) => {
  if (!channel) return;
  await channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { isTyping, senderId },
  });
};

export const endMatch = async (matchId: string) => {
  const { error } = await supabase
    .from('matches')
    .update({ status: 'ended' })
    .eq('id', matchId);

  if (error) console.error('Error ending match:', error);
};

export const subscribeToMatchStatus = (matchId: string, onEnd: () => void) => {
  return supabase
    .channel(`match_status:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`,
      },
      (payload) => {
        if (payload.new.status === 'ended') {
          onEnd();
        }
      }
    )
    .subscribe();
};

