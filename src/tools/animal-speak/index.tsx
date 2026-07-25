import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { animalEncode, animalDecode } from "./encoding"

type CharIndex = 0 | 1 | 2 | 3

const LABELS = ["00 (第1个)", "01 (第2个)", "10 (第3个)", "11 (第4个)"]

// 判断是否可能是女声（通过名称关键字）
function isFemaleVoice(name: string): boolean {
  const l = name.toLowerCase()
  return (
    l.includes("female") ||
    l.includes("xiaoxiao") ||
    l.includes("xiaoyi") ||
    l.includes("xiaobei") ||
    l.includes("tingting") ||
    l.includes("yating") ||
    l.includes("zhiwei") ||
    l.includes("女") ||
    l.includes("samantha") ||
    l.includes("karen") ||
    l.includes("tessa") ||
    l.includes("moira") ||
    l.includes("victoria") ||
    l.includes("mei-jia") ||
    l.includes("yating") ||
    l.includes("hanhan")
  )
}

export default function AnimalSpeakPage() {
  // 语音
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURI] = useState("")
  const voiceInited = useRef(false)

  // 编码状态
  const [encodeInput, setEncodeInput] = useState("")
  const [encodeResult, setEncodeResult] = useState("")
  const [copiedEncode, setCopiedEncode] = useState(false)

  // 解码状态
  const [decodeInput, setDecodeInput] = useState("")
  const [decodeResult, setDecodeResult] = useState("")
  const [copiedDecode, setCopiedDecode] = useState(false)

  // 共享的自定义字符
  const [chars, setChars] = useState<[string, string, string, string]>([
    "嗷",
    "呜",
    "啊",
    "~",
  ])

  const options = { chars }

  // 加载语音列表，默认选中支持中文的女声
  useEffect(() => {
    const load = () => {
      const all = speechSynthesis.getVoices()
      if (all.length === 0) return
      const zh = all.filter((v) => v.lang.startsWith("zh"))
      const others = all.filter((v) => !v.lang.startsWith("zh"))
      const sorted = [...zh, ...others]
      setVoices(sorted)

      if (!voiceInited.current) {
        // 优先选女声
        const female = zh.find((v) => isFemaleVoice(v.name))
        const first = female || zh[0] || sorted[0]
        if (first) {
          setVoiceURI(first.voiceURI)
          voiceInited.current = true
        }
      }
    }
    load()
    speechSynthesis.onvoiceschanged = load
    return () => { speechSynthesis.onvoiceschanged = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEncode = useCallback(() => {
    setEncodeResult(animalEncode(encodeInput, options))
  }, [encodeInput, chars])

  const handleDecode = useCallback(() => {
    const result = animalDecode(decodeInput, options)
    setDecodeResult(result || "未检测到有效兽语字符")
  }, [decodeInput, chars])

  const updateChar = (index: CharIndex, value: string) => {
    setChars((prev) => {
      const next = [...prev] as [string, string, string, string]
      next[index] = value.slice(-1) || prev[index] // 只保留最后一个字符
      return next
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">兽言兽语</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          用 4 个自定义字符对任意文字进行编码，像动物的语言一样
        </p>
      </div>

      {/* 自定义字符 */}
      <Card>
        <CardHeader>
          <CardTitle>自定义字符</CardTitle>
          <CardDescription>
            设置 4 个字符，分别对应二进制 00、01、10、11
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {chars.map((ch, i) => (
              <div key={i} className="space-y-1">
                <label className="text-xs text-muted-foreground">{LABELS[i]}</label>
                <input
                  type="text"
                  maxLength={1}
                  value={ch}
                  onChange={(e) => updateChar(i as CharIndex, e.currentTarget.value)}
                  className="w-full border border-border bg-transparent px-2 py-2 text-center text-lg outline-none focus-visible:border-ring"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 编码 */}
      <Card>
        <CardHeader>
          <CardTitle>编码（文字 → 兽语）</CardTitle>
          <CardDescription>输入普通文字，转换为兽语字符</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            placeholder="在此输入要编码的文字…"
            className="min-h-20 w-full border border-border bg-transparent px-3 py-3 text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
            value={encodeInput}
            onChange={(e) => setEncodeInput(e.currentTarget.value)}
          />
          <Button
            onClick={handleEncode}
            disabled={!encodeInput.trim()}
            className="w-full"
          >
            编码
          </Button>
          {encodeResult && (
            <div className="space-y-1.5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">兽语</label>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => {
                        speechSynthesis.cancel()
                        const u = new SpeechSynthesisUtterance(encodeResult)
                        u.rate = 1.2
                        u.pitch = 1.2
                        u.lang = "zh-CN"
                        const v = voices.find((v) => v.voiceURI === voiceURI)
                        if (v) u.voice = v
                        speechSynthesis.speak(u)
                      }}
                    >
                      朗读
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => {
                        navigator.clipboard.writeText(encodeResult)
                        setCopiedEncode(true)
                        setTimeout(() => setCopiedEncode(false), 2000)
                      }}
                    >
                      {copiedEncode ? "已复制" : "复制"}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="shrink-0 text-xs text-muted-foreground">语音</label>
                  <select
                    value={voiceURI}
                    onChange={(e) => setVoiceURI(e.currentTarget.value)}
                    className="flex-1 border border-border bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring"
                  >
                    {voices.length === 0 && <option value="">加载中…</option>}
                    {voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="break-all border border-border bg-muted/50 px-3 py-3 text-base">
                {encodeResult}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 解码 */}
      <Card>
        <CardHeader>
          <CardTitle>解码（兽语 → 文字）</CardTitle>
          <CardDescription>输入兽语字符，还原为原始文字</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            placeholder="在此输入兽语…"
            className="min-h-20 w-full border border-border bg-transparent px-3 py-3 text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
            value={decodeInput}
            onChange={(e) => setDecodeInput(e.currentTarget.value)}
          />
          <Button
            onClick={handleDecode}
            disabled={!decodeInput.trim()}
            className="w-full"
          >
            解码
          </Button>
          {decodeResult && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">原文</label>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    navigator.clipboard.writeText(decodeResult)
                    setCopiedDecode(true)
                    setTimeout(() => setCopiedDecode(false), 2000)
                  }}
                >
                  {copiedDecode ? "已复制" : "复制"}
                </Button>
              </div>
              <div className="border border-border bg-muted/50 px-3 py-3 text-base">
                {decodeResult}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
