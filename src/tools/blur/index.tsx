import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// ── 类型 ──────────────────────────────────────────────────────

type BlurType = "mosaic" | "blur" | "solid"

interface RegionStyle {
  type: BlurType
  mosaicSize: number
  blurRadius: number
  color: string
}

interface Region extends RegionStyle {
  id: number
  x: number // 归一化 0-1
  y: number
  w: number
  h: number
}

const DEFAULT_STYLE: RegionStyle = {
  type: "mosaic",
  mosaicSize: 12,
  blurRadius: 12,
  color: "#000000",
}

// ── 效果应用 ──────────────────────────────────────────────────

function applyRegion(ctx: CanvasRenderingContext2D, r: Region, iw: number, ih: number) {
  const x = r.x * iw
  const y = r.y * ih
  const w = r.w * iw
  const h = r.h * ih

  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()

  if (r.type === "solid") {
    ctx.fillStyle = r.color
    ctx.fillRect(x, y, w, h)
  } else if (r.type === "mosaic") {
    const bs = Math.max(1, Math.round(r.mosaicSize))
    const tmp = document.createElement("canvas")
    tmp.width = Math.max(1, Math.round(w / bs))
    tmp.height = Math.max(1, Math.round(h / bs))
    const tctx = tmp.getContext("2d")!
    tctx.imageSmoothingEnabled = true
    tctx.drawImage(ctx.canvas, x, y, w, h, 0, 0, tmp.width, tmp.height)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, x, y, w, h)
    ctx.imageSmoothingEnabled = true
  } else {
    ctx.filter = `blur(${r.blurRadius}px)`
    ctx.drawImage(ctx.canvas, x, y, w, h, x, y, w, h)
    ctx.filter = "none"
  }

  ctx.restore()
}

// ── 页面组件 ──────────────────────────────────────────────────

