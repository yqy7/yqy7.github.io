import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// ── 工具函数 ──────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// ── 页面组件 ──────────────────────────────────────────────────

export default function ResizePage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null)
  const [origW, setOrigW] = useState(0)
  const [origH, setOrigH] = useState(0)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [keepAspect, setKeepAspect] = useState(true)
  const [resultSrc, setResultSrc] = useState<string | null>(null)
  const [resultSize, setResultSize] = useState(0)
  const [copied, setCopied] = useState(false)

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
        setOrigW(img.naturalWidth)
        setOrigH(img.naturalHeight)
        setWidth(img.naturalWidth)
        setHeight(img.naturalHeight)
        setResultSrc(null)
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

  // 调整尺寸
  useEffect(() => {
    const img = loadedImg
    if (!img) return

    const w = Math.max(1, Math.round(width) || 1)
    const h = Math.max(1, Math.round(height) || 1)

    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, 0, 0, w, h)

    const dataUrl = canvas.toDataURL("image/png")
    // 估算字节数：base64 长度 × 3/4
    const bytes = Math.round(((dataUrl.length - 22) * 3) / 4)
    setResultSrc(dataUrl)
    setResultSize(Math.max(0, bytes))
  }, [loadedImg, width, height])

  // 宽度变化（保持比例时联动高度）
  const handleWidthChange = (v: number) => {
    setWidth(v)
    if (keepAspect && origW > 0) {
      setHeight(Math.round((v / origW) * origH))
    }
  }

  // 高度变化（保持比例时联动宽度）
  const handleHeightChange = (v: number) => {
    setHeight(v)
    if (keepAspect && origH > 0) {
      setWidth(Math.round((v / origH) * origW))
    }
  }

  const download = () => {
    if (!resultSrc) return
    const a = document.createElement("a")
    a.href = resultSrc
    a.download = "resized.png"
    a.click()
  }

  const copyImage = async () => {
    if (!resultSrc) return
    try {
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
        return
      }
      const img = new Image()
      img.src = resultSrc
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("图片加载失败"))
      })
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext("2d")!.drawImage(img, 0, 0)
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
        <h1 className="text-2xl font-semibold tracking-tight">图片尺寸调整</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          按像素精确调整图片宽高，支持保持宽高比
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
              <img src={imageSrc} alt="原始图片" className="max-h-40 max-w-full object-contain" />
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                <p className="text-3xl">📐</p>
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
          {origW > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              原图：{origW} × {origH} 像素
            </p>
          )}
        </CardContent>
      </Card>

      {/* 尺寸设置 */}
      {imageSrc && (
        <Card>
          <CardHeader>
            <CardTitle>目标尺寸</CardTitle>
            <CardDescription>设置输出图片的像素宽高</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">宽度</label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={width}
                  onChange={(e) => handleWidthChange(Number(e.currentTarget.value))}
                  className="w-24 border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus-visible:border-ring"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">高度</label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={height}
                  onChange={(e) => handleHeightChange(Number(e.currentTarget.value))}
                  className="w-24 border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus-visible:border-ring"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={keepAspect}
                  onChange={() => setKeepAspect((v) => !v)}
                  className="accent-foreground size-4"
                />
                保持宽高比
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              输出尺寸：{Math.max(1, Math.round(width) || 1)} × {Math.max(1, Math.round(height) || 1)} 像素
            </p>
          </CardContent>
        </Card>
      )}

      {/* 结果 */}
      {resultSrc && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>调整结果</CardTitle>
              <CardDescription>
                {Math.max(1, Math.round(width) || 1)} × {Math.max(1, Math.round(height) || 1)} 像素 · {formatSize(resultSize)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyImage}>
                {copied ? "已复制" : "复制图片"}
              </Button>
              <Button variant="outline" size="sm" onClick={download}>
                下载 PNG
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center rounded-lg border border-border bg-muted/30 p-4">
              <img src={resultSrc} alt="调整结果" className="max-h-[400px] max-w-full object-contain" />
            </div>
          </CardContent>
        </Card>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
