import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BaseConfig {
  base: number
  label: string
  placeholder: string
  validate: (ch: string) => boolean
}

const BASES: BaseConfig[] = [
  {
    base: 2,
    label: "二进制 (Base 2)",
    placeholder: "0 或 1",
    validate: (ch) => ch === "0" || ch === "1",
  },
  {
    base: 8,
    label: "八进制 (Base 8)",
    placeholder: "0-7",
    validate: (ch) => ch >= "0" && ch <= "7",
  },
  {
    base: 10,
    label: "十进制 (Base 10)",
    placeholder: "0-9",
    validate: (ch) => ch >= "0" && ch <= "9",
  },
  {
    base: 12,
    label: "十二进制 (Base 12)",
    placeholder: "0-9, A, B",
    validate: (ch) => /^[0-9abAB]$/.test(ch),
  },
  {
    base: 16,
    label: "十六进制 (Base 16)",
    placeholder: "0-9, A-F",
    validate: (ch) => /^[0-9a-fA-F]$/.test(ch),
  },
]

const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

function parseBase(str: string, base: number): bigint {
  const baseN = BigInt(base)
  let result = 0n
  for (const ch of str) {
    const digit = DIGITS.indexOf(ch.toUpperCase())
    if (digit < 0 || digit >= base) throw new Error("invalid digit")
    result = result * baseN + BigInt(digit)
  }
  return result
}

function toBase(value: bigint, base: number): string {
  if (value === 0n) return "0"
  const baseN = BigInt(base)
  let n = value < 0n ? -value : value
  let result = ""
  while (n > 0n) {
    result = DIGITS[Number(n % baseN)] + result
    n /= baseN
  }
  return value < 0n ? "-" + result : result
}

export default function BaseConvertPage() {
  const [values, setValues] = useState<string[]>(BASES.map(() => ""))
  const [errors, setErrors] = useState<string[]>(BASES.map(() => ""))

  const sync = useCallback((fromIndex: number, raw: string) => {
    // 允许输入负号
    const isNegative = raw.startsWith("-")
    const sanitized = isNegative ? raw.slice(1) : raw

    if (sanitized === "") {
      // 只有负号，不转换
      setValues(() => {
        const next = BASES.map(() => "")
        next[fromIndex] = raw
        return next
      })
      setErrors(BASES.map(() => ""))
      return
    }

    // 检查是否以负号结尾（用户正在输入中），暂时忽略
    // 验证字符
    const cfg = BASES[fromIndex]
    for (const ch of sanitized) {
      if (!cfg.validate(ch.toUpperCase())) {
        setValues((prev) => {
          const next = [...prev]
          next[fromIndex] = raw
          return next
        })
        setErrors(() => {
          const next = BASES.map(() => "")
          next[fromIndex] = `包含无效字符（${cfg.base} 进制）`
          return next
        })
        return
      }
    }

    try {
      const value = parseBase(sanitized, cfg.base)
      const finalValue = isNegative ? -value : value

      const newValues = BASES.map((b) => toBase(finalValue, b.base))
      const newErrors = BASES.map(() => "")

      setValues(() => {
        // 保留当前编辑框的原始输入
        const result = [...newValues]
        result[fromIndex] = raw
        return result
      })
      setErrors(newErrors)
    } catch {
      setValues((prev) => {
        const next = [...prev]
        next[fromIndex] = raw
        return next
      })
      setErrors(() => {
        const next = BASES.map(() => "")
        next[fromIndex] = "数值过大"
        return next
      })
    }
  }, [])

  const handleChange = (index: number, value: string) => {
    // 只允许合法字符和负号
    const filtered = value
      .split("")
      .filter((ch, i) => {
        if (ch === "-") return i === 0 // 负号只能在开头
        return BASES[index].validate(ch.toUpperCase())
      })
      .join("")
    sync(index, filtered)
  }

  const handleReset = useCallback(() => {
    setValues(BASES.map(() => ""))
    setErrors(BASES.map(() => ""))
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">进制转换</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            支持 2/8/10/12/16 进制实时互转，任意输入框输入即可
          </p>
        </div>
        <Button variant="outline" onClick={handleReset}>
          重置
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>进制输入</CardTitle>
          <CardDescription>
            在任意进制输入框中输入数值，其他进制会自动实时转换
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {BASES.map((cfg, index) => (
            <div key={cfg.base} className="space-y-1.5">
              <label className="text-sm font-medium">{cfg.label}</label>
              <input
                type="text"
                value={values[index]}
                onChange={(e) => handleChange(index, e.currentTarget.value)}
                placeholder={cfg.placeholder}
                className="w-full border border-border bg-transparent px-3 py-2 font-mono text-base outline-none transition-[border-color] placeholder:text-muted-foreground focus-visible:border-ring"
              />
              {errors[index] && (
                <p className="text-xs text-destructive">{errors[index]}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
