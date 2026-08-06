import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Compressor from "compressorjs"

// ── 类型 ──────────────────────────────────────────────────────

interface OutputInfo {
  blob: Blob
  url: string
  size: number
  width: number
  height: number
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// ── 页面组件 ──────────────────────────────────────────────────

export default function ImageCompressPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [origSize, setOrigSize] = useState(0)
  const [origDims, setOrigDims] = useState({ w: 0, h: 0 })
  const [quality, setQuality] = useState(0.7)
  const [format, setFormat] = useState<"auto" | "image/jpeg" | "image/webp" | "image/png">("auto")
  const [maxWidth, setMaxWidth] = useState(0) // 0 = 不限制
  const [output, setOutput] = useState<OutputInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [fileName, setFileName] = useState("image")
  const [origType, setOrigType] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    setOrigSize(file.size)
    setOrigType(file.type)
    setFileName(file.name.replace(/\.[^.]+$/, ""))

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setOrigDims({ w: img.naturalWidth, h: img.naturalHeight })
      setImageSrc(url)
      setOutput(null)
      setError("")
    }
    img.src = url
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

  // 压缩
  const handleCompress = useCallback(() => {
    if (!imageSrc) return
    setLoading(true)
    setError("")
    setOutput(null)

    fetch(imageSrc)
      .then((r) => r.blob())
      .then((blob) => {
        return new Promise<OutputInfo>((resolve, reject) => {
          new Compressor(blob, {
            quality,
            mimeType: format,
            maxWidth: maxWidth > 0 ? maxWidth : undefined,
            maxHeight: maxWidth > 0 ? maxWidth : undefined,
            success(result) {
              const url = URL.createObjectURL(result)
              const img = new Image()
              img.onload = () => {
                resolve({ blob: result, url, size: result.size, width: img.naturalWidth, height: img.naturalHeight })
              }
              img.src = url
            },
            error(err) {
              reject(err)
            },
          })
        })
      })
      .then((info) => setOutput(info))
      .catch((e) => setError(e?.message ?? "压缩失败"))
      .finally(() => setLoading(false))
  }, [imageSrc, quality, format, maxWidth])

  // 下载
  const download = () => {
    if (!output) return
    const ext = format === "image/png" ? "png" : format === "image/webp" ? "webp" : "jpg"
    const a = document.createElement("a")
    a.href = output.url
    a.download = `${fileName}-compressed.${ext}`
    a.click()
  }

  const copyImage = async () => {
    if (!output) return
    setError("")
    try {
      // 转成 PNG 再复制（剪贴板对 image/png 兼容性最好）
      const img = new Image()
      img.src = output.url
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("图片加载失败"))
      })
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext("2d")!.drawImage(img, 0, 0)

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      )
      if (!blob) throw new Error("无法生成图片")

      if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
        throw new Error("当前浏览器不支持复制图片")
      }

      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError("复制失败：当前浏览器不支持或已被拦截")
    }
  }

  const formatLabel = (fmt: string) =>
    fmt === "auto" ? "保持原格式" : fmt === "image/jpeg" ? "JPEG" : fmt === "image/webp" ? "WebP" : "PNG"

  const ratio = origSize > 0 && output ? (1 - output.size / origSize) * 100 : 0

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">图片压缩</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          在线压缩图片，支持质量调节和格式转换
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
                <p className="text-3xl">🗜</p>
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
          {imageSrc && (
            <p className="mt-2 text-xs text-muted-foreground">
              原图：{formatSize(origSize)} · {origDims.w} × {origDims.h}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 压缩设置 */}
      {imageSrc && (
        <Card>
          <CardHeader>
            <CardTitle>压缩设置</CardTitle>
            <CardDescription>调节质量和输出格式</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="shrink-0 text-sm text-muted-foreground">质量</label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={quality}
                onChange={(e) => setQuality(Number(e.currentTarget.value))}
                className="min-w-0 flex-1 accent-foreground"
              />
              <span className="w-10 text-right font-mono text-sm">{Math.round(quality * 100)}%</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">格式</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.currentTarget.value as typeof format)}
                  className="border border-border bg-transparent px-2 py-1.5 text-sm outline-none focus-visible:border-ring"
                >
                  {(["auto", "image/jpeg", "image/webp", "image/png"] as const).map((f) => (
                    <option key={f} value={f}>
                      {formatLabel(f)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">最大尺寸</label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={maxWidth}
                  onChange={(e) => {
                    const v = Number(e.currentTarget.value)
                    if (v >= 0) setMaxWidth(v)
                  }}
                  className="w-20 border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus-visible:border-ring"
                />
                <span className="text-xs text-muted-foreground">px（0=不限制）</span>
              </div>
            </div>

            {(format === "image/png" || (format === "auto" && origType === "image/png")) && (
              <p className="rounded-lg border border-amber-500/30 bg-amber-50/50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
                ⚠️ PNG 为无损格式，转换后可能比原图更大。照片类图片建议使用 JPEG 或 WebP。
              </p>
            )}

            <Button onClick={handleCompress} disabled={loading} className="w-full">
              {loading ? "压缩中…" : "开始压缩"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 错误 */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-50/50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 结果 */}
      {output && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>压缩结果</CardTitle>
              <CardDescription>
                {formatLabel(format)} · {output.width} × {output.height}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyImage}>
                {copied ? "已复制" : "复制图片"}
              </Button>
              <Button variant="outline" size="sm" onClick={download}>
                下载
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-border bg-muted/30 px-2 py-2">
                <p className="text-[11px] text-muted-foreground">原大小</p>
                <p className="font-mono text-sm">{formatSize(origSize)}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 px-2 py-2">
                <p className="text-[11px] text-muted-foreground">压缩后</p>
                <p className="font-mono text-sm">{formatSize(output.size)}</p>
              </div>
              <div
                className={`rounded-lg border px-2 py-2 ${
                  ratio > 0 ? "border-green-500/40 bg-green-50/50 dark:bg-green-950/20" : "border-border bg-muted/30"
                }`}
              >
                <p className="text-[11px] text-muted-foreground">节省</p>
                <p className={`font-mono text-sm ${ratio > 0 ? "text-green-600 dark:text-green-400" : ""}`}>
                  {ratio > 0 ? `${ratio.toFixed(1)}%` : "无变化"}
                </p>
              </div>
            </div>
            <div className="flex justify-center rounded-lg border border-border bg-muted/30 p-4">
              <img src={output.url} alt="压缩结果" className="max-h-[300px] max-w-full object-contain" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
