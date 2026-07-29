import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import jsQR from "jsqr"

// ── 工具函数 ──────────────────────────────────────────────────

function decodeFromCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  return jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  })
}

function drawOverlay(
  canvas: HTMLCanvasElement,
  location: { topLeftCorner: { x: number; y: number }; topRightCorner: { x: number; y: number }; bottomRightCorner: { x: number; y: number }; bottomLeftCorner: { x: number; y: number } },
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner } = location
  ctx.beginPath()
  ctx.moveTo(topLeftCorner.x, topLeftCorner.y)
  ctx.lineTo(topRightCorner.x, topRightCorner.y)
  ctx.lineTo(bottomRightCorner.x, bottomRightCorner.y)
  ctx.lineTo(bottomLeftCorner.x, bottomLeftCorner.y)
  ctx.closePath()
  ctx.strokeStyle = "#22c55e"
  ctx.lineWidth = 3
  ctx.stroke()

  // 四个角画小圆
  ;[topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner].forEach((p) => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = "#22c55e"
    ctx.fill()
  })
}

// ── 页面组件 ──────────────────────────────────────────────────

export default function QRCodeScannerPage() {
  const [mode, setMode] = useState<"image" | "camera">("image")
  const [result, setResult] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [overlaySrc, setOverlaySrc] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageCanvasRef = useRef<HTMLCanvasElement>(null)
  const cameraVideoRef = useRef<HTMLVideoElement>(null)
  const cameraCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animRef = useRef<number>(0)

  // 清理摄像头
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  // ── 图片识别 ──────────────────────────────────────────────

  const processImage = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return
      stopCamera()
      setMode("image")
      setResult("")
      setError("")
      setOverlaySrc(null)

      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const canvas = imageCanvasRef.current
          if (!canvas) return
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext("2d")!
          ctx.drawImage(img, 0, 0)

          const code = decodeFromCanvas(canvas)
          if (code) {
            drawOverlay(canvas, code.location)
            setOverlaySrc(canvas.toDataURL())
            setResult(code.data)
          } else {
            setOverlaySrc(canvas.toDataURL())
            setError("未识别到二维码，请确认图片中包含清晰的二维码")
          }
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    },
    [stopCamera],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) processImage(file)
    },
    [processImage],
  )

  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) processImage(file)
          break
        }
      }
    }
    document.addEventListener("paste", handler)
    return () => document.removeEventListener("paste", handler)
  }, [processImage])

  // ── 摄像头扫描 ────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    setResult("")
    setError("")
    setOverlaySrc(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream

      const video = cameraVideoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()
      setCameraActive(true)

      // 持续扫描
      const scan = () => {
        const video = cameraVideoRef.current
        const canvas = cameraCanvasRef.current
        if (!video || !canvas || video.readyState < 2) {
          animRef.current = requestAnimationFrame(scan)
          return
        }
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(video, 0, 0)

        const code = decodeFromCanvas(canvas)
        if (code) {
          setResult(code.data)
          setSuccessMsg(true)
          setTimeout(() => setSuccessMsg(false), 2000)
          stopCamera()
          return
        }
        animRef.current = requestAnimationFrame(scan)
      }
      animRef.current = requestAnimationFrame(scan)
    } catch {
      setError("无法访问摄像头，请检查权限设置")
    }
  }, [stopCamera])

  const copyResult = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // 判断是否为 URL
  const isURL = /^https?:\/\//i.test(result)

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">二维码识别</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          上传图片或开启摄像头，识别并解码二维码内容
        </p>
      </div>

      {/* 模式切换 */}
      <div className="flex gap-1">
        {(
          [
            ["image", "图片识别"],
            ["camera", "摄像头扫描"],
          ] as const
        ).map(([k, label]) => (
          <Button
            key={k}
            variant={mode === k ? "default" : "outline"}
            size="sm"
            onClick={() => {
              stopCamera()
              setMode(k)
              setResult("")
              setError("")
              setOverlaySrc(null)
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* 图片识别 */}
      {mode === "image" && (
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
              {overlaySrc ? (
                <img src={overlaySrc} alt="识别结果" className="max-h-80 max-w-full object-contain" />
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  <p className="text-3xl">📷</p>
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
                if (file) processImage(file)
              }}
            />
            <canvas ref={imageCanvasRef} className="hidden" />
          </CardContent>
        </Card>
      )}

      {/* 摄像头扫描 */}
      {mode === "camera" && (
        <Card>
          <CardHeader>
            <CardTitle>摄像头扫描</CardTitle>
            <CardDescription>对准二维码自动识别</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative mx-auto max-w-sm overflow-hidden rounded-lg bg-black">
              <video
                ref={cameraVideoRef}
                className={cameraActive ? "w-full" : "hidden"}
                playsInline
                muted
              />
              {cameraActive && (
                <div className="absolute inset-0 border-2 border-green-500/50">
                  <div className="absolute inset-0 animate-pulse bg-green-500/5" />
                </div>
              )}
              {!cameraActive && (
                <div className="flex items-center justify-center py-16 text-sm text-gray-400">
                  摄像头未开启
                </div>
              )}
            </div>
            <canvas ref={cameraCanvasRef} className="hidden" />
            <Button
              onClick={cameraActive ? stopCamera : startCamera}
              className="w-full"
            >
              {cameraActive ? "停止扫描" : "开启摄像头"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 识别成功提示 */}
      {successMsg && (
        <div className="rounded-lg border border-green-500/30 bg-green-50/50 px-4 py-3 text-center text-sm font-medium text-green-700 dark:bg-green-950/20 dark:text-green-400">
          识别成功
        </div>
      )}

      {/* 错误 */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-50/50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 结果 */}
      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>识别结果</CardTitle>
              <CardDescription>二维码解码成功</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={copyResult}>
                {copied ? "已复制" : "复制内容"}
              </Button>
              {isURL && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(result, "_blank")}
                >
                  打开链接
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="break-all rounded-lg border border-border bg-muted/50 px-3 py-2.5 font-mono text-sm">
              {result}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
