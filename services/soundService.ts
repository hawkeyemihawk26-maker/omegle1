const SOUND_URLS = {
  match: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
  message: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
  disconnect: 'https://assets.mixkit.co/active_storage/sfx/2359/2359-preview.mp3'
};

class SoundService {
  private sounds: Record<string, HTMLAudioElement> = {};

  constructor() {
    if (typeof window !== 'undefined') {
      Object.entries(SOUND_URLS).forEach(([key, url]) => {
        const audio = new Audio(url);
        audio.volume = 0.5;
        this.sounds[key] = audio;
      });
    }
  }

  play(soundName: keyof typeof SOUND_URLS) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(e => console.warn('Sound play blocked by browser:', e));
    }
  }
}

export const soundService = new SoundService();
