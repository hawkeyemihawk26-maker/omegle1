export type Gender = 'Male' | 'Female' | 'Other';

export interface UserPreferences {
  displayName: string;
  age: number;
  gender: Gender;
  interests: string[];
  preferredGender: Gender | 'Any';
}

export interface Message {
  id: string;
  sender: 'me' | 'stranger' | 'system';
  text: string;
  timestamp: number;
}

export interface PartnerData {
  socketId: string;
  displayName?: string;
  interests: string[];
  age?: number;
  gender?: string;
}

export type ChatState = 'landing' | 'searching' | 'chatting';
