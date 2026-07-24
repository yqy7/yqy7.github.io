import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// ─── 类型 ──────────────────────────────────────────────

interface RGBA {
  r: number // 0-255
  g: number
  b: number
  a: number // 0-1
}

interface Format {
  name: string
  desc: string
  toStr: (c: RGBA) => string
}

// ─── 解析 ──────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function parseHex(hex: string): RGBA | null {
  const h = hex.replace(/^#/, "")
  if (!/^[0-9A-Fa-f]+$/.test(h)) return null
  let r: number, g: number, b: number, a = 1

  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16)
    g = parseInt(h[1] + h[1], 16)
    b = parseInt(h[2] + h[2], 16)
  } else if (h.length === 4) {
    r = parseInt(h[0] + h[0], 16)
    g = parseInt(h[1] + h[1], 16)
    b = parseInt(h[2] + h[2], 16)
    a = parseInt(h[3] + h[3], 16) / 255
  } else if (h.length === 6) {
    r = parseInt(h.substring(0, 2), 16)
    g = parseInt(h.substring(2, 4), 16)
    b = parseInt(h.substring(4, 6), 16)
  } else if (h.length === 8) {
    r = parseInt(h.substring(0, 2), 16)
    g = parseInt(h.substring(2, 4), 16)
    b = parseInt(h.substring(4, 6), 16)
    a = parseInt(h.substring(6, 8), 16) / 255
  } else {
    return null
  }

  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) return null
  return { r, g, b, a }
}

function parseNumList(str: string, count: number): number[] | null {
  const nums = str.split(/[\s,]+/).filter(Boolean).map(Number)
  if (nums.length < count) return null
  if (nums.some(isNaN)) return null
  return nums
}

function parseRgb(input: string): RGBA | null {
  const m = input.match(/rgba?\(\s*(.+)\s*\)/i)
  if (!m) return null
  const nums = parseNumList(m[1], 3)
  if (!nums) return null
  return {
    r: clamp(Math.round(nums[0]), 0, 255),
    g: clamp(Math.round(nums[1]), 0, 255),
    b: clamp(Math.round(nums[2]), 0, 255),
    a: nums.length >= 4 ? clamp(nums[3], 0, 1) : 1,
  }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360
  s = clamp(s, 0, 100) / 100
  l = clamp(l, 0, 100) / 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r1 = 0, g1 = 0, b1 = 0
  if (h < 60) { r1 = c; g1 = x }
  else if (h < 120) { r1 = x; g1 = c }
  else if (h < 180) { g1 = c; b1 = x }
  else if (h < 240) { g1 = x; b1 = c }
  else if (h < 300) { r1 = x; b1 = c }
  else { r1 = c; b1 = x }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  }
}

function parseHsl(input: string): RGBA | null {
  const m = input.match(/hsla?\(\s*(.+)\s*\)/i)
  if (!m) return null
  const nums = parseNumList(m[1], 3)
  if (!nums) return null

  // 处理百分比
  const parts = m[1].split(/[\s,]+/).filter(Boolean)
  const h = nums[0]
  const s = parts[1]?.includes("%") ? nums[1] : nums[1] * 100
  const l = parts[2]?.includes("%") ? nums[2] : nums[2] * 100
  const a = nums.length >= 4 ? nums[3] : 1

  const rgb = hslToRgb(h, s, l)
  return { ...rgb, a: clamp(a, 0, 1) }
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360
  s = clamp(s, 0, 100) / 100
  v = clamp(v, 0, 100) / 100

  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c

  let r1 = 0, g1 = 0, b1 = 0
  if (h < 60) { r1 = c; g1 = x }
  else if (h < 120) { r1 = x; g1 = c }
  else if (h < 180) { g1 = c; b1 = x }
  else if (h < 240) { g1 = x; b1 = c }
  else if (h < 300) { r1 = x; b1 = c }
  else { r1 = c; b1 = x }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  }
}

function parseHsv(input: string): RGBA | null {
  const m = input.match(/hsva?\(\s*(.+)\s*\)/i)
  if (!m) return null
  const nums = parseNumList(m[1], 3)
  if (!nums) return null

  const parts = m[1].split(/[\s,]+/).filter(Boolean)
  const h = nums[0]
  const s = parts[1]?.includes("%") ? nums[1] : nums[1] * 100
  const v = parts[2]?.includes("%") ? nums[2] : nums[2] * 100
  const a = nums.length >= 4 ? nums[3] : 1

  const rgb = hsvToRgb(h, s, v)
  return { ...rgb, a: clamp(a, 0, 1) }
}

function parseColor(input: string): RGBA | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // 尝试 HEX
  if (trimmed.startsWith("#") || /^[0-9A-Fa-f]{3,8}$/.test(trimmed)) {
    return parseHex(trimmed)
  }

  const lower = trimmed.toLowerCase()
  if (lower.startsWith("hsv")) return parseHsv(trimmed)
  if (lower.startsWith("hsl")) return parseHsl(trimmed)
  if (lower.startsWith("rgb")) return parseRgb(trimmed)

  return null
}

