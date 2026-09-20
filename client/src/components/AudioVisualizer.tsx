import { useEffect, useRef } from 'react'

interface Props {
  active: boolean
}

export default function AudioVisualizer({ active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    let t = 0

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      if (!active) {
        ctx.beginPath()
        ctx.moveTo(0, h / 2)
        ctx.lineTo(w, h / 2)
        ctx.strokeStyle = '#334155'
        ctx.lineWidth = 2
        ctx.stroke()
        animRef.current = requestAnimationFrame(draw)
        return
      }

      ctx.beginPath()
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin((x + t) * 0.05) * (Math.sin(t * 0.02) * 20 + 20)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2
      ctx.stroke()
      t += 2
      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={80}
      className="w-full rounded-xl bg-[#0a0f1c]"
    />
  )
}
