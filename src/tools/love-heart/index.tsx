import { useState, useRef, useCallback, useEffect } from "react"
import { Fireworks } from "fireworks-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// ── 爱心路径（经典参数方程）───────────────────────────────────

function heartPoint(t: number) {
  return {
    x: 160 * Math.pow(Math.sin(t), 3),
    y:
      130 * Math.cos(t) -
      50 * Math.cos(2 * t) -
      20 * Math.cos(3 * t) -
      10 * Math.cos(4 * t) +
      25,
  }
}

/** 描出爱心路径（raw 坐标 → 屏幕坐标） */
function heartPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, hs: number, ymid: number) {
  ctx.beginPath()
  for (let t = -Math.PI; t <= Math.PI; t += 0.02) {
    const p = heartPoint(t)
    const x = cx + p.x * hs
    const y = cy - (p.y - ymid) * hs
    if (t === -Math.PI) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

// ── 心形布局 ──────────────────────────────────────────────────

interface HeartLayout {
  cx: number
  cy: number
  hs: number
  ymid: number
  heartW: number
  heartH: number
}

/** 计算心形在画布中的位置与缩放（垂直居中，高度约为画布 68%） */
function computeLayout(W: number, H: number): HeartLayout {
  let ymin = Infinity
  let ymax = -Infinity
  for (let t = -Math.PI; t <= Math.PI; t += 0.01) {
    const y = heartPoint(t).y
    if (y < ymin) ymin = y
    if (y > ymax) ymax = y
  }
  const ymid = (ymin + ymax) / 2
  const hs = (H * 0.68) / (ymax - ymin)
  const cx = W / 2
  const cy = H / 2
  return {
    cx,
    cy,
    hs,
    ymid,
    heartW: 320 * hs,
    heartH: (ymax - ymin) * hs,
  }
}

/** 图片按 cover 语义绘制到指定区域（保持比例）。viewY∈[-0.5,0.5] 控制裁剪窗口垂直位置；zoom 控制图片缩放（1 填满区域） */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  viewY = 0,
  zoom = 1,
) {
  const ir = img.naturalWidth / img.naturalHeight
  const r = w / h
  // cover 基础尺寸，再按 zoom 缩放（保持居中）
  let dw: number
  let dh: number
  if (ir > r) {
    dw = h * ir
    dh = h
  } else {
    dw = w
    dh = w / ir
  }
  dw *= zoom
  dh *= zoom
  const dx = x + (w - dw) / 2
  let dy = y + (h - dh) / 2
  const maxDy = dh - h
  if (maxDy > 0) {
    // viewY∈[-0.5,0.5]：负值显示图片上方，正值显示下方
    dy = y - maxDy / 2 - viewY * maxDy
  }
  ctx.drawImage(img, dx, dy, dw, dh)
}

/** 居中显示名字（左/右各一个，gap 控制间距、offsetY 控制垂直位置、fontSize 控制字号，均为相对心形的比例） */
function drawName(
  ctx: CanvasRenderingContext2D,
  text: string,
  side: "left" | "right",
  o: HeartLayout,
  textColor: string,
  gap: number,
  offsetY: number,
  fontSize: number,
) {
  if (!text.trim()) return
  const maxW = o.heartW * 0.55
  let f = o.heartH * fontSize
  ctx.font = `bold ${f}px "Arial", "PingFang SC", sans-serif`
  while (ctx.measureText(text).width > maxW && f > 12) {
    f -= 1
    ctx.font = `bold ${f}px "Arial", "PingFang SC", sans-serif`
  }

  ctx.save()
  ctx.shadowColor = "rgba(0,0,0,0.55)"
  ctx.shadowBlur = 6
  ctx.fillStyle = textColor
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  // gap/offsetY 为相对心形宽高的比例，全屏时按比例缩放
  const x = side === "left" ? o.cx - gap * o.heartW : o.cx + gap * o.heartW
  ctx.fillText(text, x, o.cy + offsetY * o.heartH)
  ctx.restore()
}

/** 圆形裁剪显示图片，加细白边。viewY 控制裁剪窗口垂直位置、zoom 控制图片在框内的缩放 */
function drawCircleImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  d: number,
  viewY: number,
  zoom: number,
) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, d / 2, 0, Math.PI * 2)
  ctx.fillStyle = "rgba(255,255,255,0.15)"
  ctx.fill()
  ctx.clip()
  drawCover(ctx, img, cx - d / 2, cy - d / 2, d, d, viewY, zoom)
  ctx.restore()
  ctx.beginPath()
  ctx.arc(cx, cy, d / 2, 0, Math.PI * 2)
  ctx.strokeStyle = "rgba(255,255,255,0.85)"
  ctx.lineWidth = 3
  ctx.stroke()
}

