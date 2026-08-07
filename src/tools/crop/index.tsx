import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ReactCrop, {
  type Crop,
  type PixelCrop,
  type PercentCrop,
  cropToCanvas,
  makeAspectCrop,
  centerCrop,
} from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

// ── 宽高比选项 ────────────────────────────────────────────────

const ASPECTS = [
  { value: "free", label: "自由" },
  { value: "origin", label: "原图比例" },
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
]

const DEFAULT_CROP: Crop = { unit: "%", x: 10, y: 10, width: 80, height: 80 }

/** 根据比例 key 计算宽高比数值（自由模式返回 undefined） */
function computeAspect(key: string, img: HTMLImageElement): number | undefined {
  if (key === "free") return undefined
  if (key === "origin") return img.naturalWidth / img.naturalHeight || 1
  const [w, h] = key.split(":").map(Number)
  return w / h
}

// ── 页面组件 ──────────────────────────────────────────────────

export default function CropPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>(DEFAULT_CROP)
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [aspectKey, setAspectKey] = useState("free")
  const [croppedSrc, setCroppedSrc] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 图片加载
  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setCroppedSrc(null)
      setCompletedCrop(null)
      setCrop(DEFAULT_CROP)
      setError("")
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

  // 生成裁剪结果
  const generateCrop = useCallback(async (pc: PixelCrop) => {
    const img = imgRef.current
    if (!img) return
    try {
      const canvas = document.createElement("canvas")
      await cropToCanvas(img, canvas, pc)
      setCroppedSrc(canvas.toDataURL("image/png"))
    } catch {
      // 忽略尺寸异常
    }
  }, [])

  useEffect(() => {
    if (completedCrop) generateCrop(completedCrop)
  }, [completedCrop, generateCrop])

  const handleCropComplete = useCallback(
    (pc: PixelCrop, _pc: PercentCrop) => {
      setCompletedCrop(pc)
    },
    [],
  )

  /** 按比例 key 重算并应用裁剪框，同时刷新预览 */
  const applyAspect = useCallback(
    (key: string) => {
      setAspectKey(key)
      setCompletedCrop(null)

      const img = imgRef.current
      if (!img || !imageSrc) return
      const cw = img.clientWidth
      const ch = img.clientHeight
      if (!cw || !ch) return

      const aspect = computeAspect(key, img)

      let next: Crop
      if (aspect) {
        // 按目标比例生成居中的裁剪框（占 80% 宽）
        next = centerCrop(
          makeAspectCrop({ unit: "%", width: 80 }, aspect, cw, ch),
          cw,
          ch,
        )
      } else {
        next = { ...DEFAULT_CROP }
      }
      setCrop(next)

      // 手动生成预览（程序化改 crop 不会触发 onComplete）
      const px: PixelCrop = {
        unit: "px",
        x: (next.x / 100) * cw,
        y: (next.y / 100) * ch,
        width: (next.width / 100) * cw,
        height: (next.height / 100) * ch,
      }
      generateCrop(px)
    },
    [imageSrc, generateCrop],
  )

  // 图片加载后生成初始预览
  useEffect(() => {
    if (!imageSrc) return
    const raf = requestAnimationFrame(() => {
      applyAspect(aspectKey)
    })
    return () => cancelAnimationFrame(raf)
  }, [imageSrc]) // eslint-disable-line react-hooks/exhaustive-deps

  const download = () => {
    if (!croppedSrc) return
    const a = document.createElement("a")
    a.href = croppedSrc
    a.download = "cropped.png"
    a.click()
  }

  const copyImage = async () => {
    if (!croppedSrc) return
    try {
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
        setError("当前浏览器不支持复制图片")
        return
      }
      const img = new Image()
      img.src = croppedSrc
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("图片加载失败"))
      })
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext("2d")!.drawImage(img, 0, 0)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
      if (!blob) throw new Error("无法生成图片")
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError("复制失败：当前浏览器不支持或已被拦截")
    }
  }

  const aspect = computeAspect(aspectKey, imgRef.current ?? ({} as HTMLImageElement))

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">图片裁剪</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          拖拽调整裁剪区域，支持自由裁剪和多种宽高比
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
                <p className="text-3xl">✂️</p>
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

      {/* 裁剪区域 */}
      {imageSrc && (
        <Card>
          <CardHeader>
            <CardTitle>调整裁剪区域</CardTitle>
            <CardDescription>拖动四角或边缘自由调整选框大小，松手自动生成结果</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 宽高比 */}
            <div className="flex flex-wrap gap-1">
              {ASPECTS.map((a) => (
                <Button
                  key={a.value}
                  variant={aspectKey === a.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyAspect(a.value)}
                >
                  {a.label}
                </Button>
              ))}
            </div>

            {/* Cropper */}
            <div className="flex justify-center overflow-hidden rounded-lg bg-black">
              <ReactCrop
                crop={crop}
                aspect={aspect}
                onChange={(c) => setCrop(c)}
                onComplete={handleCropComplete}
                keepSelection
                minWidth={20}
                minHeight={20}
              >
                <img ref={imgRef} src={imageSrc} alt="待裁剪图片" style={{ maxWidth: "100%" }} />
              </ReactCrop>
            </div>
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
      {croppedSrc && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>裁剪结果</CardTitle>
              <CardDescription>调整裁剪框后自动更新</CardDescription>
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
              <img src={croppedSrc} alt="裁剪结果" className="max-h-[400px] max-w-full object-contain" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
