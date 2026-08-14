import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { imageToAscii, renderFrame, frameToString } from "asciify-react"
import type { AsciiFrame } from "asciify-react"

/** 将文本渲染为白底黑字位图（支持多行） */
function renderTextToCanvas(text: string): HTMLCanvasElement {
  const lines = text.split("\n")
  const font = 'bold 48px "SF Mono", Menlo, Consolas, monospace'
  const measure = document.createElement("canvas").getContext("2d")!
  measure.font = font
  const lineWidths = lines.map((l) => measure.measureText(l).width)
  const maxW = Math.max(...lineWidths, 1)
  const lineHeight = 48 * 1.2
  const padding = 30
  const canvas = document.createElement("canvas")
  canvas.width = Math.ceil(maxW + padding * 2)
  canvas.height = Math.ceil(lineHeight * lines.length + padding * 2)
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "#000000"
  ctx.font = font
  ctx.textBaseline = "middle"
  lines.forEach((line, i) => {
    ctx.fillText(line, padding, padding + i * lineHeight + lineHeight / 2)
  })
  return canvas
}

// ── 页面组件 ──────────────────────────────────────────────────

export default function AsciiArtPage() {
  const [mode, setMode] = useState<"image" | "text">("image")
  const [uploadedSrc, setUploadedSrc] = useState<string | null>(null)
  const [uploadedImg, setUploadedImg] = useState<HTMLImageElement | null>(null)
  const [textInput, setTextInput] = useState("YQY7")
  const [textImg, setTextImg] = useState<HTMLImageElement | null>(null)
  const [numCols, setNumCols] = useState(100)
  const [charset, setCharset] = useState<"english" | "binary">("english")
  const [color, setColor] = useState(true)
  const [background, setBackground] = useState("#000000")
  const [fontSize, setFontSize] = useState(10)
  const [noiseScale, setNoiseScale] = useState(0)
  const [info, setInfo] = useState({ cols: 0, rows: 0 })
  const [text, setText] = useState("")
  const [ready, setReady] = useState(false)
  const [copiedText, setCopiedText] = useState(false)
  const [copiedImg, setCopiedImg] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const frameRef = useRef<AsciiFrame | null>(null)

  // 当前生效的输入图：图片模式用上传图，文本模式用文本位图
  const activeImg = mode === "text" ? textImg : uploadedImg

  // 图片加载
  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        setUploadedImg(img)
        setUploadedSrc(reader.result as string)
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

  // 粘贴（仅图片模式）
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

  // 文本 → 位图
  useEffect(() => {
    if (mode !== "text") return
    if (!textInput.trim()) {
      setTextImg(null)
      setReady(false)
      setText("")
      return
    }
    const canvas = renderTextToCanvas(textInput)
    const img = new Image()
    img.onload = () => setTextImg(img)
    img.src = canvas.toDataURL("image/png")
  }, [mode, textInput])

  // 转换并渲染
  useEffect(() => {
    const img = activeImg
    const canvas = canvasRef.current
    if (!img || !canvas) return
    // 文本模式：白底黑字位图，锁定彩色与白底，保证文字以密字符浮现
    const effColor = mode === "text" ? true : color
    const effBackground = mode === "text" ? "#ffffff" : background

    const compute = (time: number) => {
      const frame = imageToAscii(img, {
        numCols,
        charset,
        color: effColor,
        cellHeightScale: 2,
        noiseScale,
        time,
      })
      frameRef.current = frame
      renderFrame(canvas, frame, {
        background: effBackground,
        fontSize,
        fontFamily: "monospace",
      })
      return frame
    }

    // 首帧：置位 info / 文本 / ready
    const first = compute(0)
    setInfo({ cols: first.numCols, rows: first.numRows })
    setText(frameToString(first))
    setReady(true)

    if (noiseScale > 0) {
      // 噪波动画：rAF 循环递增时间
      let raf = 0
      let t = 0
      let last = performance.now()
      const loop = (now: number) => {
        const dt = Math.min(0.1, (now - last) / 1000)
        last = now
        t += dt * 0.8
        compute(t)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
      return () => cancelAnimationFrame(raf)
    }
  }, [activeImg, mode, numCols, charset, color, noiseScale, background, fontSize])

  const copyText = async () => {
    const frame = frameRef.current
    if (!frame) return
    try {
      await navigator.clipboard.writeText(frameToString(frame))
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 1500)
    } catch {
      // 忽略
    }
  }

  const copyImage = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") return
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
      if (!blob) return
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
      setCopiedImg(true)
      setTimeout(() => setCopiedImg(false), 1500)
    } catch {
      // 忽略
    }
  }

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement("a")
    a.href = canvas.toDataURL("image/png")
    a.download = "ascii-art.png"
    a.click()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">ASCII 画</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          将图片或文本转换为 ASCII 字符画，支持彩色着色、二进制字符集和噪波动画
        </p>
      </div>

      {/* 输入 */}
      <Card>
        <CardHeader>
          <CardTitle>输入内容</CardTitle>
          <CardDescription>支持图片（拖拽 / 点击 / 粘贴）或直接输入文本</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-1">
            <Button
              variant={mode === "image" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("image")}
            >
              🖼 图片
            </Button>
            <Button
              variant={mode === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("text")}
            >
              📝 文本
            </Button>
          </div>

          {mode === "image" ? (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-ring"
              >
                {uploadedSrc ? (
                  <img src={uploadedSrc} alt="原始图片" className="max-h-40 max-w-full object-contain" />
                ) : (
                  <div className="text-center text-sm text-muted-foreground">
                    <p className="text-3xl">👾</p>
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
            </>
          ) : (
            <div>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.currentTarget.value)}
                placeholder="输入要转换成 ASCII 画的文本…"
                rows={4}
                className="w-full resize-y border border-border bg-transparent text-sm outline-none focus-visible:border-ring"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                文本会渲染为白底黑字位图再转换，支持多行、可实时预览
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {(activeImg || (mode === "image" && uploadedSrc)) && (
        <>
          {/* 转换设置 */}
          <Card>
            <CardHeader>
              <CardTitle>转换设置</CardTitle>
              <CardDescription>调节字符精度与显示效果</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="w-20 shrink-0 text-sm text-muted-foreground">字符列数</label>
                <input
                  type="range"
                  min={20}
                  max={200}
                  value={numCols}
                  onChange={(e) => setNumCols(Number(e.currentTarget.value))}
                  className="min-w-0 flex-1 accent-foreground"
                />
                <span className="w-10 text-right font-mono text-sm">{numCols}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm text-muted-foreground">字符集</span>
                <div className="flex gap-1">
                  <Button
                    variant={charset === "english" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCharset("english")}
                  >
                    字符密度
                  </Button>
                  <Button
                    variant={charset === "binary" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCharset("binary")}
                  >
                    二进制 0/1
                  </Button>
                </div>
              </div>

              {mode === "text" ? (
                <p className="text-xs text-muted-foreground">
                  文本模式固定为彩色着色 + 白底黑字，保证文字以密集字符清晰浮现
                </p>
              ) : (
                <>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={color}
                      onChange={() => setColor((v) => !v)}
                      className="accent-foreground size-4"
                    />
                    彩色着色（每个字符使用原图区域的平均颜色）
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="w-20 shrink-0 text-sm text-muted-foreground">背景色</label>
                    <input
                      type="color"
                      value={background}
                      onChange={(e) => setBackground(e.currentTarget.value)}
                      className="size-7 cursor-pointer border-0 bg-transparent"
                    />
                    <span className="font-mono text-xs text-muted-foreground">{background}</span>
                  </div>
                </>
              )}

              <div className="flex items-center gap-3">
                <label className="w-20 shrink-0 text-sm text-muted-foreground">字号</label>
                <input
                  type="range"
                  min={4}
                  max={24}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.currentTarget.value))}
                  className="min-w-0 flex-1 accent-foreground"
                />
                <span className="w-10 text-right font-mono text-sm">{fontSize}px</span>
              </div>

              <div className="flex items-center gap-3">
                <label className="w-20 shrink-0 text-sm text-muted-foreground">噪波动画</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={noiseScale}
                  onChange={(e) => setNoiseScale(Number(e.currentTarget.value))}
                  className="min-w-0 flex-1 accent-foreground"
                />
                <span className="w-10 text-right font-mono text-sm">
                  {noiseScale === 0 ? "关闭" : noiseScale.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 预览 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>转换预览</CardTitle>
                <CardDescription>
                  {info.cols > 0 ? `${info.cols} × ${info.rows} 字符` : "生成中…"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyText} disabled={!ready}>
                  {copiedText ? "已复制" : "复制文本"}
                </Button>
                <Button variant="outline" size="sm" onClick={copyImage} disabled={!ready}>
                  {copiedImg ? "已复制" : "复制图片"}
                </Button>
                <Button variant="outline" size="sm" onClick={download} disabled={!ready}>
                  下载 PNG
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center rounded-lg border border-border bg-muted/30 p-3">
                <canvas ref={canvasRef} className="h-auto max-h-[480px] max-w-full" />
              </div>
              {text && (
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">纯文本输出（可手动选择复制）</p>
                  <textarea
                    readOnly
                    value={text}
                    rows={8}
                    className="w-full resize-y bg-muted/50 font-mono text-xs leading-tight text-foreground"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