/** 左右并排显示两张圆形图片（size 圆直径、boxGap 间距、boxY 垂直位置、viewYA/viewYB 两图各自裁剪位置、zoomA/zoomB 两图各自缩放） */
function drawImagePair(
  ctx: CanvasRenderingContext2D,
  imgA: HTMLImageElement | null,
  imgB: HTMLImageElement | null,
  o: HeartLayout,
  viewYA: number,
  viewYB: number,
  boxGap: number,
  boxY: number,
  size: number,
  zoomA: number,
  zoomB: number,
) {
  const d = o.heartH * size
  const cy = o.cy + boxY * o.heartH
  const off = boxGap * o.heartW
  if (imgA) drawCircleImage(ctx, imgA, o.cx - off, cy, d, viewYA, zoomA)
  if (imgB) drawCircleImage(ctx, imgB, o.cx + off, cy, d, viewYB, zoomB)
}

// ── 粒子系统（参考 love.html）─────────────────────────────────

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  age: number
}

const PARTICLE_MAX = 500
const PARTICLE_DURATION = 2
const PARTICLE_VELOCITY = 100
const PARTICLE_EFFECT = -0.75

/** 生成一张小爱心位图，作为粒子图形 */
function createHeartImage(size: number, color: string): HTMLImageElement {
  const c = document.createElement("canvas")
  c.width = size
  c.height = size
  const ctx = c.getContext("2d")!
  let ymin = Infinity
  let ymax = -Infinity
  for (let t = -Math.PI; t <= Math.PI; t += 0.01) {
    const y = heartPoint(t).y
    if (y < ymin) ymin = y
    if (y > ymax) ymax = y
  }
  const ymid = (ymin + ymax) / 2
  const hs = size / 350
  heartPath(ctx, size / 2, size / 2, hs, ymid)
  ctx.fillStyle = color
  ctx.fill()
  const img = new Image()
  img.src = c.toDataURL()
  return img
}

/** 生成新粒子、更新位置速度、清理超龄粒子 */
function updateParticles(arr: Particle[], dt: number, layout: HeartLayout) {
  const amount = (PARTICLE_MAX / PARTICLE_DURATION) * dt
  for (let i = 0; i < amount; i++) {
    // 从心形轮廓上取随机点，粒子沿径向向外飞散
    const t = Math.PI - 2 * Math.PI * Math.random()
    const p = heartPoint(t)
    const x = layout.cx + p.x * layout.hs
    const y = layout.cy - (p.y - layout.ymid) * layout.hs
    const dx = x - layout.cx
    const dy = y - layout.cy
    const dist = Math.hypot(dx, dy) || 1
    arr.push({ x, y, vx: (dx / dist) * PARTICLE_VELOCITY, vy: (dy / dist) * PARTICLE_VELOCITY, age: 0 })
  }
  if (arr.length > PARTICLE_MAX) arr.splice(0, arr.length - PARTICLE_MAX)

  for (let i = arr.length - 1; i >= 0; i--) {
    const q = arr[i]
    q.x += q.vx * dt
    q.y += q.vy * dt
    q.vx += q.vx * PARTICLE_EFFECT * dt
    q.vy += q.vy * PARTICLE_EFFECT * dt
    q.age += dt
    if (q.age >= PARTICLE_DURATION) arr.splice(i, 1)
  }
}

