import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Pixelit from "./pixelit"

// ── 页面组件 ──────────────────────────────────────────────────

export default function PixelArtPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null)
  const [pixelSize, setPixelSize] = useState(12) // 像素块大小（源图像素）
  const [grayscale, setGrayscale] = useState(false)
  const [usePalette, setUsePalette] = useState(false)
  const [grid, setGrid] = useState("")

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

  // 像素化处理
  useEffect(() => {
    if (!loadedImg || !canvasRef.current) return

    // pixelit scale：越大网格越细（范围 1-50），像素块越大则 scale 越小
    const scale = Math.max(1, Math.min(50, Math.round(100 / pixelSize)))
    const pix = new Pixelit({ from: loadedImg, to: canvasRef.current, scale })

    pix.draw().pixelate()
    if (grayscale) pix.convertGrayscale()
    if (usePalette) pix.convertPalette()

    // 计算输出网格尺寸
    const natW = loadedImg.naturalWidth
    const natH = loadedImg.naturalHeight
    const halved = natW > 900 || natH > 900
    const workScale = (scale * 0.01) * (halved ? 0.5 : 1)
    setGrid(`${Math.round(natW * workScale)} × ${Math.round(natH * workScale)} 格`)
  }, [loadedImg, pixelSize, grayscale, usePalette])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement("a")
    a.href = canvas.toDataURL("image/png")
    a.download = "pixel-art.png"
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
        <h1 className="text-2xl font-semibold tracking-tight">图片像素画</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          将图片转换为像素风格，支持调节像素大小和调色板
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

      {/* 设置 */}
      {imageSrc && (
        <Card>
          <CardHeader>
            <CardTitle>像素设置</CardTitle>
            <CardDescription>调整像素块大小和颜色处理方式</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="shrink-0 text-sm text-muted-foreground">像素大小</label>
              <input
                type="range"
                min={2}
                max={100}
                value={pixelSize}
                onChange={(e) => setPixelSize(Number(e.currentTarget.value))}
                className="min-w-0 flex-1 accent-foreground"
              />
              <span className="w-10 text-right font-mono text-sm">{pixelSize}px</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={grayscale}
                  onChange={() => setGrayscale((v) => !v)}
                  className="accent-foreground size-4"
                />
                灰度
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={usePalette}
                  onChange={() => setUsePalette((v) => !v)}
                  className="accent-foreground size-4"
                />
                应用调色板
              </label>
            </div>
            <p className="text-xs text-muted-foreground">输出分辨率：{grid}</p>
          </CardContent>
        </Card>
      )}

      {/* 结果 */}
      {imageSrc && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>像素画结果</CardTitle>
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