export default function BlurPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null)
  const [regions, setRegions] = useState<Region[]>([])
  const [draft, setDraft] = useState<Region | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [style, setStyle] = useState<RegionStyle>(DEFAULT_STYLE)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nextIdRef = useRef(1)
  const drawStartRef = useRef({ x: 0, y: 0 })
  const drawingRef = useRef(false)

  // 图片加载
  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        setLoadedImg(img)
        setImageSrc(reader.result as string)
        setRegions([])
        setDraft(null)
        setSelectedId(null)
        setError("")
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

  // 渲染打码结果
  useEffect(() => {
    const img = loadedImg
    const canvas = previewCanvasRef.current
    if (!img || !canvas) return
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, 0, 0)
    for (const r of regions) applyRegion(ctx, r, canvas.width, canvas.height)
  }, [loadedImg, regions])

  // 渲染选区框
  useEffect(() => {
    const img = loadedImg
    const canvas = overlayCanvasRef.current
    if (!img || !canvas) return
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const iw = canvas.width
    const ih = canvas.height

    for (const r of regions) {
      const sel = r.id === selectedId
      ctx.strokeStyle = sel ? "#22c55e" : "rgba(255,255,255,0.85)"
      ctx.lineWidth = sel ? 3 : 2
      ctx.setLineDash([6, 4])
      ctx.strokeRect(r.x * iw, r.y * ih, r.w * iw, r.h * ih)
      ctx.setLineDash([])
    }
    if (draft) {
      const x = draft.x * iw
      const y = draft.y * ih
      const w = draft.w * iw
      const h = draft.h * ih
      ctx.fillStyle = "rgba(255,255,255,0.15)"
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = "#22c55e"
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, w, h)
    }
  }, [loadedImg, regions, draft, selectedId])

  // 指针坐标 → 归一化
  const toNorm = (e: React.PointerEvent) => {
    const canvas = overlayCanvasRef.current
    if (!canvas) return { nx: 0, ny: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      nx: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      ny: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (!loadedImg) return
    const { nx, ny } = toNorm(e)
    // 点击已有区域 → 选中
    const hit = [...regions].reverse().find((r) => nx >= r.x && nx <= r.x + r.w && ny >= r.y && ny <= r.y + r.h)
    if (hit) {
      setSelectedId(hit.id)
      return
    }
    setSelectedId(null)
    drawingRef.current = true
    drawStartRef.current = { x: nx, y: ny }
    setDraft({ id: -1, ...style, x: nx, y: ny, w: 0, h: 0 })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return
    const { nx, ny } = toNorm(e)
    const sx = drawStartRef.current.x
    const sy = drawStartRef.current.y
    setDraft({
      id: -1,
      ...style,
      x: Math.min(sx, nx),
      y: Math.min(sy, ny),
      w: Math.abs(nx - sx),
      h: Math.abs(ny - sy),
    })
  }

  const onPointerUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    if (draft && draft.w > 0.005 && draft.h > 0.005) {
      const region: Region = { ...draft, id: nextIdRef.current++ }
      setRegions((prev) => [...prev, region])
      setSelectedId(region.id)
    }
    setDraft(null)
  }

  // 样式控件：应用到选中区域，否则作为新区域默认
  const updateStyle = (patch: Partial<RegionStyle>) => {
    const next = { ...style, ...patch }
    setStyle(next)
    if (selectedId != null) {
      setRegions((prev) => prev.map((r) => (r.id === selectedId ? { ...r, ...patch } : r)))
    }
  }

  const deleteSelected = () => {
    if (selectedId == null) return
    setRegions((prev) => prev.filter((r) => r.id !== selectedId))
    setSelectedId(null)
  }

  const clearAll = () => {
    setRegions([])
    setSelectedId(null)
  }

  const download = () => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    const a = document.createElement("a")
    a.href = canvas.toDataURL("image/png")
    a.download = "blurred.png"
    a.click()
  }

  const copyImage = async () => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    try {
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
        setError("当前浏览器不支持复制图片")
        return
      }
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
      if (!blob) return
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError("复制失败：当前浏览器不支持或已被拦截")
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">图片打码</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          在图片上框选区域，应用马赛克、模糊或纯色遮盖
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
                <p className="text-3xl">🙈</p>
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

      {imageSrc && (
        <>
          {/* 打码样式 */}
          <Card>
            <CardHeader>
              <CardTitle>打码样式</CardTitle>
              <CardDescription>
                {selectedId != null ? "已应用到选中区域，可直接框选新区域" : "设置后框选新区域生效"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    ["mosaic", "马赛克"],
                    ["blur", "模糊"],
                    ["solid", "纯色"],
                  ] as const
                ).map(([k, label]) => (
                  <Button
                    key={k}
                    variant={style.type === k ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateStyle({ type: k })}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {style.type === "mosaic" && (
                <div className="flex items-center gap-3">
                  <label className="shrink-0 text-sm text-muted-foreground">格子大小</label>
                  <input
                    type="range"
                    min={4}
                    max={60}
                    value={style.mosaicSize}
                    onChange={(e) => updateStyle({ mosaicSize: Number(e.currentTarget.value) })}
                    className="min-w-0 flex-1 accent-foreground"
                  />
                  <span className="w-10 text-right font-mono text-sm">{style.mosaicSize}px</span>
                </div>
              )}

              {style.type === "blur" && (
                <div className="flex items-center gap-3">
                  <label className="shrink-0 text-sm text-muted-foreground">模糊强度</label>
                  <input
                    type="range"
                    min={1}
                    max={40}
                    value={style.blurRadius}
                    onChange={(e) => updateStyle({ blurRadius: Number(e.currentTarget.value) })}
                    className="min-w-0 flex-1 accent-foreground"
                  />
                  <span className="w-10 text-right font-mono text-sm">{style.blurRadius}px</span>
                </div>
              )}

              {style.type === "solid" && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">颜色</label>
                  <input
                    type="color"
                    value={style.color}
                    onChange={(e) => updateStyle({ color: e.currentTarget.value })}
                    className="size-7 cursor-pointer border-0 bg-transparent"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={deleteSelected} disabled={selectedId == null}>
                  删除选中
                </Button>
                <Button variant="outline" size="sm" onClick={clearAll} disabled={regions.length === 0}>
                  清空全部
                </Button>
                <span className="ml-auto self-center text-xs text-muted-foreground">
                  已框选 {regions.length} 个区域
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 预览 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>框选并预览</CardTitle>
                <CardDescription>按住鼠标拖拽框选区域，松手应用打码</CardDescription>
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
              <div className="flex justify-center rounded-lg border border-border bg-muted/30 p-3">
                <div className="relative inline-block">
                  <canvas
                    ref={previewCanvasRef}
                    className="max-h-[520px] max-w-full select-none"
                  />
                  <canvas
                    ref={overlayCanvasRef}
                    className="absolute inset-0 h-full w-full cursor-crosshair select-none"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* 错误 */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-50/50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}