/** 绘制粒子：随生命期放大并淡出 */
function drawParticles(ctx: CanvasRenderingContext2D, arr: Particle[], img: HTMLImageElement | null) {
  if (!img) return
  for (const q of arr) {
    let t = q.age / PARTICLE_DURATION
    const ease = --t * t * t + 1 // 0 → 1
    const size = img.width * ease
    ctx.globalAlpha = Math.max(0, 1 - q.age / PARTICLE_DURATION)
    ctx.drawImage(img, q.x - size / 2, q.y - size / 2, size, size)
  }
  ctx.globalAlpha = 1
}

// ── 内容绘制（黑底之上、粒子之上）────────────────────────────

interface ContentOpts {
  mode: "names" | "images"
  nameA: string
  nameB: string
  imgA: HTMLImageElement | null
  imgB: HTMLImageElement | null
  textColor: string
  scale: number
  gap: number
  offsetY: number
  fontSize: number
  imgViewYA: number
  imgViewYB: number
  imgGap: number
  imgBoxY: number
  imgSize: number
  imgZoomA: number
  imgZoomB: number
}

/** 画布中央显示名字或照片（不带背景） */
function drawContent(ctx: CanvasRenderingContext2D, layout: HeartLayout, opts: ContentOpts) {
  ctx.save()
  ctx.translate(layout.cx, layout.cy)
  ctx.scale(opts.scale, opts.scale)
  ctx.translate(-layout.cx, -layout.cy)

  if (opts.mode === "names") {
    drawName(ctx, opts.nameA, "left", layout, opts.textColor, opts.gap, opts.offsetY, opts.fontSize)
    drawName(ctx, opts.nameB, "right", layout, opts.textColor, opts.gap, opts.offsetY, opts.fontSize)
  } else {
    drawImagePair(
      ctx,
      opts.imgA,
      opts.imgB,
      layout,
      opts.imgViewYA,
      opts.imgViewYB,
      opts.imgGap,
      opts.imgBoxY,
      opts.imgSize,
      opts.imgZoomA,
      opts.imgZoomB,
    )
  }

  ctx.restore()
}

// ── 页面组件 ──────────────────────────────────────────────────

