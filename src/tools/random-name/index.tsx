import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import randomName, { NameStyle, NickStyle, Language } from "wg-random-name"

function CopyTag({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <span
      className="cursor-pointer rounded-sm border border-border px-2 py-1 text-sm transition-colors hover:border-ring hover:bg-muted/50 select-none"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? "已复制" : text}
    </span>
  )
}

const NAME_STYLES = [
  { key: NameStyle.TRADITIONAL, label: "传统正式" },
  { key: NameStyle.MODERN, label: "现代时尚" },
  { key: NameStyle.LITERARY, label: "文艺清新" },
  { key: NameStyle.CLASSICAL, label: "古风雅致" },
]

const NICK_STYLES = [
  { key: NickStyle.CUTE, label: "俏皮可爱" },
  { key: NickStyle.FUNNY, label: "风趣幽默" },
  { key: NickStyle.INTERNET, label: "网络流行" },
  { key: NickStyle.COOL, label: "霸气威武" },
  { key: NickStyle.FRESH, label: "文艺小清新" },
  { key: NickStyle.ANIME, label: "二次元" },
]

const LANGUAGES = [
  { key: Language.CHINESE, label: "中文" },
  { key: Language.ENGLISH, label: "英文" },
  { key: Language.JAPANESE, label: "日文" },
  { key: Language.KOREAN, label: "韩文" },
]

export default function RandomNamePage() {
  // 姓名状态
  const [nameCount, setNameCount] = useState(10)
  const [gender, setGender] = useState<"male" | "female" | "mixed">("mixed")
  const [nameStyle, setNameStyle] = useState<NameStyle>(NameStyle.MODERN)
  const [sur, setSur] = useState(false)
  const [names, setNames] = useState<string[]>([])

  // 昵称状态
  const [nickCount, setNickCount] = useState(10)
  const [nickStyle, setNickStyle] = useState<NickStyle>(NickStyle.CUTE)
  const [language, setLanguage] = useState<Language>(Language.CHINESE)
  const [nicknames, setNicknames] = useState<string[]>([])

  const handleGenNames = useCallback(() => {
    const result = randomName.generateNames(nameCount, {
      gender,
      style: nameStyle,
      sur,
    })
    setNames(result)
  }, [nameCount, gender, nameStyle, sur])

  const handleGenNicks = useCallback(() => {
    const result = randomName.generateNickNames(nickCount, nickStyle, language)
    setNicknames(result)
  }, [nickCount, nickStyle, language])

  const copyList = async (list: string[]) => {
    await navigator.clipboard.writeText(list.join("\n"))
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">随机名称生成</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          生成随机中文姓名和昵称，支持多种风格和语言
        </p>
      </div>

      {/* 姓名 */}
      <Card>
        <CardHeader>
          <CardTitle>随机姓名</CardTitle>
          <CardDescription>生成符合中国取名习惯的中文姓名</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm">数量</label>
              <input
                type="number"
                min={1}
                max={100}
                value={nameCount}
                onChange={(e) => {
                  const v = Number(e.currentTarget.value)
                  if (v >= 1 && v <= 100) setNameCount(v)
                }}
                className="w-16 border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus-visible:border-ring"
              />
            </div>
            <div className="flex gap-1">
              {(
                [
                  ["male", "男"],
                  ["female", "女"],
                  ["mixed", "混合"],
                ] as const
              ).map(([k, label]) => (
                <Button
                  key={k}
                  variant={gender === k ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGender(k)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sur}
                onChange={() => setSur((v) => !v)}
                className="accent-foreground size-4"
              />
              复姓
            </label>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">风格</label>
            <div className="flex flex-wrap gap-1">
              {NAME_STYLES.map((s) => (
                <Button
                  key={s.key}
                  variant={nameStyle === s.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNameStyle(s.key)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
          <Button onClick={handleGenNames} className="w-full">
            生成姓名
          </Button>
          {names.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">结果（{names.length}）</span>
                <Button variant="ghost" size="xs" onClick={() => copyList(names)}>
                  复制全部
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {names.map((n, i) => (
                  <CopyTag key={i} text={n} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 昵称 */}
      <Card>
        <CardHeader>
          <CardTitle>随机昵称</CardTitle>
          <CardDescription>生成趣味昵称，支持多种风格和语言</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm">数量</label>
              <input
                type="number"
                min={1}
                max={100}
                value={nickCount}
                onChange={(e) => {
                  const v = Number(e.currentTarget.value)
                  if (v >= 1 && v <= 100) setNickCount(v)
                }}
                className="w-16 border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus-visible:border-ring"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">语言</label>
            <div className="flex flex-wrap gap-1">
              {LANGUAGES.map((l) => (
                <Button
                  key={l.key}
                  variant={language === l.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLanguage(l.key)}
                >
                  {l.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">风格</label>
            <div className="flex flex-wrap gap-1">
              {NICK_STYLES.map((s) => (
                <Button
                  key={s.key}
                  variant={nickStyle === s.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNickStyle(s.key)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
          <Button onClick={handleGenNicks} className="w-full">
            生成昵称
          </Button>
          {nicknames.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">结果（{nicknames.length}）</span>
                <Button variant="ghost" size="xs" onClick={() => copyList(nicknames)}>
                  复制全部
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {nicknames.map((n, i) => (
                  <CopyTag key={i} text={n} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
