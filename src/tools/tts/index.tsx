import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface VoiceInfo {
  voice: SpeechSynthesisVoice
  label: string
}

export default function TTSPage() {
  const [input, setInput] = useState("你好，这里是我的小工具页面")
  const [voices, setVoices] = useState<VoiceInfo[]>([])
  const [selectedVoice, setSelectedVoice] = useState("")
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // 获取语音列表
  const loadVoices = useCallback(() => {
    const all = speechSynthesis.getVoices()
    if (all.length === 0) return

    // 中文语音优先排前面
    const zh: VoiceInfo[] = []
    const other: VoiceInfo[] = []
    for (const v of all) {
      const info = {
        voice: v,
        label: `${v.name} (${v.lang})`,
      }
      if (v.lang.startsWith("zh")) {
        zh.push(info)
      } else {
        other.push(info)
      }
    }
    const sorted = [...zh, ...other]
    setVoices(sorted)

    // 默认选中第一个中文语音
    if (!selectedVoice && zh.length > 0) {
      setSelectedVoice(zh[0].voice.voiceURI)
    } else if (!selectedVoice && sorted.length > 0) {
      setSelectedVoice(sorted[0].voice.voiceURI)
    }
  }, [selectedVoice])

  useEffect(() => {
    loadVoices()
    // voices 可能异步加载
    speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      speechSynthesis.onvoiceschanged = null
      speechSynthesis.cancel()
    }
  }, [loadVoices])

  const getVoice = (): SpeechSynthesisVoice | null => {
    return voices.find((v) => v.voice.voiceURI === selectedVoice)?.voice ?? null
  }

  const speak = useCallback(() => {
    if (!input.trim()) return

    speechSynthesis.cancel()
    setPaused(false)

    const utterance = new SpeechSynthesisUtterance(input)
    const voice = getVoice()
    if (voice) utterance.voice = voice
    utterance.rate = rate
    utterance.pitch = pitch

    utterance.onstart = () => setPlaying(true)
    utterance.onend = () => {
      setPlaying(false)
      setPaused(false)
    }
    utterance.onpause = () => setPaused(true)
    utterance.onresume = () => setPaused(false)

    // Chrome 有个 bug: 长时间不播放会切断 utterance
    // 这里不做额外处理

    utteranceRef.current = utterance
    speechSynthesis.speak(utterance)
    setPlaying(true)
  }, [input, rate, pitch, voices, selectedVoice])

  const pause = useCallback(() => {
    speechSynthesis.pause()
  }, [])

  const resume = useCallback(() => {
    speechSynthesis.resume()
  }, [])

  const stop = useCallback(() => {
    speechSynthesis.cancel()
    setPlaying(false)
    setPaused(false)
  }, [])

  const reset = useCallback(() => {
    speechSynthesis.cancel()
    setRate(1)
    setPitch(1)
    setPlaying(false)
    setPaused(false)
    // 重置为第一个中文语音
    const zh = voices.find((v) => v.voice.lang.startsWith("zh"))
    if (zh) setSelectedVoice(zh.voice.voiceURI)
    else if (voices.length > 0) setSelectedVoice(voices[0].voice.voiceURI)
  }, [voices])

  const selectedLabel = voices.find((v) => v.voice.voiceURI === selectedVoice)?.label ?? "默认语音"

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">文字转语音</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          使用浏览器内置语音引擎朗读文字，支持多语言和参数调节
        </p>
      </div>

      {/* 输入区 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">输入文字</label>
        <textarea
          placeholder="在此输入要朗读的文字…"
          className="min-h-32 w-full border border-border bg-transparent px-3 py-3 text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </div>

      {/* 设置区 */}
      <Card>
        <CardHeader>
          <CardTitle>语音设置</CardTitle>
          <CardDescription>选择语音引擎、调节语速和音调</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 语音选择 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">语音</label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.currentTarget.value)}
              className="w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
            >
              {voices.length === 0 && <option value="">加载中…</option>}
              {voices.map((v) => (
                <option key={v.voice.voiceURI} value={v.voice.voiceURI}>
                  {v.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">当前：{selectedLabel}</p>
          </div>

          {/* 语速 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              语速：<span className="tabular-nums">{rate.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min={0.1}
              max={3}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(Number(e.currentTarget.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-foreground [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.1x</span>
              <span>3.0x</span>
            </div>
          </div>

          {/* 音调 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              音调：<span className="tabular-nums">{pitch.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={pitch}
              onChange={(e) => setPitch(Number(e.currentTarget.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-foreground [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>2.0</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 控制按钮 */}
      <div className="flex gap-2">
        {!playing || paused ? (
          <Button
            onClick={paused ? resume : speak}
            disabled={!input.trim()}
            className="flex-1"
          >
            {paused ? "继续" : "朗读"}
          </Button>
        ) : (
          <Button onClick={pause} className="flex-1">
            暂停
          </Button>
        )}
        {playing && (
          <Button variant="outline" onClick={stop}>
            停止
          </Button>
        )}
        <Button variant="outline" onClick={reset}>
          重置
        </Button>
      </div>
    </div>
  )
}
