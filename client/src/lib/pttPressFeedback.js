/**
 * Small, browser-independent wrapper around the talk-permit chirp.
 *
 * Keeping one Audio element alive matters on mobile browsers: creating an
 * element only at press time can leave the short cue waiting on a network
 * load, and repeated presses can overlap competing elements.
 */
export function createPttPressFeedback(createAudio) {
  let chirp = null;

  const ensureChirp = () => {
    if (!chirp) {
      chirp = createAudio();
      chirp.preload = 'auto';
      chirp.volume = 0.72;
    }
    return chirp;
  };

  return {
    preload() {
      const audio = ensureChirp();
      audio.load?.();
    },
    play() {
      const audio = ensureChirp();
      try {
        audio.currentTime = 0;
      } catch {
        // Some browsers do not allow seeking until metadata is available.
      }
      const playback = audio.play();
      if (playback && typeof playback.catch === 'function') {
        void playback.catch(() => {
          // A failed cue must never block the actual PTT action.
        });
      }
    },
  };
}
