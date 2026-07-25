import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// 映射：0→零宽空格(U+200B)，1→零宽不连字符(U+200C)
const ZW_0 = "​"
const ZW_1 = "‌"
const ZW_MARK = "‍"

// 文字 → 二进制字符串
function toBinary(text: string): string {
  const bytes = new TextEncoder().encode(text)
  return Array.from(bytes, (b) => b.toString(2).padStart(8, "0")).join("")
}

// 二进制字符串 → 文字
function fromBinary(bin: string): string {
  const bytes = new Uint8Array(bin.length / 8)
  for (let i = 0; i < bin.length; i += 8) {
    bytes[i / 8] = parseInt(bin.substring(i, i + 8), 2)
  }
  return new TextDecoder().decode(bytes)
}

// 编码：秘密文本 → 零宽字符序列
function encodeZW(secret: string): string {
  const bin = toBinary(secret)
  let result = ZW_MARK
  for (const bit of bin) {
    result += bit === "0" ? ZW_0 : ZW_1
  }
  result += ZW_MARK
  return result
}

// 提取载体中的所有零宽字符并解码
function extractZW(carrier: string): string {
  let bin = ""
  let inBlock = false
  for (const ch of carrier) {
    if (ch === ZW_MARK) {
      if (inBlock) break
      inBlock = true
      continue
    }
    if (inBlock) {
      if (ch === ZW_0) bin += "0"
      else if (ch === ZW_1) bin += "1"
      else continue
    }
  }
  if (bin.length < 8) return ""
  bin = bin.slice(0, Math.floor(bin.length / 8) * 8)
  try {
    return fromBinary(bin)
  } catch {
    return ""
  }
}

// 将零宽字符嵌入载体文本第一个字符之后
function embed(carrier: string, zw: string): string {
  if (!carrier) return zw
  return carrier.slice(0, 1) + zw + carrier.slice(1)
}

function charInfo(text: string): string {
  const visible = text.replace(/[​-‍]/g, "").length
  return `可见字符 ${visible}，总长度 ${text.length}`
}

export default function ZeroWidthPage() {
  // 隐藏状态
  const [carrier, setCarrier] = useState("这是一段看起来普通的文本")
  const [secret, setSecret] = useState("")
  const [hideResult, setHideResult] = useState("")
  const [copiedHide, setCopiedHide] = useState(false)

  // 提取状态
  const [toExtract, setToExtract] = useState("")
  const [revealed, setRevealed] = useState("")
  const [copiedReveal, setCopiedReveal] = useState(false)

  const hide = useCallback(() => {
    if (!secret.trim()) return
    setHideResult(embed(carrier, encodeZW(secret)))
  }, [carrier, secret])

  const reveal = useCallback(() => {
    if (!toExtract.trim()) return
    const extracted = extractZW(toExtract)
    setRevealed(extracted || "未检测到隐藏内容")
  }, [toExtract])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">文字隐写</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          使用 Unicode 零宽字符隐藏秘密文本，肉眼不可见
        </p>
      </div>

      {/* 隐藏区 */}
      <Card>
        <CardHeader>
          <CardTitle>隐藏文字</CardTitle>
          <CardDescription>
            在载体文本中嵌入秘密信息，粘贴后文本看起来不变
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 载体文本 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">载体文本</label>
            <textarea
              placeholder="作为掩护的普通文本…"
              className="min-h-16 w-full border border-border bg-transparent px-3 py-3 text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
              value={carrier}
              onChange={(e) => setCarrier(e.currentTarget.value)}
            />
            <p className="text-xs text-muted-foreground">{charInfo(carrier)}</p>
          </div>

          {/* 秘密文本 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">秘密文本</label>
            <textarea
              placeholder="要隐藏的内容…"
              className="min-h-16 w-full border border-border bg-transparent px-3 py-3 text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
              value={secret}
              onChange={(e) => setSecret(e.currentTarget.value)}
            />
          </div>

          <Button onClick={hide} disabled={!secret.trim()} className="w-full">
            隐藏
          </Button>

          {hideResult && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">隐藏后文本</label>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    navigator.clipboard.writeText(hideResult)
                    setCopiedHide(true)
                    setTimeout(() => setCopiedHide(false), 2000)
                  }}
                >
                  {copiedHide ? "已复制" : "复制"}
                </Button>
              </div>
              <div className="border border-border bg-muted/50 px-3 py-3 text-base">
                {hideResult}
              </div>
              <p className="text-xs text-muted-foreground">{charInfo(hideResult)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 提取区 */}
      <Card>
        <CardHeader>
          <CardTitle>提取文字</CardTitle>
          <CardDescription>
            粘贴含零宽字符的文本，提取其中隐藏的秘密信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 待提取文本 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">粘贴文本</label>
            <textarea
              placeholder="在此粘贴含有隐藏信息的文本…"
              className="min-h-16 w-full border border-border bg-transparent px-3 py-3 text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
              value={toExtract}
              onChange={(e) => setToExtract(e.currentTarget.value)}
            />
            <p className="text-xs text-muted-foreground">{charInfo(toExtract)}</p>
          </div>

          <Button onClick={reveal} disabled={!toExtract.trim()} className="w-full">
            提取
          </Button>

          {revealed && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">提取结果</label>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    navigator.clipboard.writeText(revealed)
                    setCopiedReveal(true)
                    setTimeout(() => setCopiedReveal(false), 2000)
                  }}
                >
                  {copiedReveal ? "已复制" : "复制"}
                </Button>
              </div>
              <div className="border border-border bg-muted/50 px-3 py-3 text-base">
                {revealed}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
