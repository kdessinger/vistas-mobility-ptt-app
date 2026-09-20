const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection(ICE_SERVERS)
}

export async function createOffer(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  return offer
}

export async function createAnswer(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)
  return answer
}

export async function setRemoteDescription(pc: RTCPeerConnection, sdp: RTCSessionDescriptionInit): Promise<void> {
  await pc.setRemoteDescription(new RTCSessionDescription(sdp))
}

export async function addIceCandidate(pc: RTCPeerConnection, candidate: RTCIceCandidateInit): Promise<void> {
  await pc.addIceCandidate(new RTCIceCandidate(candidate))
}
