import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// ── 位置选项 ──────────────────────────────────────────────────

const POSITIONS = [
  { value: "tl", label: "左上" },
  { value: "tr", label: "右上" },
  { value: "bl", label: "左下" },
  { value: "br", label: "右下" },
  { value: "center", label: "居中" },
  { value: "tile", label: "平铺" },
] as const

type Position = (typeof POSITIONS)[number]["value"]

// ── 页面组件 ──────────────────────────────────────────────────

export default function WatermarkPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null)
  const [text, setText] = useState("水印")
  const [position, setPosition] = useState<Position>("tile")
  const [fontSize, setFontSize] = useState(32)
  const [bold, setBold] = useState(false)
  const [color, setColor] = useState("#ffffff")
  const [opacity, setOpacity] = useState(60)
  const [angle, setAngle] = useState(-30)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // 渲染水印
  useEffect(() => {
    const img = loadedImg
    const canvas = canvasRef.current
    if (!img || !canvas) return

    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, 0, 0)

    if (!text.trim()) return

    const w = canvas.width
    const h = canvas.height
    const px = fontSize
    const font = `${bold ? "bold " : ""}${px}px sans-serif`
    const rad = (angle * Math.PI) / 180

    ctx.font = font
    ctx.fillStyle = color
    ctx.globalAlpha = opacity / 100
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    if (position === "tile") {
      // 平铺斜纹水印：旋转后铺满
      const tw = ctx.measureText(text).width
      const gapX = tw + px * 3
      const gapY = px * 2.2
      const diag = Math.ceil(Math.sqrt(w * w + h * h))

      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate(rad)
      for (let y = -diag; y < diag; y += gapY) {
        for (let x = -diag; x < diag; x += gapX) {
          ctx.fillText(text, x, y)
        }
      }
      ctx.restore()
    } else {
      // 单点水印：定位到四个角 / 居中
      const pad = px * 1.5
      const posMap: Record<Exclude<Position, "tile">, [number, number]> = {
        tl: [pad, pad],
        tr: [w - pad, pad],
        bl: [pad, h - pad],
        br: [w - pad, h - pad],
        center: [w / 2, h / 2],
      }
      const [x, y] = posMap[position as Exclude<Position, "tile">]
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rad)
      ctx.fillText(text, 0, 0)
      ctx.restore()
    }

    ctx.globalAlpha = 1
  }, [loadedImg, text, position, fontSize, bold, color, opacity, angle])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement("a")
    a.href = canvas.toDataURL("image/png")
    a.download = "watermark.png"
    a.click()
  }

  const copyImage = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(async (blob) => {
      if (!blob) return
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">图片加水印</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          上传图片添加文字水印，支持调节透明度、方向和位置
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
                <p className="text-3xl">🖼</p>
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

      {/* 水印设置 */}
      {imageSrc && (
        <Card>
          <CardHeader>
            <CardTitle>水印设置</CardTitle>
            <CardDescription>调整文字内容、样式、位置和方向</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 内容 */}
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.currentTarget.value)}
              placeholder="输入水印文字…"
              className="w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
            />

            {/* 位置 */}
            <div className="flex flex-wrap gap-1">
              {POSITIONS.map((p) => (
                <Button
                  key={p.value}
                  variant={position === p.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPosition(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            {/* 字号 / 颜色 / 加粗 */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">字号</label>
                <input
                  type="number"
                  min={12}
                  max={200}
                  value={fontSize}
                  onChange={(e) => {
                    const v = Number(e.currentTarget.value)
                    if (v >= 12 && v <= 200) setFontSize(v)
                  }}
                  className="w-16 border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus-visible:border-ring"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">颜色</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.currentTarget.value)}
                  className="size-7 cursor-pointer border-0 bg-transparent"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={bold}
                  onChange={() => setBold((v) => !v)}
                  className="accent-foreground size-4"
                />
                加粗
              </label>
            </div>

            {/* 透明度 */}
            <div className="flex items-center gap-3">
              <label className="shrink-0 text-sm text-muted-foreground">透明度</label>
              <input
                type="range"
                min={5}
                max={100}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.currentTarget.value))}
                className="min-w-0 flex-1 accent-foreground"
              />
              <span className="w-10 text-right font-mono text-sm">{opacity}%</span>
            </div>

            {/* 旋转 */}
            <div className="flex items-center gap-3">
              <label className="shrink-0 text-sm text-muted-foreground">方向</label>
              <input
                type="range"
                min={-180}
                max={180}
                value={angle}
                onChange={(e) => setAngle(Number(e.currentTarget.value))}
                className="min-w-0 flex-1 accent-foreground"
              />
              <span className="w-10 text-right font-mono text-sm">{angle}°</span>
            </div>
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
              <Button variant="outline" size="sm" onClick={copyImage}>
                复制图片
              </Button>
              <Button variant="outline" size="sm" onClick={download}>
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
