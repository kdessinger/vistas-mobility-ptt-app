export interface PttChirpAudio {
  preload: string;
  volume: number;
  currentTime: number;
  load?: () => void;
  play: () => Promise<void> | void;
}

export interface PttPressFeedback {
  preload: () => void;
  play: () => void;
}

export function createPttPressFeedback(
  createAudio: () => PttChirpAudio,
): PttPressFeedback;