// ─── 格式化输出 ───────────────────────────────────────

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2

  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h: number
  switch (max) {
    case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break
    case gn: h = ((bn - rn) / d + 2) / 6; break
    default: h = ((rn - gn) / d + 4) / 6; break
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const v = max
  const d = max - min

  if (d === 0) return { h: 0, s: 0, v: Math.round(v * 100) }

  const s = d / max
  let h: number
  switch (max) {
    case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break
    case gn: h = ((bn - rn) / d + 2) / 6; break
    default: h = ((rn - gn) / d + 4) / 6; break
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  }
}

function toHex(c: RGBA, withAlpha: boolean): string {
  const to2 = (v: number) => v.toString(16).padStart(2, "0")
  const rgb = "#" + to2(c.r) + to2(c.g) + to2(c.b)
  if (withAlpha) return rgb + to2(Math.round(c.a * 255))
  return c.a < 1 ? rgb + to2(Math.round(c.a * 255)) : rgb
}

const FORMATS: Format[] = [
  {
    name: "HEX",
    desc: "十六进制 (HEX)",
    toStr: (c) => toHex(c, false).toUpperCase(),
  },
  {
    name: "HEXA",
    desc: "十六进制 + 透明度 (HEXA)",
    toStr: (c) => toHex(c, true).toUpperCase(),
  },
  {
    name: "RGB",
    desc: "RGB",
    toStr: (c) =>
      c.a < 1
        ? `rgba(${c.r}, ${c.g}, ${c.b}, ${+c.a.toFixed(3)})`
        : `rgb(${c.r}, ${c.g}, ${c.b})`,
  },
  {
    name: "HSL",
    desc: "HSL",
    toStr: (c) => {
      const { h, s, l } = rgbToHsl(c.r, c.g, c.b)
      return c.a < 1
        ? `hsla(${h}, ${s}%, ${l}%, ${+c.a.toFixed(3)})`
        : `hsl(${h}, ${s}%, ${l}%)`
    },
  },
  {
    name: "HSV",
    desc: "HSV",
    toStr: (c) => {
      const { h, s, v } = rgbToHsv(c.r, c.g, c.b)
      return c.a < 1
        ? `hsva(${h}, ${s}%, ${v}%, ${+c.a.toFixed(3)})`
        : `hsv(${h}, ${s}%, ${v}%)`
    },
  },
]

// ─── 组件 ──────────────────────────────────────────────

export default function ColorConvertPage() {
  const [input, setInput] = useState("")
  const [copiedName, setCopied] = useState<string | null>(null)

  const color = useMemo(() => parseColor(input), [input])

  const copy = useCallback(async (name: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(name)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">颜色转换</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          在 HEX / RGB / HSL / HSV 等颜色格式之间相互转换，支持透明度
        </p>
      </div>

      {/* 输入区 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">输入颜色值</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="如 #3b82f6 / rgb(59,130,246) / hsl(217,91%,60%) / hsv(217,76%,96%)…"
            className="flex-1 border border-border bg-transparent px-3 py-2 font-mono text-base outline-none focus-visible:border-ring"
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
          />
          <label
            className="size-9 shrink-0 cursor-pointer rounded border border-border transition-opacity hover:opacity-80"
            style={{
              backgroundColor: color
                ? `rgba(${color.r},${color.g},${color.b},${color.a})`
                : "#e5e5e5",
            }}
          >
            <input
              type="color"
              value={color ? toHex(color, false) : "#000000"}
              onChange={(e) => setInput(e.currentTarget.value)}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* 结果区 */}
      <Card>
        <CardHeader>
          <CardTitle>转换结果</CardTitle>
          <CardDescription>
            {color
              ? `R: ${color.r}  G: ${color.g}  B: ${color.b}  A: ${+color.a.toFixed(
                  3,
                )}`
              : "输入颜色值后将自动显示所有格式"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {FORMATS.map((fmt) => {
            const result = color ? fmt.toStr(color) : ""
            return (
              <div
                key={fmt.name}
                className="flex items-center gap-3 rounded-sm border border-border px-3 py-2.5"
              >
                <div className="w-44 shrink-0">
                  <div className="text-sm font-medium">{fmt.name}</div>
                  <div className="text-xs text-muted-foreground">{fmt.desc}</div>
                </div>
                <code className="min-w-0 flex-1 break-all font-mono text-base">
                  {result || "—"}
                </code>
                {result && (
                  <Button
                    variant="outline"
                    size="xs"
                    className="shrink-0"
                    onClick={() => copy(fmt.name, result)}
                  >
                    {copiedName === fmt.name ? "已复制" : "复制"}
                  </Button>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
