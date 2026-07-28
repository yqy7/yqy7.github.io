import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// ── 语言选项 ──────────────────────────────────────────────────

const LANGUAGES = [
  { value: "chi_sim", label: "简体中文" },
  { value: "eng", label: "英文" },
  { value: "chi_sim+eng", label: "中英混合" },
  { value: "chi_tra", label: "繁体中文" },
  { value: "jpn", label: "日文" },
  { value: "kor", label: "韩文" },
]

// ── 类型 ──────────────────────────────────────────────────────

interface ProgressInfo {
  status: string
  progress: number
}

const STATUS_LABELS: Record<string, string> = {
  "loading tesseract core": "加载识别核心…",
  "initializing tesseract": "初始化引擎…",
  "loading language traineddata": "下载语言包…",
  "loaded language traineddata": "语言包加载完毕",
  "initializing api": "初始化 API…",
  "recognizing text": "正在识别…",
}

function formatProgress(info: ProgressInfo): string {
  const label = STATUS_LABELS[info.status] ?? info.status
  const pct = info.progress > 0 ? ` ${Math.round(info.progress * 100)}%` : ""
  return `${label}${pct}`
}

// ── 页面组件 ──────────────────────────────────────────────────

export default function OCRPage() {
  const [image, setImage] = useState<string | null>(null)
  const [lang, setLang] = useState("chi_sim")
  const [text, setText] = useState("")
  const [confidence, setConfidence] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [progressMsg, setProgressMsg] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const workerRef = useRef<any>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 清理 worker
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [])

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result as string)
    reader.readAsDataURL(file)
    setText("")
    setConfidence(null)
    setError("")
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

  // 识别
  const handleRecognize = useCallback(async () => {
    if (!image) return
    setLoading(true)
    setProgressMsg("加载识别引擎…")
    setError("")
    setText("")

    try {
      // 动态加载 tesseract.js
      const { createWorker } = await import("tesseract.js")

      // 如果语言变化或首次创建，重新初始化 worker
      if (workerRef.current) {
        await workerRef.current.terminate()
      }

      const worker = await createWorker(lang, 1, {
        logger: (info: ProgressInfo) => {
          setProgressMsg(formatProgress(info))
        },
      })

      workerRef.current = worker

      const img = new Image()
      img.src = image
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("图片加载失败"))
      })

      const { data } = await worker.recognize(img)
      setText(data.text)
      setConfidence(data.confidence)
    } catch (e: any) {
      setError(e?.message ?? "识别失败，请重试")
    } finally {
      setLoading(false)
    }
  }, [image, lang])

  const copyText = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">图片文字识别</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          上传图片或粘贴截图，识别其中的文字内容
        </p>
      </div>

      {/* 图片上传 */}
      <Card>
        <CardHeader>
          <CardTitle>上传图片</CardTitle>
          <CardDescription>支持拖拽、点击选择或直接粘贴截图</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:border-ring ${
              image ? "border-border" : "border-border"
            }`}
          >
            {image ? (
              <img
                src={image}
                alt="待识别"
                className="max-h-64 max-w-full object-contain"
              />
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
              if (file) loadImage(file)
            }}
          />
          {image && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                setImage(null)
                setText("")
                setConfidence(null)
                setError("")
              }}
            >
              清除图片
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 识别设置 */}
      <Card>
        <CardHeader>
          <CardTitle>识别设置</CardTitle>
          <CardDescription>选择图片中的语言</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-muted-foreground">语言</label>
            <select
              value={lang}
              onChange={(e) => {
                setLang(e.currentTarget.value)
                setText("")
                setConfidence(null)
                setError("")
              }}
              className="border border-border bg-transparent px-2 py-1.5 text-sm outline-none focus-visible:border-ring"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleRecognize}
            disabled={!image || loading}
            className="w-full"
          >
            {loading ? "识别中…" : "开始识别"}
          </Button>
          {loading && (
            <p className="text-center text-sm text-muted-foreground">
              {progressMsg}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 识别结果 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>识别结果</CardTitle>
            <CardDescription>
              {confidence != null
                ? `置信度 ${Math.round(confidence)}%`
                : "点击识别按钮获取结果"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={copyText} disabled={!text}>
            {copied ? "已复制" : "复制文字"}
          </Button>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center justify-center rounded-lg border border-red-500/30 bg-red-50/50 py-12 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
              {error}
            </div>
          ) : (
            <textarea
              value={text}
              readOnly
              placeholder="识别结果将显示在这里…"
              rows={8}
              className="w-full resize-none border border-border bg-muted/50 px-3 py-2 text-sm outline-none"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
