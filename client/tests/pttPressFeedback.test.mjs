import assert from 'node:assert/strict';
import test from 'node:test';
import { createPttPressFeedback } from '../src/lib/pttPressFeedback.js';

test('reuses one preloaded chirp and restarts it for every PTT press', async () => {
  const created = [];
  const audio = {
    preload: '',
    volume: 0,
    currentTime: 0.47,
    playCalls: 0,
    loadCalls: 0,
    load() {
      this.loadCalls += 1;
    },
    play() {
      this.playCalls += 1;
      return Promise.resolve();
    },
  };

  const feedback = createPttPressFeedback(() => {
    created.push(audio);
    return audio;
  });

  feedback.preload();
  feedback.play();
  await Promise.resolve();
  feedback.play();

  assert.equal(created.length, 1);
  assert.equal(audio.preload, 'auto');
  assert.equal(audio.volume, 0.72);
  assert.equal(audio.loadCalls, 1);
  assert.equal(audio.currentTime, 0);
  assert.equal(audio.playCalls, 2);
});

test('does not let a rejected chirp playback interrupt push-to-talk', async () => {
  const audio = {
    preload: '',
    volume: 0,
    currentTime: 0,
    load() {},
    play() {
      return Promise.reject(new Error('autoplay blocked'));
    },
  };
  const feedback = createPttPressFeedback(() => audio);

  assert.doesNotThrow(() => feedback.play());
  await new Promise((resolve) => setTimeout(resolve, 0));
});
