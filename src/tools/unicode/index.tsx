import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Direction = "encode" | "decode"

interface FormatItem {
  key: string
  label: string
  example: string
  encode: (text: string) => string
  decode: (escaped: string) => string
}

function toHex4(cp: number): string {
  return cp.toString(16).toUpperCase().padStart(4, "0")
}

function toHex(cp: number): string {
  return cp.toString(16).toUpperCase()
}

function escapeUtf8(text: string): string {
  const bytes = new TextEncoder().encode(text)
  return Array.from(bytes, (b) => "%" + b.toString(16).toUpperCase().padStart(2, "0")).join("")
}

function unescapeUtf8(str: string): string {
  try {
    const hex = str.replace(/%([0-9A-Fa-f]{2})/g, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    )
    return new TextDecoder().decode(
      Uint8Array.from(hex, (c) => c.charCodeAt(0)),
    )
  } catch {
    return str
  }
}

function escapeHtmlHex(text: string): string {
  return Array.from(text, (ch) => {
    const cp = ch.codePointAt(0)!
    return `&#x${toHex(cp)};`
  }).join("")
}

function unescapeHtmlEntity(str: string): string {
  return str.replace(/&(#x?)([0-9A-Fa-f]+);/gi, (_, prefix, h) => {
    const radix = prefix === "#x" || prefix === "#X" ? 16 : 10
    return String.fromCodePoint(parseInt(h, radix))
  })
}

const FORMATS: FormatItem[] = [
  {
    key: "unicode-js",
    label: "\\uXXXX (JavaScript)",
    example: "\\u4F60\\u597D",
    encode: (text) =>
      Array.from(text, (ch) => {
        const cp = ch.codePointAt(0)!
        return cp <= 0xFFFF
          ? `\\u${toHex4(cp)}`
          : `\\u{${toHex(cp)}}`
      }).join(""),
    decode: (str) =>
      str.replace(
        /\\u\{([0-9A-Fa-f]+)\}|\\u([0-9A-Fa-f]{4})/g,
        (_, ext, basic) =>
          String.fromCodePoint(parseInt(ext || basic, 16)),
      ),
  },
  {
    key: "html-hex",
    label: "&#xXXXX; (HTML Hex)",
    example: "&#x4F60;&#x597D;",
    encode: (text) => escapeHtmlHex(text),
    decode: (str) => unescapeHtmlEntity(str),
  },
  {
    key: "html-dec",
    label: "&#DDDD; (HTML 十进制)",
    example: "&#20320;&#22909;",
    encode: (text) =>
      Array.from(text, (ch) => {
        const cp = ch.codePointAt(0)!
        return `&#${cp};`
      }).join(""),
    decode: (str) => unescapeHtmlEntity(str),
  },
  {
    key: "unicode-plus",
    label: "U+XXXX (Unicode 标准)",
    example: "U+4F60 U+597D",
    encode: (text) =>
      Array.from(text, (ch) => {
        const cp = ch.codePointAt(0)!
        return `U+${toHex(cp)}`
      }).join(" "),
    decode: (str) => {
      const parts: string[] = []
      let last = 0
      const re = /U\+([0-9A-Fa-f]+)/g
      let m: RegExpExecArray | null
      while ((m = re.exec(str)) !== null) {
        parts.push(str.slice(last, m.index).replace(/\s+/g, ""))
        parts.push(String.fromCodePoint(parseInt(m[1], 16)))
        last = m.index + m[0].length
      }
      parts.push(str.slice(last).replace(/\s+/g, ""))
      return parts.join("")
    },
  },
  {
    key: "utf8-percent",
    label: "%XX (URL 编码 / UTF-8)",
    example: "%E4%BD%A0%E5%A5%BD",
    encode: (text) => escapeUtf8(text),
    decode: (str) => unescapeUtf8(str),
  },
  {
    key: "raw-hex",
    label: "原始十六进制 (UTF-8)",
    example: "E4 BD A0 E5 A5 BD",
    encode: (text) => {
      const bytes = new TextEncoder().encode(text)
      return Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ")
    },
    decode: (str) => {
      try {
        const hex = str.replace(/\s/g, "")
        const bytes = new Uint8Array(hex.length / 2)
        for (let i = 0; i < hex.length; i += 2) {
          bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
        }
        return new TextDecoder().decode(bytes)
      } catch {
        return str
      }
    },
  },
]

