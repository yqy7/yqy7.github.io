import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { computeHash } from "@/tools/encode-decode/utils"

const CHAR_SETS: Record<string, string> = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  number: "0123456789",
  special: "!@#$%^&*()_+-=[]{}|;:,.<>?",
}

interface CharOption {
  key: string
  label: string
  desc: string
}

const OPTIONS: CharOption[] = [
  { key: "lower", label: "小写字母", desc: "a-z" },
  { key: "upper", label: "大写字母", desc: "A-Z" },
  { key: "number", label: "数字", desc: "0-9" },
  { key: "special", label: "特殊符号", desc: "!@#$%^&*" },
]

function generatePassword(
  length: number,
  sets: string[],
  prefix: string,
  suffix: string,
): string {
  const pool = sets.join("")
  if (!pool || sets.length === 0) return ""

  const random = new Uint8Array(length * 2)
  crypto.getRandomValues(random)

  const chars: string[] = []

  // 确保每种选中的字符集至少出现一次
  const guaranteeCount = Math.min(sets.length, length)
  for (let i = 0; i < guaranteeCount; i++) {
    const set = sets[i]
    chars.push(set[random[i] % set.length])
  }

  // 剩余位随机从全量池中选取
  for (let i = guaranteeCount; i < length; i++) {
    chars.push(pool[random[i] % pool.length])
  }

  // Fisher-Yates 洗牌
  for (let i = chars.length - 1; i > 0; i--) {
    const j = random[length + i] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return prefix + chars.join("") + suffix
}

export default function PasswordPage() {
  const [length, setLength] = useState(16)
  const [checked, setChecked] = useState<Record<string, boolean>>({
    lower: true,
    upper: true,
    number: true,
    special: false,
  })
  const [prefix, setPrefix] = useState("")
  const [suffix, setSuffix] = useState("")
  const [password, setPassword] = useState("")
  const [md5, setMd5] = useState("")
  const [copiedPwd, setCopiedPwd] = useState(false)
  const [copiedMd5, setCopiedMd5] = useState(false)

  const activeSets = OPTIONS
    .filter((o) => checked[o.key])
    .map((o) => CHAR_SETS[o.key])

  const toggle = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleGenerate = useCallback(async () => {
    if (activeSets.length === 0) return
    const pwd = generatePassword(length, activeSets, prefix, suffix)
    setPassword(pwd)
    const hash = await computeHash(pwd, "MD5")
    setMd5(hash)
  }, [length, activeSets, prefix, suffix])

  const copyPwd = useCallback(async () => {
    if (!password) return
    await navigator.clipboard.writeText(password)
    setCopiedPwd(true)
    setTimeout(() => setCopiedPwd(false), 2000)
  }, [password])

  const copyMd5 = useCallback(async () => {
    if (!md5) return
    await navigator.clipboard.writeText(md5)
    setCopiedMd5(true)
    setTimeout(() => setCopiedMd5(false), 2000)
  }, [md5])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">随机密码生成器</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          使用加密安全随机数生成强密码，支持自定义长度、字符集和前后缀
        </p>
      </div>

      {/* 选项区 */}
      <Card>
        <CardHeader>
          <CardTitle>密码选项</CardTitle>
          <CardDescription>设置密码长度、字符类型和前后缀</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 长度 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              密码长度：<span className="tabular-nums">{length}</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={4}
                max={64}
                value={length}
                onChange={(e) => setLength(Number(e.currentTarget.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-foreground [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
              />
              <input
                type="number"
                min={4}
                max={64}
                value={length}
                onChange={(e) => {
                  const v = Number(e.currentTarget.value)
                  if (v >= 4 && v <= 64) setLength(v)
                }}
                className="w-16 border border-border bg-transparent px-2 py-1 text-center text-sm tabular-nums outline-none focus-visible:border-ring"
              />
            </div>
          </div>

          {/* 字符类型 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">包含字符类型</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {OPTIONS.map((opt) => {
                const isChecked = checked[opt.key]
                return (
                  <label
                    key={opt.key}
                    className={`flex cursor-pointer items-center gap-2 rounded-sm border px-3 py-2 text-sm transition-colors hover:bg-muted/50 ${
                      isChecked ? "border-ring bg-muted/30" : "border-border"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(opt.key)}
                      className="sr-only"
                    />
                    <div
                      className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                        isChecked
                          ? "border-foreground bg-foreground"
                          : "border-border"
                      }`}
                    >
                      {isChecked && (
                        <svg
                          className="size-3 text-background"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.desc}</div>
                    </div>
                  </label>
                )
              })}
            </div>
            {activeSets.length === 0 && (
              <p className="text-xs text-destructive">请至少选择一种字符类型</p>
            )}
          </div>

          {/* 前缀 / 后缀 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">前缀（可选）</label>
              <input
                type="text"
                placeholder="例如：Abc_"
                value={prefix}
                onChange={(e) => setPrefix(e.currentTarget.value)}
                className="w-full border border-border bg-transparent px-3 py-2 text-sm outline-none transition-[border-color] placeholder:text-muted-foreground focus-visible:border-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">后缀（可选）</label>
              <input
                type="text"
                placeholder="例如：_2024"
                value={suffix}
                onChange={(e) => setSuffix(e.currentTarget.value)}
                className="w-full border border-border bg-transparent px-3 py-2 text-sm outline-none transition-[border-color] placeholder:text-muted-foreground focus-visible:border-ring"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 生成按钮 */}
      <Button
        onClick={handleGenerate}
        disabled={activeSets.length === 0}
        className="w-full"
      >
        生成密码
      </Button>

      {/* 输出区 */}
      {password && (
        <div className="space-y-4">
          {/* 密码 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">生成密码</label>
              <Button variant="outline" size="xs" onClick={copyPwd}>
                {copiedPwd ? "已复制" : "复制密码"}
              </Button>
            </div>
            <div className="break-all border border-border bg-muted/50 px-3 py-3 font-mono text-base">
              {password}
            </div>
          </div>

          {/* MD5 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">MD5 哈希</label>
              <Button variant="outline" size="xs" onClick={copyMd5}>
                {copiedMd5 ? "已复制" : "复制 MD5"}
              </Button>
            </div>
            <div className="break-all border border-border bg-muted/50 px-3 py-3 font-mono text-sm text-muted-foreground">
              {md5}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
