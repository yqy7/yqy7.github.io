import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { saveImage, copyImage } from "@/lib/platform"
import paperTextureUrl from "@/assets/paper-texture.jpg"

// ── 纹理兜底：素材加载失败时生成灰度噪点纸纹 canvas ────────

function createFallbackTexture(): HTMLCanvasElement {
  const size = 512
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!
  const imageData = ctx.createImageData(size, size)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const g = 238 + Math.round((Math.random() - 0.5) * 24) // 238±12 偏亮灰，对 multiply 友好
    data[i] = g
    data[i + 1] = g
    data[i + 2] = g
    data[i + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

// ── 绘制辅助函数（模块级纯函数，不引用组件 state/ref）──────

/** 1. 画原图（可选 sepia 泛黄），只作用于原图，画完复位 filter */
function drawBase(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  sepia: number,
) {
  if (sepia > 0) ctx.filter = `sepia(${sepia}%)`
  ctx.drawImage(img, 0, 0, w, h)
  ctx.filter = "none"
}

/** 2. 纸纹理以 multiply 叠加（intensity 为 globalAlpha） */
function applyTexture(
  ctx: CanvasRenderingContext2D,
  texture: HTMLImageElement | HTMLCanvasElement,
  w: number,
  h: number,
  intensity: number,
) {
  if (intensity <= 0) return
  ctx.globalCompositeOperation = "multiply"
  ctx.globalAlpha = intensity / 100
  ctx.drawImage(texture, 0, 0, w, h)
  ctx.globalCompositeOperation = "source-over"
  ctx.globalAlpha = 1
}

/** 3. 像素噪点：RGB 各加随机扰动，alpha 保持不变 */
function applyNoise(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  if (amount <= 0) return
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * amount
    data[i] += n
    data[i + 1] += n
    data[i + 2] += n
  }
  ctx.putImageData(imageData, 0, 0)
}

/** 4. 边缘暗角：中心透明 → 边缘变暗 */
function applyVignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength: number) {
  if (strength <= 0) return
  const cx = w / 2
  const cy = h / 2
  const diag = Math.sqrt(w * w + h * h)
  const grad = ctx.createRadialGradient(cx, cy, diag * 0.4, cx, cy, diag * 0.707)
  grad.addColorStop(0, "rgba(0,0,0,0)")
  grad.addColorStop(1, `rgba(0,0,0,${strength})`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

// ── 页面组件 ──────────────────────────────────────────────────

export default function PaperTexturePage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null)
  const [paperImg, setPaperImg] = useState<HTMLImageElement | HTMLCanvasElement | null>(null)

  const [texture, setTexture] = useState(60) // 纹理强度 → multiply 的 globalAlpha
  const [sepia, setSepia] = useState(30) // 泛黄程度 → sepia(N%)
  const [noise, setNoise] = useState(20) // 噪点强度 → 幅度 noise*0.6
  const [vignette, setVignette] = useState(25) // 边缘暗角 → 黑色透明度 vignette/100*0.8

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 纹理素材预加载（import 得到 URL → new Image()）
  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setPaperImg(img)
    }
    img.onerror = () => {
      if (!cancelled) setPaperImg(createFallbackTexture())
    }
    img.src = paperTextureUrl
    return () => {
      cancelled = true
    }
  }, [])

  // 图片加载
  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        setLoadedImg(img)
        setImageSrc(reader.result as string)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }, [])

  // 拖拽
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) loadImage(file)
    },
    [loadImage],
  )

  // 粘贴
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) loadImage(file)
          break
        }
      }
    }
    document.addEventListener("paste", handler)
    return () => document.removeEventListener("paste", handler)
  }, [loadImage])

  // 重绘：白纸底 → 泛黄 → 纸纹 → 噪点 → 暗角
  useEffect(() => {
    const img = loadedImg
    const canvas = canvasRef.current
    const paper = paperImg
    if (!img || !canvas || !paper) return

    const w = img.naturalWidth
    const h = img.naturalHeight
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")!

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, w, h) // 白色纸底：避免透明 PNG 在 multiply/噪点下出错

    drawBase(ctx, img, w, h, sepia)
    applyTexture(ctx, paper, w, h, texture)
    applyNoise(ctx, w, h, noise * 0.6)
    applyVignette(ctx, w, h, (vignette / 100) * 0.8)
  }, [loadedImg, paperImg, texture, sepia, noise, vignette])

  // 导出（跨平台：Web 下载 / Tauri 原生保存）
  const handleDownload = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    await saveImage(canvas.toDataURL("image/png"), "paper-texture.png")
  }

  const handleCopy = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    await copyImage(canvas.toDataURL("image/png"))
  }

  const settings = [
    { key: "texture", label: "纹理强度", value: texture, set: setTexture },
    { key: "sepia", label: "泛黄程度", value: sepia, set: setSepia },
    { key: "noise", label: "噪点强度", value: noise, set: setNoise },
    { key: "vignette", label: "边缘暗角", value: vignette, set: setVignette },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">纸质纹理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          上传图片叠加纸质纹理做旧，可调节纹理强度、泛黄、噪点和边缘暗角
        </p>
      </div>

      {/* 上传 */}
      <Card>
        <CardHeader>
          <CardTitle>上传图片</CardTitle>
          <CardDescription>支持拖拽、点击选择或 Ctrl+V 粘贴截图</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-ring"
          >
            {imageSrc ? (
              <img src={imageSrc} alt="原始图片" className="max-h-56 max-w-full object-contain" />
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                <p className="text-3xl">📜</p>
                <p className="mt-2">拖拽图片到此处，或点击选择</p>
                <p className="mt-1 text-xs">也支持 Ctrl+V 粘贴截图</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0]
              if (file) loadImage(file)
            }}
          />
        </CardContent>
      </Card>

      {/* 纹理调节 */}
      {imageSrc && (
        <Card>
          <CardHeader>
            <CardTitle>纹理调节</CardTitle>
            <CardDescription>调节做旧效果：纹理强度、泛黄、噪点与暗角</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.map((s) => (
              <div key={s.key} className="flex items-center gap-3">
                <label className="w-16 shrink-0 text-sm text-muted-foreground">{s.label}</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={s.value}
                  onChange={(e) => s.set(Number(e.currentTarget.value))}
                  className="min-w-0 flex-1 accent-foreground"
                />
                <span className="w-10 text-right font-mono text-sm">{s.value}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 预览 */}
      {imageSrc && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>预览</CardTitle>
              <CardDescription>实时生成，点击按钮导出</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                复制图片
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                下载 PNG
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center rounded-lg border border-border bg-muted/30 p-4">
              <canvas ref={canvasRef} className="max-h-[420px] max-w-full object-contain" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
