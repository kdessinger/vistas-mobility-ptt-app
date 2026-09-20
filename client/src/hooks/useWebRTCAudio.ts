import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { createPeerConnection } from '../lib/webrtc';
import type { ClientMessage, ServerMessage } from '../types';

/** Native browser audio path for Android/iOS/desktop compatibility. */
export function useWebRTCAudio(sendMessage: (msg: ClientMessage) => boolean) {
  const role = useStore((s) => s.role);
  const currentUserId = useStore((s) => s.currentUserId);
  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingIceRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const closePeer = useCallback((peerId: string) => {
    const pc = peersRef.current.get(peerId);
    if (pc) pc.close();
    peersRef.current.delete(peerId);
    pendingIceRef.current.delete(peerId);
  }, []);

  const attachRemoteAudio = useCallback((stream: MediaStream) => {
    let audio = audioRef.current;
    if (!audio) {
      audio = document.createElement('audio');
      audio.autoplay = true;
      audio.setAttribute('playsinline', 'true');
      audio.controls = false;
      audio.volume = 1;
      audio.setAttribute('aria-hidden', 'true');
      audio.style.position = 'fixed';
      audio.style.width = '1px';
      audio.style.height = '1px';
      audio.style.opacity = '0';
      audio.style.pointerEvents = 'none';
      document.body.appendChild(audio);
      audioRef.current = audio;
    }
    audio.srcObject = stream;
    void audio.play().catch((error) => {
      console.warn('[ptt] WebRTC remote audio play was blocked:', error);
    });
  }, []);

  const createDriverPeer = useCallback(
    async (targetId: string, stream: MediaStream) => {
      closePeer(targetId);
      const pc = createPeerConnection();
      peersRef.current.set(targetId, pc);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendMessage({ type: 'webrtc-ice', targetId, candidate: event.candidate.toJSON() });
        }
      };
      pc.onconnectionstatechange = () => {
        if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) closePeer(targetId);
      };
      const offer = await pc.createOffer({ offerToReceiveAudio: false });
      await pc.setLocalDescription(offer);
      sendMessage({ type: 'webrtc-offer', targetId, sdp: offer.sdp ?? '' });
    },
    [closePeer, sendMessage]
  );

  const startBroadcast = useCallback(
    async (stream: MediaStream, targetIds: string[]) => {
      if (role !== 'driver') return;
      await Promise.all(targetIds.filter(Boolean).map((id) => createDriverPeer(id, stream)));
    },
    [createDriverPeer, role]
  );

  const endBroadcast = useCallback(() => {
    for (const peerId of peersRef.current.keys()) closePeer(peerId);
  }, [closePeer]);

  useEffect(() => {
    const onMessage = (event: Event) => {
      const msg = (event as CustomEvent<ServerMessage>).detail;
      if (!msg) return;

      if (msg.type === 'webrtc-offer' && role !== 'driver') {
        void (async () => {
          closePeer(msg.senderId);
          const pc = createPeerConnection();
          peersRef.current.set(msg.senderId, pc);
          pc.addTransceiver('audio', { direction: 'recvonly' });
          pc.ontrack = (trackEvent) => {
            if (trackEvent.streams[0]) attachRemoteAudio(trackEvent.streams[0]);
          };
          pc.onicecandidate = (iceEvent) => {
            if (iceEvent.candidate) {
              sendMessage({
                type: 'webrtc-ice',
                targetId: msg.senderId,
                candidate: iceEvent.candidate.toJSON(),
              });
            }
          };
          await pc.setRemoteDescription({ type: 'offer', sdp: msg.sdp });
          const queued = pendingIceRef.current.get(msg.senderId) ?? [];
          for (const candidate of queued) await pc.addIceCandidate(candidate);
          pendingIceRef.current.delete(msg.senderId);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendMessage({ type: 'webrtc-answer', targetId: msg.senderId, sdp: answer.sdp ?? '' });
        })().catch((error) => console.error('[ptt] WebRTC offer handling failed:', error));
      } else if (msg.type === 'webrtc-answer' && role === 'driver') {
        const pc = peersRef.current.get(msg.senderId);
        if (pc) {
          void pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp }).then(async () => {
            const queued = pendingIceRef.current.get(msg.senderId) ?? [];
            for (const candidate of queued) await pc.addIceCandidate(candidate);
            pendingIceRef.current.delete(msg.senderId);
          }).catch((error) => console.error('[ptt] WebRTC answer handling failed:', error));
        }
      } else if (msg.type === 'webrtc-ice') {
        const pc = peersRef.current.get(msg.senderId);
        if (!pc || !pc.remoteDescription) {
          const queued = pendingIceRef.current.get(msg.senderId) ?? [];
          queued.push(msg.candidate);
          pendingIceRef.current.set(msg.senderId, queued);
        } else {
          void pc.addIceCandidate(msg.candidate).catch((error) =>
            console.warn('[ptt] WebRTC ICE candidate failed:', error)
          );
        }
      } else if (msg.type === 'broadcast-ended') {
        endBroadcast();
      }
    };

    window.addEventListener('ptt-message', onMessage);
    return () => window.removeEventListener('ptt-message', onMessage);
  }, [attachRemoteAudio, closePeer, endBroadcast, role, sendMessage]);

  useEffect(() => () => {
    endBroadcast();
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current.remove();
      audioRef.current = null;
    }
  }, [endBroadcast]);

  return { startBroadcast, endBroadcast, currentUserId };
}