export default function UnicodePage() {
  const [input, setInput] = useState("")
  const [direction, setDirection] = useState<Direction>("encode")
  const [decodeFormat, setDecodeFormat] = useState(FORMATS[0].key)
  const [results, setResults] = useState<Record<string, string>>({})
  const [decodeResult, setDecodeResult] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState("")

  const handleConvert = useCallback(() => {
    setError("")
    setDecodeResult("")
    if (!input.trim()) {
      setResults({})
      return
    }
    try {
      if (direction === "encode") {
        const output: Record<string, string> = {}
        for (const fmt of FORMATS) {
          output[fmt.key] = fmt.encode(input)
        }
        setResults(output)
      } else {
        const fmt = FORMATS.find((f) => f.key === decodeFormat)!
        setDecodeResult(fmt.decode(input))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "转换失败")
    }
  }, [input, direction, decodeFormat])

  const copy = useCallback(async (key: string, text: string) => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Unicode 编解码</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          文字与 Unicode 转义序列相互转换，支持多种常见格式
        </p>
      </div>

      {/* 方向切换 */}
      <div className="flex gap-2">
        <Button
          variant={direction === "encode" ? "default" : "outline"}
          onClick={() => setDirection("encode")}
        >
          编码（文字 → 转义）
        </Button>
        <Button
          variant={direction === "decode" ? "default" : "outline"}
          onClick={() => setDirection("decode")}
        >
          解码（转义 → 文字）
        </Button>
      </div>

      {/* 输入 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {direction === "encode" ? "输入文字" : "输入转义序列"}
        </label>
        <textarea
          placeholder={
            direction === "encode"
              ? "在此输入要编码的文字…"
              : "在此输入转义序列…"
          }
          className="min-h-28 w-full border border-border bg-transparent px-3 py-3 text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
          value={input}
          onChange={(e) => {
            setInput(e.currentTarget.value)
            setError("")
          }}
        />
      </div>

      {/* 解码格式选择 */}
      {direction === "decode" && (
        <Card>
          <CardHeader>
            <CardTitle>选择编码格式</CardTitle>
            <CardDescription>选择输入内容的转义格式</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((fmt) => (
                <Button
                  key={fmt.key}
                  variant={decodeFormat === fmt.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDecodeFormat(fmt.key)}
                >
                  {fmt.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 转换按钮 */}
      <Button onClick={handleConvert} className="w-full">
        {direction === "encode" ? "编码" : "解码"}
      </Button>

      {/* 错误 */}
      {error && (
        <div className="border border-destructive/50 bg-destructive/10 px-3 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 编码结果 */}
      {direction === "encode" && Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>转换结果</CardTitle>
            <CardDescription>
              共 {FORMATS.length} 种格式
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {FORMATS.map((fmt) => (
              <div
                key={fmt.key}
                className="flex items-center gap-3 rounded-sm border border-border px-3 py-2.5"
              >
                <div className="w-44 shrink-0">
                  <div className="text-sm font-medium">{fmt.label}</div>
                  <div className="text-xs text-muted-foreground">{fmt.example}</div>
                </div>
                <code className="min-w-0 flex-1 break-all text-base">
                  {results[fmt.key] || "—"}
                </code>
                <Button
                  variant="outline"
                  size="xs"
                  className="shrink-0"
                  onClick={() => copy(fmt.key, results[fmt.key])}
                >
                  {copied === fmt.key ? "已复制" : "复制"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 解码结果 */}
      {direction === "decode" && decodeResult && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">解码结果</label>
            <Button
              variant="outline"
              size="xs"
              onClick={() => copy("decode", decodeResult)}
            >
              {copied === "decode" ? "已复制" : "复制"}
            </Button>
          </div>
          <div className="border border-border bg-muted/50 px-3 py-3 text-base">
            {decodeResult}
          </div>
        </div>
      )}
    </div>
  )
}
