import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import JsBarcode from "jsbarcode"

// ── 条形码格式 ────────────────────────────────────────────────

const BARCODE_FORMATS = [
  { value: "CODE128", label: "CODE128（自动）" },
  { value: "CODE128A", label: "CODE128A" },
  { value: "CODE128B", label: "CODE128B" },
  { value: "CODE128C", label: "CODE128C" },
  { value: "EAN13", label: "EAN-13" },
  { value: "EAN8", label: "EAN-8" },
  { value: "EAN5", label: "EAN-5" },
  { value: "EAN2", label: "EAN-2" },
  { value: "UPC", label: "UPC-A" },
  { value: "UPCE", label: "UPC-E" },
  { value: "CODE39", label: "CODE39" },
  { value: "CODE93", label: "CODE93" },
  { value: "ITF", label: "ITF" },
  { value: "ITF14", label: "ITF-14" },
  { value: "MSI", label: "MSI" },
  { value: "MSI10", label: "MSI10" },
  { value: "MSI11", label: "MSI11" },
  { value: "MSI1010", label: "MSI1010" },
  { value: "MSI1110", label: "MSI1110" },
  { value: "codabar", label: "Codabar" },
  { value: "pharmacode", label: "Pharmacode" },
]

// ── 格式字符约束 ──────────────────────────────────────────────

interface FormatConstraint {
  desc: string
  validate: (v: string) => string | null // 返回 null 表示合法，否则返回警告信息
}

function containsNonASCII(v: string): boolean {
  return /[^\x00-\x7f]/.test(v)
}

function countDigits(v: string): number {
  return v.replace(/\D/g, "").length
}

