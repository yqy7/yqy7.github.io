import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// ── 类型 ──────────────────────────────────────────────────────

interface ProgressState {
  pct: number
}

// ── 页面组件 ──────────────────────────────────────────────────

export default function BgRemovePage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [resultSrc, setResultSrc] = useState<string | null>(null)
  const [model, setModel] = useState<"small" | "medium">("medium")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState<ProgressState>({ pct: 0 })
  const [phase, setPhase] = useState<"idle" | "download" | "process">("idle")
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setResultSrc(null)
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

  // 去背景
  const handleRemove = useCallback(async () => {
    if (!imageSrc) return
    setLoading(true)
    setError("")
    setResultSrc(null)
    setPhase("process")  // 默认不显示进度条
    setProgress({ pct: 0 })

    try {
      const { removeBackground } = await import("@imgly/background-removal")

      const resp = await fetch(imageSrc)
      const blob = await resp.blob()

      const result = await removeBackground(blob, {
        model: model === "small" ? "isnet_quint8" : "isnet_fp16",
        progress: (_key: string, current: number, total: number) => {
          // 这段逻辑可能会有点问题，偶尔进度条会倒退，但不太影响使用。
          
          // total > 0 说明确实在下载数据，才切换到下载进度条
          // 大于 50 是为了避免下载小文件时，进度条闪烁
          if (total > 50) {
            console.log("download progress", current, total)
            
            clearTimeout(debounceRef.current)
            setPhase("download")
            setProgress({ pct: Math.round((current / total) * 100) })
            // 3000ms 内无回调，视为下载完成
            debounceRef.current = setTimeout(() => {
              setPhase("process")
            }, 3000)
          }
        },
      })

      clearTimeout(debounceRef.current)
      const url = URL.createObjectURL(result)
      setResultSrc(url)
      setPhase("idle")
    } catch (e: any) {
      clearTimeout(debounceRef.current)
      setError(e?.message ?? "处理失败，请重试")
      setPhase("idle")
    } finally {
      setLoading(false)
    }
  }, [imageSrc, model])

  const download = () => {
    if (!resultSrc) return
    const a = document.createElement("a")
    a.href = resultSrc
    a.download = "removed-bg.png"
    a.click()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">图片去背景</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          上传图片自动去除背景，AI 本地处理不上传服务器
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
                alt="原始图片"
                className="max-h-64 max-w-full object-contain"
              />
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
            <CardTitle>处理设置</CardTitle>
            <CardDescription>首次使用需下载模型文件（small ~40MB / medium ~80MB）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">模型</label>
                <div className="flex gap-1">
                  {(
                    [
                      ["small", "快速"],
                      ["medium", "高质量"],
                    ] as const
                  ).map(([k, label]) => (
                    <Button
                      key={k}
                      variant={model === k ? "default" : "outline"}
                      size="sm"
                      onClick={() => setModel(k)}
                      disabled={loading}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <Button onClick={handleRemove} disabled={loading} className="w-full">
              {loading ? "处理中…" : "开始去除背景"}
            </Button>
            {loading && (
              <div className="space-y-2">
                {phase === "download" ? (
                  <>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>下载模型文件</span>
                      <span>{progress.pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${progress.pct}%` }}
                      />
                    </div>
                  </>
                ) : phase === "process" ? (
                  <p className="text-center text-sm text-muted-foreground">
                    AI 处理中…
                  </p>
                ) : null}
              </div>
            )}
            {!loading && imageSrc && (
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImageSrc(null)
                    setResultSrc(null)
                    setError("")
                  }}
                >
                  清除图片
                </Button>
              </div>
            )}
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
      {resultSrc && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>处理结果</CardTitle>
              <CardDescription>背景已去除，仅保留前景主体</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={download}>
              下载 PNG
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">原图</p>
                <div className="flex items-center justify-center rounded-lg border border-border bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3QgaGVpZ2h0PSIxMCIgd2lkdGg9IjEwIiBmaWxsPSJyZ2JhKDEyOCwgMTI4LCAxMjgsIDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] p-4">
                  <img
                    src={imageSrc!}
                    alt="原图"
                    className="max-h-80 max-w-full object-contain"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">去背景</p>
                <div className="flex items-center justify-center rounded-lg border border-border bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3QgaGVpZ2h0PSIxMCIgd2lkdGg9IjEwIiBmaWxsPSJyZ2JhKDEyOCwgMTI4LCAxMjgsIDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] p-4">
                  <img
                    src={resultSrc}
                    alt="去背景结果"
                    className="max-h-80 max-w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
