import { useEffect, useRef, useCallback } from 'react';
import {
  createPeerConnection,
  createOffer,
  createAnswer,
  setRemoteDescription,
  addIceCandidate,
} from '../lib/webrtc';
import type { ClientMessage, ServerMessage } from '../types';

interface UseWebRTCApi {
  remoteAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  startCall: (targetId: string, localStream: MediaStream) => Promise<void>;
  handleOffer: (
    senderId: string,
    sdp: string,
    localStream: MediaStream
  ) => Promise<void>;
  handleAnswer: (sdp: string) => Promise<void>;
  handleIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  endCall: () => void;
}

/**
 * WebRTC signaling coordinator.
 *
 * The server is just a relay — every client sends {type: 'webrtc-*', targetId, ...}
 * and the server forwards it as {type: 'webrtc-*', senderId, ...}. We use
 * `targetId` on outbound frames and read `senderId` on inbound frames.
 */
export function useWebRTC(sendMessage: (msg: ClientMessage) => boolean): UseWebRTCApi {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const peerIdRef = useRef<string | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const wirePeerEvents = useCallback(
    (pc: RTCPeerConnection, peerId: string, localStream: MediaStream) => {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

      pc.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendMessage({
            type: 'webrtc-ice',
            candidate: event.candidate.toJSON(),
            targetId: peerId,
          });
        }
      };
    },
    [sendMessage]
  );

  const startCall = useCallback(
    async (targetId: string, localStream: MediaStream) => {
      const pc = createPeerConnection();
      pcRef.current = pc;
      peerIdRef.current = targetId;

      wirePeerEvents(pc, targetId, localStream);

      const offer = await createOffer(pc);
      sendMessage({
        type: 'webrtc-offer',
        sdp: offer.sdp as string,
        targetId,
      });
    },
    [sendMessage, wirePeerEvents]
  );

  const handleOffer = useCallback(
    async (senderId: string, sdp: string, localStream: MediaStream) => {
      const pc = createPeerConnection();
      pcRef.current = pc;
      peerIdRef.current = senderId;

      wirePeerEvents(pc, senderId, localStream);

      await setRemoteDescription(pc, { type: 'offer', sdp });
      const answer = await createAnswer(pc);
      sendMessage({
        type: 'webrtc-answer',
        sdp: answer.sdp as string,
        targetId: senderId,
      });
    },
    [sendMessage, wirePeerEvents]
  );

  const handleAnswer = useCallback(async (sdp: string) => {
    if (pcRef.current) {
      await setRemoteDescription(pcRef.current, { type: 'answer', sdp });
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (pcRef.current) {
      await addIceCandidate(pcRef.current, candidate);
    }
  }, []);

  const endCall = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    peerIdRef.current = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  }, []);

  // Listen for the server-relayed webrtc-* frames dispatched from useWebSocket.
  useEffect(() => {
    const onMessage = (e: Event) => {
      const detail = (e as CustomEvent<ServerMessage>).detail;
      if (!detail) return;
      switch (detail.type) {
        case 'webrtc-offer':
          // Parent offers inbound; the parent-side component must provide a
          // local stream via handleOffer(senderId, sdp, stream).
          // We don't have the stream here — callers wire it through a
          // pendingOfferResolver if they need auto-answer behavior.
          break;
        case 'webrtc-answer':
          handleAnswer(detail.sdp);
          break;
        case 'webrtc-ice':
          handleIceCandidate(detail.candidate);
          break;
        default:
          break;
      }
    };
    window.addEventListener('ptt-message', onMessage as EventListener);
    return () => {
      window.removeEventListener('ptt-message', onMessage as EventListener);
    };
  }, [handleAnswer, handleIceCandidate]);

  return {
    remoteAudioRef,
    startCall,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    endCall,
  };
}