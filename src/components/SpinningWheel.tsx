import { useRef, useEffect, useState } from "react"

interface Option {
  label: string
  color: string
}

interface Props {
  options: Option[]
  spinning: boolean
  onFinish: (option: Option) => void
}

const COLORS = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
  "#84CC16", "#6366F1", "#14B8A6", "#E11D48",
]

const PTR_H = 16

function drawWheel(
  ctx: CanvasRenderingContext2D,
  size: number,
  options: Option[],
  rotation: number,
) {
  const cx = size / 2
  const cy = size / 2
  const r = cx - 4
  const angle = (2 * Math.PI) / options.length

  ctx.clearRect(0, 0, size, size)

  // 画扇形
  for (let i = 0; i < options.length; i++) {
    const start = rotation + i * angle - Math.PI / 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, start, start + angle)
    ctx.closePath()
    ctx.fillStyle = options[i].color
    ctx.fill()
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // 画文字
  ctx.save()
  ctx.font = `bold ${Math.max(12, Math.min(16, r / options.length / 0.6))}px sans-serif`
  ctx.fillStyle = "#fff"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  for (let i = 0; i < options.length; i++) {
    const mid = rotation + i * angle + angle / 2 - Math.PI / 2
    const textR = r * 0.65
    const tx = cx + Math.cos(mid) * textR
    const ty = cy + Math.sin(mid) * textR
    ctx.save()
    ctx.translate(tx, ty)
    ctx.rotate(mid + Math.PI / 2)
    // 截断过长文字
    let label = options[i].label
    const maxW = textR * 0.8
    while (ctx.measureText(label).width > maxW && label.length > 1) {
      label = label.slice(0, -1)
    }
    if (label !== options[i].label) label += "…"
    ctx.fillText(label, 0, 0)
    ctx.restore()
  }
  ctx.restore()

  // 中心圆
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.12, 0, 2 * Math.PI)
  ctx.fillStyle = "#fff"
  ctx.fill()
  ctx.strokeStyle = "#e5e7eb"
  ctx.lineWidth = 2
  ctx.stroke()
}

function getResult(rotation: number, options: Option[]): Option {
  const angle = (2 * Math.PI) / options.length
  // 指针在顶部（-PI/2），段 0 从顶部开始顺时针绘制
  // rotation 为累积顺时针旋转角度
  const t = ((-rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  const idx = Math.floor(t / angle) % options.length
  return options[idx]
}

export function SpinningWheel({ options, spinning, onFinish }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rotation, setRotation] = useState(0)
  const animRef = useRef<number>(0)
  const velRef = useRef(0)
  const optsRef = useRef(options.map((o, i) => ({ ...o, color: COLORS[i % COLORS.length] })))
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish
  optsRef.current = options.map((o, i) => ({ ...o, color: COLORS[i % COLORS.length] }))

  // 绘制
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const size = canvas.parentElement?.clientWidth ?? 300
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = (size + PTR_H) * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size + PTR_H}px`
    const ctx = canvas.getContext("2d")!
    ctx.scale(dpr, dpr)
    drawWheel(ctx, size, optsRef.current, rotation)
  }, [options, rotation])

  useEffect(() => {
    if (!spinning) return
    velRef.current = 30 + Math.random() * 20
    let last = performance.now()

    const animate = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      velRef.current *= 0.985
      setRotation((prev) => prev + velRef.current * dt)

      if (velRef.current > 0.01) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        setRotation((prev) => {
          const result = getResult(prev, optsRef.current)
          setTimeout(() => onFinishRef.current(result), 100)
          return prev
        })
      }
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [spinning])

  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      {/* 指针 */}
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
        <div
          className="border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-foreground"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
        />
      </div>
      <canvas ref={canvasRef} className="w-full" />
    </div>
  )
}
