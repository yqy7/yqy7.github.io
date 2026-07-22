import { useState, useRef, useEffect, useCallback } from "react"
import QRCode from "easyqrcodejs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const SIZES = [
  { label: "小 (200)", value: 200 },
  { label: "中 (300)", value: 300 },
  { label: "大 (400)", value: 400 },
]

const CORRECT_LEVELS = [
  { label: "L (7%)", value: QRCode.CorrectLevel.L },
  { label: "M (15%)", value: QRCode.CorrectLevel.M },
  { label: "Q (25%)", value: QRCode.CorrectLevel.Q },
  { label: "H (30%)", value: QRCode.CorrectLevel.H },
]

export default function QRCodePage() {
  const [text, setText] = useState("")
  const [size, setSize] = useState(300)
  const [darkColor, setDarkColor] = useState("#000000")
  const [lightColor, setLightColor] = useState("#ffffff")
  const [correctLevel, setCorrectLevel] = useState(QRCode.CorrectLevel.H)
  const containerRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<QRCode | null>(null)

  const renderQR = useCallback(() => {
    if (!containerRef.current) return

    // 清除旧的
    if (qrRef.current) {
      qrRef.current.clear()
    }

    if (!text.trim()) return

    qrRef.current = new QRCode(containerRef.current, {
      text: text.trim(),
      width: size,
      height: size,
      colorDark: darkColor,
      colorLight: lightColor,
      correctLevel,
      drawer: "canvas",
      quietZone: 16,
    })
  }, [text, size, darkColor, lightColor, correctLevel])

  // 参数变化时重新渲染
  useEffect(() => {
    renderQR()
  }, [renderQR])

  const handleDownload = () => {
    if (qrRef.current) {
      qrRef.current.download("qrcode")
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">二维码生成器</h1>
        <p className="mt-1 text-sm text-muted-foreground">输入文本或链接，实时生成二维码</p>
      </div>

      {/* 输入区 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">内容</label>
        <textarea
          placeholder="输入文本、链接、手机号…"
          className="min-h-24 w-full border border-border bg-transparent px-3 py-3 text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
        />
      </div>

      {/* 设置区 */}
      <Card>
        <CardHeader>
          <CardTitle>设置</CardTitle>
          <CardDescription>调整二维码样式</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 尺寸 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">尺寸</label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <Button
                  key={s.value}
                  variant={size === s.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSize(s.value)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 容错等级 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">容错等级</label>
            <div className="flex flex-wrap gap-2">
              {CORRECT_LEVELS.map((l) => (
                <Button
                  key={l.value}
                  variant={correctLevel === l.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCorrectLevel(l.value)}
                >
                  {l.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 颜色 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">前景色</label>
              <input
                type="color"
                value={darkColor}
                onChange={(e) => setDarkColor(e.target.value)}
                className="h-10 w-full cursor-pointer border border-border bg-transparent p-1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">背景色</label>
              <input
                type="color"
                value={lightColor}
                onChange={(e) => setLightColor(e.target.value)}
                className="h-10 w-full cursor-pointer border border-border bg-transparent p-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 预览区 */}
      <Card>
        <CardHeader>
          <CardTitle>预览</CardTitle>
          <CardDescription>
            {text.trim() ? "扫描下方二维码查看结果" : "输入内容后自动生成"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div
            ref={containerRef}
            className="flex min-h-48 items-center justify-center rounded-sm border border-border bg-white p-4"
          />
          {text.trim() && (
            <Button variant="outline" size="sm" onClick={handleDownload}>
              下载 PNG
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
