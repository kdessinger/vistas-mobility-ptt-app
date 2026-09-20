export async function startAudioFallbackRecording(
  stream: MediaStream,
  onChunk: (base64: string) => void
): Promise<MediaRecorder> {
  const mimeType = MediaRecorder.isTypeSupported('audio/mp4')
    ? 'audio/mp4'
    : MediaRecorder.isTypeSupported('audio/webm')
    ? 'audio/webm'
    : 'audio/ogg'

  const recorder = new MediaRecorder(stream, { mimeType })
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        onChunk(base64)
      }
      reader.readAsDataURL(e.data)
    }
  }
  recorder.start(100)
  return recorder
}

function pcmToWavBase64(pcmBase64: string, sampleRate: number): string {
  const binary = atob(pcmBase64)
  const pcmBytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) pcmBytes[i] = binary.charCodeAt(i)

  const numChannels = 1
  const byteRate = sampleRate * numChannels * 2
  const blockAlign = numChannels * 2
  const dataSize = pcmBytes.length
  const headerSize = 44
  const buffer = new ArrayBuffer(headerSize + dataSize)
  const view = new DataView(buffer)

  // RIFF chunk descriptor
  let offset = 0
  const writeString = (s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
    offset += s.length
  }

  writeString('RIFF')
  view.setUint32(offset, 36 + dataSize, true)
  offset += 4
  writeString('WAVE')
  writeString('fmt ')
  view.setUint32(offset, 16, true)
  offset += 4
  view.setUint16(offset, 1, true) // PCM format
  offset += 2
  view.setUint16(offset, numChannels, true)
  offset += 2
  view.setUint32(offset, sampleRate, true)
  offset += 4
  view.setUint32(offset, byteRate, true)
  offset += 4
  view.setUint16(offset, blockAlign, true)
  offset += 2
  view.setUint16(offset, 16, true) // bits per sample
  offset += 2
  writeString('data')
  view.setUint32(offset, dataSize, true)
  offset += 4

  const wavBytes = new Uint8Array(buffer)
  wavBytes.set(pcmBytes, headerSize)

  let wavBinary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < wavBytes.length; i += chunkSize) {
    wavBinary += String.fromCharCode(...wavBytes.subarray(i, i + chunkSize))
  }
  return btoa(wavBinary)
}

export function playBase64Audio(base64: string, mimeType = 'audio/pcm;rate=48000;channels=1'): void {
  let src: string
  if (mimeType.startsWith('audio/pcm')) {
    const sampleRate = Number(mimeType.match(/rate=(\d+)/)?.[1] ?? 48000)
    const wavBase64 = pcmToWavBase64(base64, sampleRate)
    src = `data:audio/wav;base64,${wavBase64}`
  } else {
    src = `data:${mimeType};base64,${base64}`
  }
  const audio = new Audio(src)
  audio.preload = 'auto'
  audio.play().catch(() => {
    // ignore autoplay restrictions
  })
}

export async function playBase64AudioViaContext(base64: string, mimeType = 'audio/pcm;rate=48000;channels=1'): Promise<void> {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: mimeType })
  const arrayBuffer = await blob.arrayBuffer()
  const audioContext = new AudioContext()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  const source = audioContext.createBufferSource()
  source.buffer = audioBuffer
  source.connect(audioContext.destination)
  source.start()
}