const FORMAT_CONSTRAINTS: Record<string, FormatConstraint> = {
  CODE128: {
    desc: "支持 ASCII 字符（英文、数字、符号），不支持中文",
    validate: (v) => (containsNonASCII(v) ? "输入包含非 ASCII 字符（如中文），条形码无法显示" : null),
  },
  CODE128A: {
    desc: "支持大写字母、数字、控制字符",
    validate: (v) => (containsNonASCII(v) ? "输入包含非 ASCII 字符（如中文），条形码无法显示" : null),
  },
  CODE128B: {
    desc: "支持大小写字母、数字、符号",
    validate: (v) => (containsNonASCII(v) ? "输入包含非 ASCII 字符（如中文），条形码无法显示" : null),
  },
  CODE128C: {
    desc: "仅支持偶数位数字",
    validate: (v) => (/[^\d]/.test(v) ? "仅支持纯数字" : v.length % 2 !== 0 ? "需要偶数位数字" : null),
  },
  EAN13: {
    desc: "12 或 13 位数字",
    validate: (v) => {
      const d = countDigits(v)
      return /[^\d]/.test(v) ? "仅支持纯数字" : d !== 12 && d !== 13 ? "需要 12 或 13 位数字" : null
    },
  },
  EAN8: {
    desc: "7 或 8 位数字",
    validate: (v) => {
      const d = countDigits(v)
      return /[^\d]/.test(v) ? "仅支持纯数字" : d !== 7 && d !== 8 ? "需要 7 或 8 位数字" : null
    },
  },
  EAN5: {
    desc: "5 位数字",
    validate: (v) => {
      const d = countDigits(v)
      return /[^\d]/.test(v) ? "仅支持纯数字" : d !== 5 ? "需要 5 位数字" : null
    },
  },
  EAN2: {
    desc: "2 位数字",
    validate: (v) => {
      const d = countDigits(v)
      return /[^\d]/.test(v) ? "仅支持纯数字" : d !== 2 ? "需要 2 位数字" : null
    },
  },
  UPC: {
    desc: "11 或 12 位数字",
    validate: (v) => {
      const d = countDigits(v)
      return /[^\d]/.test(v) ? "仅支持纯数字" : d !== 11 && d !== 12 ? "需要 11 或 12 位数字" : null
    },
  },
  UPCE: {
    desc: "6-8 位数字",
    validate: (v) => {
      const d = countDigits(v)
      return /[^\d]/.test(v) ? "仅支持纯数字" : d < 6 || d > 8 ? "需要 6 至 8 位数字" : null
    },
  },
  CODE39: {
    desc: "支持大写字母、数字和部分符号",
    validate: (v) => (/^[A-Z0-9 $%+\-./*]+$/.test(v) ? null : containsNonASCII(v) ? "输入包含非 ASCII 字符（如中文），条形码无法显示" : "仅支持大写字母 A-Z、数字 0-9 和部分符号"),
  },
  CODE93: {
    desc: "支持大写字母、数字和部分符号",
    validate: (v) => (/^[A-Z0-9 $%+\-./*]+$/.test(v) ? null : containsNonASCII(v) ? "输入包含非 ASCII 字符（如中文），条形码无法显示" : "仅支持大写字母 A-Z、数字 0-9 和部分符号"),
  },
  ITF: {
    desc: "仅支持数字",
    validate: (v) => (/[^\d]/.test(v) ? "仅支持纯数字" : null),
  },
  ITF14: {
    desc: "13 位数字",
    validate: (v) => {
      const d = countDigits(v)
      return /[^\d]/.test(v) ? "仅支持纯数字" : d !== 13 ? "需要 13 位数字" : null
    },
  },
  MSI: { desc: "仅支持数字", validate: (v) => (/[^\d]/.test(v) ? "仅支持纯数字" : null) },
  MSI10: { desc: "仅支持数字", validate: (v) => (/[^\d]/.test(v) ? "仅支持纯数字" : null) },
  MSI11: { desc: "仅支持数字", validate: (v) => (/[^\d]/.test(v) ? "仅支持纯数字" : null) },
  MSI1010: { desc: "仅支持数字", validate: (v) => (/[^\d]/.test(v) ? "仅支持纯数字" : null) },
  MSI1110: { desc: "仅支持数字", validate: (v) => (/[^\d]/.test(v) ? "仅支持纯数字" : null) },
  codabar: {
    desc: "仅支持数字和 A/B/C/D",
    validate: (v) => (/^[A-Da-d0-9$+\-:/. ]+$/.test(v) ? null : containsNonASCII(v) ? "输入包含非 ASCII 字符（如中文），条形码无法显示" : "仅支持数字 0-9 和字母 A/B/C/D"),
  },
  pharmacode: {
    desc: "仅支持数字（3-131070）",
    validate: (v) => {
      if (/[^\d]/.test(v)) return "仅支持纯数字"
      const n = parseInt(v, 10)
      return n < 3 || n > 131070 ? "数字范围 3 ~ 131070" : null
    },
  },
}

const FORMAT_EXAMPLES: Record<string, string> = {
  CODE128: "Hello123",
  CODE128A: "HELLO123",
  CODE128B: "Hello123",
  CODE128C: "12345678",
  EAN13: "5901234123457",
  EAN8: "96385074",
  EAN5: "12345",
  EAN2: "12",
  UPC: "123456789999",
  UPCE: "01234567",
  CODE39: "HELLO",
  CODE93: "HELLO",
  ITF: "1234567890",
  ITF14: "1234567890123",
  MSI: "1234567",
  MSI10: "1234567",
  MSI11: "1234567",
  MSI1010: "1234567",
  MSI1110: "1234567",
  codabar: "A123456B",
  pharmacode: "1234",
}

// ── 页面组件 ──────────────────────────────────────────────────

export default function BarcodePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [value, setValue] = useState("Hello123")
  const [format, setFormat] = useState("CODE128")
  const [width, setWidth] = useState(2)
  const [height, setHeight] = useState(100)
  const [fontSize, setFontSize] = useState(16)
  const [lineColor, setLineColor] = useState("#000000")
  const [background, setBackground] = useState("#ffffff")
  const [displayValue, setDisplayValue] = useState(true)
  const [textPosition, setTextPosition] = useState<"bottom" | "top">("bottom")
  const [error, setError] = useState("")

  const constraint = FORMAT_CONSTRAINTS[format]
  const inputWarning = value.trim() ? constraint?.validate(value.trim()) ?? null : null

  const renderBarcode = useCallback(() => {
    setError("")
    if (!canvasRef.current || !value.trim()) return

    try {
      JsBarcode(canvasRef.current, value.trim(), {
        format,
        width,
        height,
        fontSize,
        lineColor,
        background,
        displayValue,
        textPosition,
        textMargin: 2,
        valid: (valid: boolean) => {
          if (!valid) setError("输入内容不符合当前条形码格式要求")
        },
      })
    } catch {
      setError("输入内容不符合当前条形码格式要求")
    }
  }, [value, format, width, height, fontSize, lineColor, background, displayValue, textPosition])

  useEffect(() => {
    const timer = setTimeout(renderBarcode, 150)
    return () => clearTimeout(timer)
  }, [renderBarcode])

  const handleFormatChange = (newFormat: string) => {
    setFormat(newFormat)
    const example = FORMAT_EXAMPLES[newFormat]
    if (example) setValue(example)
  }

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement("a")
    a.href = canvas.toDataURL("image/png")
    a.download = `barcode-${value || "output"}.png`
    a.click()
  }

  const copyImage = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(async (blob) => {
      if (!blob) return
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ])
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">条形码生成器</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          在线生成条形码，支持 CODE128、EAN、UPC 等多种编码格式
        </p>
      </div>

      {/* 输入与格式 */}
      <Card>
        <CardHeader>
          <CardTitle>内容设置</CardTitle>
          <CardDescription>输入待编码的文字或数字，选择条形码格式</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-muted-foreground">格式</label>
            <select
              value={format}
              onChange={(e) => handleFormatChange(e.currentTarget.value)}
              className="border border-border bg-transparent px-2 py-1.5 text-sm outline-none focus-visible:border-ring"
            >
              {BARCODE_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={value}
            onChange={(e) => setValue(e.currentTarget.value)}
            placeholder="输入条形码内容…"
            rows={2}
            className="w-full resize-none border border-border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
          />
          <p className="text-xs text-muted-foreground">
            {constraint.desc}
          </p>
          {inputWarning && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              ⚠️ {inputWarning}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 选项 */}
      <Card>
        <CardHeader>
          <CardTitle>外观设置</CardTitle>
          <CardDescription>调整条形码的尺寸和颜色</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <label className="w-10 text-sm text-muted-foreground">宽</label>
              <input
                type="number"
                min={1}
                max={10}
                value={width}
                onChange={(e) => {
                  const v = Number(e.currentTarget.value)
                  if (v >= 1 && v <= 10) setWidth(v)
                }}
                className="w-16 border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus-visible:border-ring"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-10 text-sm text-muted-foreground">高</label>
              <input
                type="number"
                min={20}
                max={400}
                step={10}
                value={height}
                onChange={(e) => {
                  const v = Number(e.currentTarget.value)
                  if (v >= 20 && v <= 400) setHeight(v)
                }}
                className="w-16 border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus-visible:border-ring"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">文字</label>
              <input
                type="number"
                min={8}
                max={40}
                value={fontSize}
                onChange={(e) => {
                  const v = Number(e.currentTarget.value)
                  if (v >= 8 && v <= 40) setFontSize(v)
                }}
                className="w-16 border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus-visible:border-ring"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">线条</label>
              <input
                type="color"
                value={lineColor}
                onChange={(e) => setLineColor(e.currentTarget.value)}
                className="size-7 cursor-pointer border-0 bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">背景</label>
              <input
                type="color"
                value={background}
                onChange={(e) => setBackground(e.currentTarget.value)}
                className="size-7 cursor-pointer border-0 bg-transparent"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={displayValue}
                onChange={() => setDisplayValue((v) => !v)}
                className="accent-foreground size-4"
              />
              显示文字
            </label>
            <div className="flex gap-1">
              {(
                [
                  ["bottom", "文字在下"],
                  ["top", "文字在上"],
                ] as const
              ).map(([k, label]) => (
                <Button
                  key={k}
                  variant={textPosition === k ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTextPosition(k)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 条形码预览 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>生成结果</CardTitle>
            <CardDescription>{BARCODE_FORMATS.find((f) => f.value === format)?.label}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyImage}>
              复制图片
            </Button>
            <Button variant="outline" size="sm" onClick={download}>
              下载 PNG
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center justify-center rounded-lg border border-red-500/30 bg-red-50/50 py-12 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
              {error}
            </div>
          ) : (
            <div className="flex justify-center overflow-x-auto bg-white py-8">
              <canvas ref={canvasRef} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
