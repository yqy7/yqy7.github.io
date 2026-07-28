import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getColor, getPalette } from "colorthief"

// ── 颜色色块组件 ──────────────────────────────────────────────

function ColorSwatch({
  color,
  largest,
}: {
  color: { hex: string; rgb: [number, number, number]; hsl: [number, number, number] }
  largest?: boolean
}) {
  const [copied, setCopied] = useState(false)

  const copyHex = async () => {
    await navigator.clipboard.writeText(color.hex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <button
      onClick={copyHex}
      className="group relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-border p-3 transition-all hover:shadow-md"
      title={`点击复制 ${color.hex}`}
    >
      <div
        className={`rounded-md transition-transform group-hover:scale-105 ${
          largest ? "size-20" : "size-14"
        }`}
        style={{ backgroundColor: color.hex }}
      />
      <div className="text-center">
        <p className={`font-mono font-medium ${largest ? "text-sm" : "text-xs"}`}>
          {copied ? (
            <span className="text-green-600">已复制</span>
          ) : (
            color.hex.toUpperCase()
          )}
        </p>
        <p className="text-[10px] text-muted-foreground">
          R{color.rgb[0]} G{color.rgb[1]} B{color.rgb[2]}
        </p>
      </div>
      {largest && (
        <span className="absolute right-2 top-2 rounded-sm bg-background/80 px-1.5 py-0.5 text-[10px] font-medium">
          主色
        </span>
      )}
    </button>
  )
}

// ── 页面组件 ──────────────────────────────────────────────────

export default function ColorExtractorPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [palette, setPalette] = useState<
    { hex: string; rgb: [number, number, number]; hsl: [number, number, number] }[]
  >([])
  const [dominantIdx, setDominantIdx] = useState(0)
  const [colorCount, setColorCount] = useState(6)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => setImageSrc(reader.result as string)
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

  // 提取颜色
  const extractColors = useCallback(async () => {
    if (!imageSrc) return
    setLoading(true)
    setError("")

    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageSrc
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("图片加载失败"))
      })
      imgRef.current = img
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight })

      const raw = await getPalette(img, { colorCount })
      if (!raw) throw new Error("无法提取颜色")
      const colors = raw.map((c) => ({
        hex: c.hex(),
        rgb: c.rgb() as unknown as [number, number, number],
        hsl: c.hsl() as unknown as [number, number, number],
      }))

      // 用 getColor 获取主色，在 palette 中找到对应索引
      const dominant = await getColor(img)
      const dominantHex = dominant?.hex()
      const domIdx = dominantHex ? colors.findIndex((c) => c.hex === dominantHex) : 0

      setPalette(colors)
      setDominantIdx(domIdx >= 0 ? domIdx : 0)
    } catch (e: any) {
      setError(e?.message ?? "提取颜色失败")
      setPalette([])
    } finally {
      setLoading(false)
    }
  }, [imageSrc, colorCount])

  // 图片变化时自动提取
  useEffect(() => {
    if (imageSrc) extractColors()
  }, [imageSrc, colorCount, extractColors])

  const copyAll = async () => {
    const text = palette.map((c) => c.hex.toUpperCase()).join("\n")
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">图片取色</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          上传图片提取主色调和配色方案，点击色块复制颜色值
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
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:border-ring ${
              imageSrc ? "border-border" : "border-border"
            }`}
          >
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="取色图片"
                className="max-h-64 max-w-full object-contain"
              />
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                <p className="text-3xl">🎨</p>
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
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImageSrc(null)
                    setPalette([])
                    setError("")
                  }}
                >
                  清除图片
                </Button>
                <span className="text-xs text-muted-foreground">
                  {imgSize.w} × {imgSize.h}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">色板数</label>
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={colorCount}
                  onChange={(e) => {
                    const v = Number(e.currentTarget.value)
                    if (v >= 2 && v <= 20) setColorCount(v)
                  }}
                  className="w-14 border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus-visible:border-ring"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 结果 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>提取结果</CardTitle>
            <CardDescription>
              {loading
                ? "提取中…"
                : palette.length > 0
                  ? `共 ${palette.length} 种颜色`
                  : "上传图片自动提取"}
            </CardDescription>
          </div>
          {palette.length > 0 && (
            <Button variant="ghost" size="sm" onClick={copyAll}>
              复制全部 HEX
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center justify-center rounded-lg border border-red-500/30 bg-red-50/50 py-12 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
              {error}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              提取中…
            </div>
          ) : palette.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {palette.map((c, i) => (
                <ColorSwatch
                  key={c.hex + i}
                  color={c}
                  largest={i === dominantIdx}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              请先上传一张图片
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
