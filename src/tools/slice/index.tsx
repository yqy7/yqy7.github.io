import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const MAX_ROWS = 20
const MAX_COLS = 20

/** 裁剪图片为 rows × cols 块，返回每块的 canvas 与 dataURL */
function sliceImage(img: HTMLImageElement, rows: number, cols: number) {
  const sw = Math.floor(img.naturalWidth / cols)
  const sh = Math.floor(img.naturalHeight / rows)
  const canvases: HTMLCanvasElement[][] = []
  const urls: string[][] = []
  for (let r = 0; r < rows; r++) {
    const rowC: HTMLCanvasElement[] = []
    const rowU: string[] = []
    for (let c = 0; c < cols; c++) {
      const cv = document.createElement("canvas")
      cv.width = sw
      cv.height = sh
      cv.getContext("2d")!.drawImage(img, c * sw, r * sh, sw, sh, 0, 0, sw, sh)
      rowC.push(cv)
      rowU.push(cv.toDataURL("image/png"))
    }
    canvases.push(rowC)
    urls.push(rowU)
  }
  return { canvases, urls, sw, sh }
}

// ── 页面组件 ──────────────────────────────────────────────────

export default function SlicePage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null)
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [sliceUrls, setSliceUrls] = useState<string[][]>([])
  const [sliceSize, setSliceSize] = useState({ w: 0, h: 0 })
  const [zipping, setZipping] = useState(false)

  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const sliceCanvasRef = useRef<HTMLCanvasElement[][]>([])
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
        setSliceUrls([])
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

  // 切割 + 预览网格
  useEffect(() => {
    const img = loadedImg
    if (!img) return
    const r = Math.max(1, Math.min(MAX_ROWS, Math.round(rows) || 1))
    const c = Math.max(1, Math.min(MAX_COLS, Math.round(cols) || 1))
    if (Math.floor(img.naturalWidth / c) < 1 || Math.floor(img.naturalHeight / r) < 1) {
      setSliceUrls([])
      return
    }

    const { canvases, urls, sw, sh } = sliceImage(img, r, c)
    sliceCanvasRef.current = canvases
    setSliceUrls(urls)
    setSliceSize({ w: sw, h: sh })

    // 预览网格
    const preview = previewCanvasRef.current
    if (preview) {
      preview.width = img.naturalWidth
      preview.height = img.naturalHeight
      const ctx = preview.getContext("2d")!
      ctx.drawImage(img, 0, 0)
      ctx.strokeStyle = "rgba(34,197,94,0.9)"
      ctx.lineWidth = 2
      for (let i = 1; i < c; i++) {
        ctx.beginPath()
        ctx.moveTo(i * sw, 0)
        ctx.lineTo(i * sw, img.naturalHeight)
        ctx.stroke()
      }
      for (let j = 1; j < r; j++) {
        ctx.beginPath()
        ctx.moveTo(0, j * sh)
        ctx.lineTo(img.naturalWidth, j * sh)
        ctx.stroke()
      }
    }
  }, [loadedImg, rows, cols])

  // 下载单块
  const downloadOne = (ri: number, ci: number) => {
    const cv = sliceCanvasRef.current?.[ri]?.[ci]
    if (!cv) return
    const a = document.createElement("a")
    a.href = cv.toDataURL("image/png")
    a.download = `slice_r${ri + 1}_c${ci + 1}.png`
    a.click()
  }

  // 全部打包下载
  const downloadAll = async () => {
    const canvases = sliceCanvasRef.current
    if (!canvases.length) return
    setZipping(true)
    try {
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      for (let r = 0; r < canvases.length; r++) {
        for (let c = 0; c < canvases[r].length; c++) {
          const blob = await new Promise<Blob | null>((resolve) =>
            canvases[r][c].toBlob(resolve, "image/png"),
          )
          if (blob) zip.file(`r${r + 1}_c${c + 1}.png`, blob)
        }
      }
      const blob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `slices_${canvases.length}x${canvases[0].length}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setZipping(false)
    }
  }

  const total = sliceUrls.reduce((n, row) => n + row.length, 0)
  const remainderW = loadedImg ? loadedImg.naturalWidth % (Math.max(1, cols) || 1) : 0
  const remainderH = loadedImg ? loadedImg.naturalHeight % (Math.max(1, rows) || 1) : 0

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">图片切割</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          将图片按行数和列数切割为多块，可单块下载或打包下载
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
                <p className="text-3xl">🍰</p>
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
          {loadedImg && (
            <p className="mt-2 text-xs text-muted-foreground">
              原图：{loadedImg.naturalWidth} × {loadedImg.naturalHeight} 像素
            </p>
          )}
        </CardContent>
      </Card>

      {imageSrc && (
        <>
          {/* 切割设置 */}
          <Card>
            <CardHeader>
              <CardTitle>切割设置</CardTitle>
              <CardDescription>设置切割的行数和列数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">行数</label>
                  <input
                    type="number"
                    min={1}
                    max={MAX_ROWS}
                    value={rows}
                    onChange={(e) => setRows(Math.max(1, Math.min(MAX_ROWS, Number(e.currentTarget.value) || 1)))}
                    className="w-20 border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus-visible:border-ring"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">列数</label>
                  <input
                    type="number"
                    min={1}
                    max={MAX_COLS}
                    value={cols}
                    onChange={(e) => setCols(Math.max(1, Math.min(MAX_COLS, Number(e.currentTarget.value) || 1)))}
                    className="w-20 border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus-visible:border-ring"
                  />
                </div>
                <span className="text-xs text-muted-foreground">共切割为 {rows * cols} 块</span>
              </div>
              {total > 0 && (
                <p className="text-xs text-muted-foreground">
                  每块 {sliceSize.w} × {sliceSize.h} 像素
                  {(remainderW > 0 || remainderH > 0) &&
                    ` · 右边缘 ${remainderW}px、下边缘 ${remainderH}px 像素不足一整块，将被舍弃`}
                </p>
              )}
            </CardContent>
          </Card>

          {/* 切割预览 */}
          <Card>
            <CardHeader>
              <CardTitle>切割预览</CardTitle>
              <CardDescription>绿色网格线表示切割位置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center rounded-lg border border-border bg-muted/30 p-3">
                <canvas ref={previewCanvasRef} className="h-auto max-h-[420px] max-w-full" />
              </div>
            </CardContent>
          </Card>

          {/* 切割结果 */}
          {total > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>切割结果</CardTitle>
                  <CardDescription>
                    共 {total} 块 · 每块 {sliceSize.w} × {sliceSize.h} 像素 · 点击缩略图可下载单块
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={downloadAll} disabled={zipping}>
                  {zipping ? "打包中…" : "全部下载 ZIP"}
                </Button>
              </CardHeader>
              <CardContent>
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                >
                  {sliceUrls.map((row, ri) =>
                    row.map((url, ci) => (
                      <button
                        key={`${ri}-${ci}`}
                        onClick={() => downloadOne(ri, ci)}
                        title={`下载 第${ri + 1}行 第${ci + 1}列`}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/30"
                      >
                        <img src={url} alt={`第${ri + 1}行 第${ci + 1}列`} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                          <span className="text-xs">⬇ 下载</span>
                        </div>
                        <span className="pointer-events-none absolute left-1 top-1 rounded bg-black/50 px-1 text-[10px] text-white">
                          {ri + 1}-{ci + 1}
                        </span>
                      </button>
                    )),
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