export default function LoveHeartPage() {
  const [mode, setMode] = useState<"names" | "images">("names")
  const [nameA, setNameA] = useState("LOVE")
  const [nameB, setNameB] = useState("YOU")
  const [imgA, setImgA] = useState<HTMLImageElement | null>(null)
  const [imgB, setImgB] = useState<HTMLImageElement | null>(null)
  const [imgAUrl, setImgAUrl] = useState<string | null>(null)
  const [imgBUrl, setImgBUrl] = useState<string | null>(null)
  const [heartColor, setHeartColor] = useState("#ea80b0")
  const [textColor, setTextColor] = useState("#ffffff")
  const [gap, setGap] = useState(0.25) // 占心形宽度的比例
  const [offsetY, setOffsetY] = useState(-0.1) // 占心形高度的比例
  const [fontSize, setFontSize] = useState(0.16) // 占心形高度的比例
  const [imgViewYA, setImgViewYA] = useState(0) // 左图裁剪窗口的垂直位置（人物居中）
  const [imgViewYB, setImgViewYB] = useState(0) // 右图裁剪窗口的垂直位置（人物居中）
  const [imgGap, setImgGap] = useState(0.24) // 两个圆形框的间距（占心形宽度）
  const [imgBoxY, setImgBoxY] = useState(-0.15) // 圆形框整体垂直位置（占心形高度）
  const [imgSize, setImgSize] = useState(0.42) // 圆形框直径（占心形高度）
  const [imgZoomA, setImgZoomA] = useState(1) // 左图在框内的缩放（1=填满圆形框）
  const [imgZoomB, setImgZoomB] = useState(1) // 右图在框内的缩放
  const [fireworks, setFireworks] = useState(false) // 烟花效果（默认不开启）
  const [fwIntensity, setFwIntensity] = useState(10) // 烟花强度（发射频率）
  const [copied, setCopied] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fireworksRef = useRef<HTMLDivElement>(null)
  const fireworksInstanceRef = useRef<Fireworks | null>(null)
  const fullscreenRef = useRef<HTMLDivElement>(null)
  const fileARef = useRef<HTMLInputElement>(null)
  const fileBRef = useRef<HTMLInputElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const heartImgRef = useRef<HTMLImageElement | null>(null)
  const lastTimeRef = useRef(0)

  // 粒子图形随心的颜色重建
  useEffect(() => {
    heartImgRef.current = createHeartImage(30, heartColor)
  }, [heartColor])

  // 图片加载
  const loadImage = useCallback((file: File, slot: "A" | "B") => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        if (slot === "A") {
          setImgA(img)
          setImgAUrl(reader.result as string)
        } else {
          setImgB(img)
          setImgBUrl(reader.result as string)
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }, [])

  // 主渲染：黑底 + 粒子飞散 + 中央名字/图片（粒子固定开启、无心跳，画布尺寸自适应）
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let W = 600
    let H = 600
    canvas.width = W
    canvas.height = H
    let layout = computeLayout(W, H)
    let raf = 0
    lastTimeRef.current = performance.now()

    const render = (now: number) => {
      const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000)
      lastTimeRef.current = now
      const ctx = canvas.getContext("2d")!

      // 全屏切换后画布内部尺寸变化，按新尺寸重建布局
      if (canvas.width !== W || canvas.height !== H) {
        W = canvas.width
        H = canvas.height
        layout = computeLayout(W, H)
      }

      // 1. 黑底
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, W, H)

      // 2. 粒子从心形轮廓喷出
      updateParticles(particlesRef.current, dt, layout)
      drawParticles(ctx, particlesRef.current, heartImgRef.current)

      // 3. 中央名字/图片
      drawContent(ctx, layout, {
        mode,
        nameA,
        nameB,
        imgA,
        imgB,
        textColor,
        scale: 1,
        gap,
        offsetY,
        fontSize,
        imgViewYA,
        imgViewYB,
        imgGap,
        imgBoxY,
        imgSize,
        imgZoomA,
        imgZoomB,
      })

      raf = requestAnimationFrame(render)
    }

    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [mode, nameA, nameB, imgA, imgB, textColor, gap, offsetY, fontSize, imgViewYA, imgViewYB, imgGap, imgBoxY, imgSize, imgZoomA, imgZoomB])

  // 全屏切换：对包裹画布与烟花层的容器全屏（两者一起进入全屏），画布铺满屏幕并跟随屏幕尺寸
  useEffect(() => {
    const onChange = () => {
      const canvas = canvasRef.current
      const wrapper = fullscreenRef.current
      if (!canvas || !wrapper) return
      if (document.fullscreenElement === wrapper) {
        canvas.width = Math.floor(window.innerWidth)
        canvas.height = Math.floor(window.innerHeight)
        canvas.style.width = "100vw"
        canvas.style.height = "100vh"
        canvas.style.maxWidth = "none"
        canvas.style.maxHeight = "none"
      } else {
        canvas.width = 600
        canvas.height = 600
        canvas.style.width = ""
        canvas.style.height = ""
        canvas.style.maxWidth = ""
        canvas.style.maxHeight = ""
      }
    }
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  const toggleFullscreen = async () => {
    const wrapper = fullscreenRef.current
    if (!wrapper) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await wrapper.requestFullscreen()
      }
    } catch {
      // 忽略
    }
  }

  // 烟花效果：开关打开时在画面上方创建 fireworks 实例，关闭时销毁
  useEffect(() => {
    if (!fireworks || !fireworksRef.current) return
    const fw = new Fireworks(fireworksRef.current, {
      opacity: 0.5,
      particles: 40,
      traceLength: 3,
      hue: { min: 0, max: 360 },
      mouse: { click: false, move: false, max: 1 },
      sound: { enabled: false },
    })
    fireworksInstanceRef.current = fw
    fw.start()
    return () => {
      fw.stop(true)
      fireworksInstanceRef.current = null
    }
  }, [fireworks])

  // 烟花强度：实例创建后或强度变化时同步（intensity 越高发射越频繁）
  useEffect(() => {
    fireworksInstanceRef.current?.updateOptions({ intensity: fwIntensity })
  }, [fwIntensity, fireworks])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const W = 600
    const H = 600
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext("2d")!
    const layout = computeLayout(W, H)

    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, W, H)

    drawParticles(ctx, particlesRef.current, heartImgRef.current)

    drawContent(ctx, layout, {
      mode,
      nameA,
      nameB,
      imgA,
      imgB,
      textColor,
      scale: 1,
      gap,
      offsetY,
      fontSize,
      imgViewYA,
      imgViewYB,
      imgGap,
      imgBoxY,
      imgSize,
      imgZoomA,
      imgZoomB,
    })

    const a = document.createElement("a")
    a.href = canvas.toDataURL("image/png")
    a.download = "love-heart.png"
    a.click()
  }

  const copyImage = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") return
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
      if (!blob) return
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 忽略
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">爱心生成</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          黑底粒子爱心效果，中央可放两个名字或两张照片，参考 love-code 的粒子爱心样式
        </p>
      </div>

      {/* 输入 */}
      <Card>
        <CardHeader>
          <CardTitle>内容设置</CardTitle>
          <CardDescription>选择心内展示名字或照片</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-1">
            <Button
              variant={mode === "names" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("names")}
            >
              💌 两个名字
            </Button>
            <Button
              variant={mode === "images" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("images")}
            >
              🖼 两张照片
            </Button>
          </div>

          {mode === "names" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">名字 A（左）</label>
                <input
                  type="text"
                  value={nameA}
                  onChange={(e) => setNameA(e.currentTarget.value)}
                  maxLength={8}
                  className="w-full border border-border bg-transparent px-2 py-1.5 text-sm outline-none focus-visible:border-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">名字 B（右）</label>
                <input
                  type="text"
                  value={nameB}
                  onChange={(e) => setNameB(e.currentTarget.value)}
                  maxLength={8}
                  className="w-full border border-border bg-transparent px-2 py-1.5 text-sm outline-none focus-visible:border-ring"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["A", imgAUrl, fileARef, (img: HTMLImageElement | null) => setImgA(img), (s: string | null) => setImgAUrl(s)],
                  ["B", imgBUrl, fileBRef, (img: HTMLImageElement | null) => setImgB(img), (s: string | null) => setImgBUrl(s)],
                ] as const
              ).map(([slot, url, fileRef, setImg, setUrl]) => (
                <div key={slot}>
                  <label className="mb-1 block text-xs text-muted-foreground">照片 {slot}（{slot === "A" ? "左" : "右"}）</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="flex h-28 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border transition-colors hover:border-ring"
                  >
                    {url ? (
                      <img src={url} alt={`照片${slot}`} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground">点击选择照片</span>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0]
                      if (file) loadImage(file, slot)
                    }}
                  />
                  {url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 text-xs"
                      onClick={() => {
                        setImg(null)
                        setUrl(null)
                        if (fileRef.current) fileRef.current.value = ""
                      }}
                    >
                      清除
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 样式 */}
      <Card>
        <CardHeader>
          <CardTitle>样式设置</CardTitle>
          <CardDescription>自定义粒子与文字的颜色、间距和位置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">粒子颜色</label>
              <input
                type="color"
                value={heartColor}
                onChange={(e) => setHeartColor(e.currentTarget.value)}
                className="size-7 cursor-pointer border-0 bg-transparent"
              />
            </div>
            {mode === "names" && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">文字颜色</label>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.currentTarget.value)}
                  className="size-7 cursor-pointer border-0 bg-transparent"
                />
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={fireworks}
              onChange={() => setFireworks((v) => !v)}
              className="accent-foreground size-4"
            />
            烟花效果
          </label>

          {fireworks && (
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>烟花强度</span>
                <span>{fwIntensity}</span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                step={1}
                value={fwIntensity}
                onChange={(e) => setFwIntensity(Number(e.currentTarget.value))}
                className="w-full"
              />
            </div>
          )}

          {mode === "names" && (
            <div className="space-y-3 pt-1">
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>文字大小</span>
                  <span>{Math.round(fontSize * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.06}
                  max={0.5}
                  step={0.01}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.currentTarget.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>文字间距</span>
                  <span>{Math.round(gap * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.45}
                  step={0.01}
                  value={gap}
                  onChange={(e) => setGap(Number(e.currentTarget.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>垂直位置</span>
                  <span>{offsetY > 0 ? "+" : ""}{Math.round(offsetY * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={-0.3}
                  max={0.3}
                  step={0.01}
                  value={offsetY}
                  onChange={(e) => setOffsetY(Number(e.currentTarget.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {mode === "images" && (
            <div className="space-y-3 pt-1">
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>圆形框大小</span>
                  <span>{Math.round(imgSize * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={0.6}
                  step={0.01}
                  value={imgSize}
                  onChange={(e) => setImgSize(Number(e.currentTarget.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>左图大小</span>
                  <span>{Math.round(imgZoomA * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.01}
                  value={imgZoomA}
                  onChange={(e) => setImgZoomA(Number(e.currentTarget.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>右图大小</span>
                  <span>{Math.round(imgZoomB * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.01}
                  value={imgZoomB}
                  onChange={(e) => setImgZoomB(Number(e.currentTarget.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>图片间距</span>
                  <span>{Math.round(imgGap * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.45}
                  step={0.01}
                  value={imgGap}
                  onChange={(e) => setImgGap(Number(e.currentTarget.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>垂直位置</span>
                  <span>{imgBoxY > 0 ? "+" : ""}{Math.round(imgBoxY * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={-0.3}
                  max={0.3}
                  step={0.01}
                  value={imgBoxY}
                  onChange={(e) => setImgBoxY(Number(e.currentTarget.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>左图人物位置</span>
                  <span>{imgViewYA > 0 ? "+" : ""}{Math.round(imgViewYA * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={-0.5}
                  max={0.5}
                  step={0.01}
                  value={imgViewYA}
                  onChange={(e) => setImgViewYA(Number(e.currentTarget.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>右图人物位置</span>
                  <span>{imgViewYB > 0 ? "+" : ""}{Math.round(imgViewYB * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={-0.5}
                  max={0.5}
                  step={0.01}
                  value={imgViewYB}
                  onChange={(e) => setImgViewYB(Number(e.currentTarget.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 预览 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>预览</CardTitle>
            <CardDescription>实时渲染，可全屏查看，按 ESC 退出全屏</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              ⛶ 全屏
            </Button>
            <Button variant="outline" size="sm" onClick={copyImage}>
              {copied ? "已复制" : "复制图片"}
            </Button>
            <Button variant="outline" size="sm" onClick={download}>
              下载 PNG
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center rounded-lg border border-border bg-muted/30 p-3">
            <div ref={fullscreenRef} className="relative w-fit">
              <canvas ref={canvasRef} className="h-auto max-h-[520px] max-w-full" />
              {fireworks && (
                <div ref={fireworksRef} className="pointer-events-none absolute inset-0 z-10" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
