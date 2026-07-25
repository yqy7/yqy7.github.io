import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SpinningWheel } from "@/components/SpinningWheel"

interface Option {
  label: string
  color: string
}

const DEFAULT_OPTIONS = ["火锅", "烧烤", "寿司", "麻辣烫", "汉堡", "螺蛳粉"]

export default function LuckyWheelPage() {
  const [options, setOptions] = useState<string[]>(DEFAULT_OPTIONS)
  const [newOption, setNewOption] = useState("")
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState("")

  const handleAdd = useCallback(() => {
    const v = newOption.trim()
    if (!v) return
    setOptions((prev) => [...prev, v])
    setNewOption("")
    setResult("")
  }, [newOption])

  const handleRemove = useCallback((index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index))
    setResult("")
  }, [])

  const handleClear = useCallback(() => {
    setOptions([])
    setResult("")
  }, [])

  const handleReset = useCallback(() => {
    setOptions(DEFAULT_OPTIONS)
    setResult("")
  }, [])

  const wheelOptions: Option[] = options.map((label) => ({
    label,
    color: "", // color is assigned inside SpinningWheel
  }))

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">转盘随机选择</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          自定义选项，点击开始按钮进行随机选择
        </p>
      </div>

      {/* 结果弹窗 */}
      {result && !spinning && (
        <div className="rounded-sm border border-ring bg-muted/30 px-4 py-3 text-center">
          <span className="text-lg font-semibold">
            {result}
          </span>
        </div>
      )}

      {/* 转盘 + 选项 */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col items-center gap-4">
          <SpinningWheel
            options={wheelOptions}
            spinning={spinning}
            onFinish={(opt) => {
              setSpinning(false)
              setResult(opt.label)
            }}
          />
          <Button
            size="lg"
            className="w-full"
            disabled={spinning || options.length === 0}
            onClick={() => {
              setResult("")
              setSpinning(true)
            }}
          >
            {spinning ? "转动中…" : "开始"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>随机选择选项</CardTitle>
            <CardDescription>添加、删除或清空选项</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="输入新选项…"
                className="min-w-0 flex-1 border border-border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
                value={newOption}
                onChange={(e) => setNewOption(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <Button onClick={handleAdd} disabled={!newOption.trim()} size="sm">
                添加
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClear} className="flex-1">
                清空
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset} className="flex-1">
                重置
              </Button>
            </div>
            {options.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {options.map((opt, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-sm"
                  >
                    {opt}
                    <button
                      className="ml-0.5 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(i)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
