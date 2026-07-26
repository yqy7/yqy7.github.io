import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fakerEN, fakerZH_CN } from "@faker-js/faker"

// ── 身份证号工具 ──────────────────────────────────────────────

const ID_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
const ID_CHECK = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"]

interface Region {
  addressPrefix: string
  code: string
}

const REGIONS: Region[] = [
  { addressPrefix: "北京市", code: "110101" },
  { addressPrefix: "上海市", code: "310101" },
  { addressPrefix: "天津市", code: "120101" },
  { addressPrefix: "重庆市", code: "500112" },
  { addressPrefix: "广东省广州市", code: "440103" },
  { addressPrefix: "广东省深圳市", code: "440305" },
  { addressPrefix: "浙江省杭州市", code: "330102" },
  { addressPrefix: "江苏省南京市", code: "320102" },
  { addressPrefix: "江苏省苏州市", code: "320505" },
  { addressPrefix: "四川省成都市", code: "510107" },
  { addressPrefix: "湖北省武汉市", code: "420106" },
  { addressPrefix: "湖南省长沙市", code: "430103" },
  { addressPrefix: "福建省福州市", code: "350102" },
  { addressPrefix: "福建省厦门市", code: "350203" },
  { addressPrefix: "山东省济南市", code: "370102" },
  { addressPrefix: "山东省青岛市", code: "370203" },
  { addressPrefix: "辽宁省沈阳市", code: "210102" },
  { addressPrefix: "辽宁省大连市", code: "210203" },
  { addressPrefix: "河南省郑州市", code: "410102" },
  { addressPrefix: "陕西省西安市", code: "610103" },
  { addressPrefix: "河北省石家庄市", code: "130102" },
  { addressPrefix: "安徽省合肥市", code: "340103" },
  { addressPrefix: "江西省南昌市", code: "360102" },
  { addressPrefix: "吉林省长春市", code: "220102" },
  { addressPrefix: "黑龙江省哈尔滨市", code: "230103" },
  { addressPrefix: "广西南宁市", code: "450103" },
  { addressPrefix: "云南省昆明市", code: "530102" },
  { addressPrefix: "贵州省贵阳市", code: "520102" },
  { addressPrefix: "山西省太原市", code: "140106" },
  { addressPrefix: "甘肃省兰州市", code: "620102" },
  { addressPrefix: "内蒙古呼和浩特市", code: "150102" },
  { addressPrefix: "海南省海口市", code: "460105" },
]

function randomRegion(): Region {
  return REGIONS[Math.floor(Math.random() * REGIONS.length)]
}

/** 根据前 17 位计算身份证第 18 位校验码 */
function idChecksum(base17: string): string {
  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += parseInt(base17[i], 10) * ID_WEIGHTS[i]
  }
  return ID_CHECK[sum % 11]
}

function generateIdNumber(birthDate: Date, regionCode: string): string {
  const y = birthDate.getFullYear().toString()
  const m = (birthDate.getMonth() + 1).toString().padStart(2, "0")
  const d = birthDate.getDate().toString().padStart(2, "0")
  const seq = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  const base17 = regionCode + y + m + d + seq
  return base17 + idChecksum(base17)
}

function calcAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// ── 身份数据结构 ──────────────────────────────────────────────

interface Identity {
  nameCN: string
  nameEN: string
  genderCN: string
  genderEN: string
  birthDate: string
  age: number
  phone: string
  email: string
  idNumber: string
  address: string
  company: string
  jobTitle: string
}

function generateIdentity(gender?: "male" | "female"): Identity {
  const seed = Math.floor(Math.random() * 1000000)
  fakerZH_CN.seed(seed)
  fakerEN.seed(seed)

  const sex = gender ?? (Math.random() < 0.5 ? "male" : "female") as "male" | "female"

  const birthDate = fakerZH_CN.date.birthdate({ min: 18, max: 60, mode: "age" })
  const region = randomRegion()

  return {
    nameCN: fakerZH_CN.person.fullName({ sex }),
    nameEN: fakerEN.person.fullName({ sex }),
    genderCN: sex === "male" ? "男" : "女",
    genderEN: sex === "male" ? "Male" : "Female",
    birthDate: birthDate.toISOString().split("T")[0],
    age: calcAge(birthDate),
    phone: fakerZH_CN.phone.number(),
    email: fakerZH_CN.internet.email({
      firstName: fakerZH_CN.person.firstName(sex),
      lastName: fakerZH_CN.person.lastName(sex),
    }),
    idNumber: generateIdNumber(birthDate, region.code),
    address: `${region.addressPrefix}${fakerZH_CN.location.streetAddress()}`,
    company: fakerZH_CN.company.name(),
    jobTitle: fakerZH_CN.person.jobTitle(),
  }
}

// ── 字段展示组件 ──────────────────────────────────────────────

const FIELD_LABELS: { key: keyof Identity; label: string }[] = [
  { key: "nameCN", label: "中文姓名" },
  { key: "nameEN", label: "英文姓名" },
  { key: "genderCN", label: "性别" },
  { key: "age", label: "年龄" },
  { key: "birthDate", label: "出生日期" },
  { key: "idNumber", label: "身份证号" },
  { key: "phone", label: "手机号码" },
  { key: "email", label: "电子邮箱" },
  { key: "address", label: "家庭住址" },
  { key: "company", label: "工作单位" },
  { key: "jobTitle", label: "职位" },
]

function FieldRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string | number
  mono?: boolean
}) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex items-start gap-3 border-b border-border py-2.5 last:border-b-0">
      <span className="w-20 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span
        className={`min-w-0 flex-1 cursor-pointer select-none rounded-sm px-1.5 py-0.5 text-sm transition-colors hover:bg-muted ${
          mono ? "font-mono" : ""
        }`}
        onClick={async () => {
          await navigator.clipboard.writeText(String(value))
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
        title="点击复制"
      >
        {copied ? <span className="text-green-600">已复制</span> : value}
      </span>
    </div>
  )
}

// ── CSV 工具 ──────────────────────────────────────────────────

const CSV_HEADERS = [
  "中文姓名",
  "英文姓名",
  "性别",
  "年龄",
  "出生日期",
  "身份证号",
  "手机号码",
  "电子邮箱",
  "家庭住址",
  "工作单位",
  "职位",
]

const CSV_KEYS: (keyof Identity)[] = [
  "nameCN",
  "nameEN",
  "genderCN",
  "age",
  "birthDate",
  "idNumber",
  "phone",
  "email",
  "address",
  "company",
  "jobTitle",
]

function formatCSV(identities: Identity[]): string {
  const escape = (v: string | number) => {
    const s = String(v)
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const header = CSV_HEADERS.join(",")
  const rows = identities.map((id) => CSV_KEYS.map((k) => escape(id[k])).join(","))
  return [header, ...rows].join("\n")
}

// ── 页面组件 ──────────────────────────────────────────────────

const MAX_COUNT = 100

// ── 数据表格列定义 ──────────────────────────────────────────

const TABLE_COLS: { key: keyof Identity; label: string }[] = [
  { key: "nameCN", label: "姓名" },
  { key: "genderCN", label: "性别" },
  { key: "age", label: "年龄" },
  { key: "birthDate", label: "出生日期" },
  { key: "idNumber", label: "身份证号" },
  { key: "phone", label: "手机号码" },
  { key: "email", label: "邮箱" },
  { key: "address", label: "地址" },
  { key: "company", label: "工作单位" },
  { key: "jobTitle", label: "职位" },
]

// ── 页面组件 ──────────────────────────────────────────────────

export default function IdentityPage() {
  const [identities, setIdentities] = useState<Identity[]>(() => [generateIdentity()])
  const [count, setCount] = useState(1)
  const [genderFilter, setGenderFilter] = useState<"random" | "male" | "female">("random")
  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleGenerate = useCallback(() => {
    const gender = genderFilter === "random" ? undefined : genderFilter
    const list: Identity[] = []
    for (let i = 0; i < count; i++) {
      list.push(generateIdentity(gender))
    }
    setIdentities(list)
    setSelectedIndex(0)
  }, [count, genderFilter])

  const preview = identities[selectedIndex] ?? identities[0]
  const isBatch = identities.length > 1

  const copyAll = async () => {
    const lines = FIELD_LABELS.map(({ key, label }) => `${label}：${preview[key]}`)
    await navigator.clipboard.writeText(lines.join("\n"))
  }

  const copyAsJSON = async () => {
    const json = JSON.stringify(isBatch ? identities : identities[0], null, 2)
    await navigator.clipboard.writeText(json)
  }

  const copyAsCSV = async () => {
    await navigator.clipboard.writeText(formatCSV(identities))
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">虚拟身份生成</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          随机生成虚拟身份信息，支持批量生成和多种格式导出
        </p>
      </div>

      {/* 免责声明 */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-50/50 px-4 py-3 dark:bg-amber-950/20">
        <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">
          <strong className="font-semibold">⚠️ 免责声明：</strong>
          本工具生成的姓名、身份证号、地址、电话等均为<strong>随机虚构数据</strong>，仅供开发测试、UI
          预览、教学演示等合法用途。严禁用于注册账号、实名认证、诈骗、伪造证件等任何违法违规行为。使用者须自行承担因滥用本工具而产生的一切法律后果。
        </p>
      </div>

      {/* 操作栏 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {(
            [
              ["random", "随机"],
              ["male", "男"],
              ["female", "女"],
            ] as const
          ).map(([k, label]) => (
            <Button
              key={k}
              variant={genderFilter === k ? "default" : "outline"}
              size="sm"
              onClick={() => setGenderFilter(k)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">条数</label>
          <input
            type="number"
            min={1}
            max={MAX_COUNT}
            value={count}
            onChange={(e) => {
              const v = Number(e.currentTarget.value)
              if (v >= 1 && v <= MAX_COUNT) setCount(v)
            }}
            className="w-16 border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus-visible:border-ring"
          />
        </div>
        <Button onClick={handleGenerate} className="min-w-28">
          生成身份
        </Button>
        <Button variant="outline" size="sm" onClick={copyAsJSON}>
          复制为 JSON
        </Button>
        <Button variant="outline" size="sm" onClick={copyAsCSV}>
          复制为 CSV
        </Button>
      </div>

      {/* 身份卡片 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              身份信息
              {isBatch && (
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  第 {selectedIndex + 1}/{identities.length} 条
                </span>
              )}
            </CardTitle>
            <CardDescription>点击任意字段值即可单独复制</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={copyAll}>
            复制全部
          </Button>
        </CardHeader>
        <CardContent>
          <div>
            {FIELD_LABELS.map(({ key, label }) => (
              <FieldRow
                key={key}
                label={label}
                value={preview[key]}
                mono={key === "idNumber" || key === "phone" || key === "email"}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle>
            数据预览
            <span className="ml-2 text-base font-normal text-muted-foreground">
              共 {identities.length} 条
            </span>
          </CardTitle>
          <CardDescription>点击任意行切换上方详情，横向滚动查看更多列</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2.5 text-left font-medium whitespace-nowrap">
                    #
                  </th>
                  {TABLE_COLS.map((col) => (
                    <th
                      key={col.key}
                      className="px-3 py-2.5 text-left font-medium whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {identities.map((id, idx) => (
                  <tr
                    key={idx}
                    className={`cursor-pointer border-b border-border transition-colors hover:bg-muted/30 ${
                      idx === selectedIndex ? "bg-muted/50" : ""
                    }`}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    <td className="sticky left-0 z-10 bg-inherit px-3 py-2 text-muted-foreground whitespace-nowrap">
                      {idx + 1}
                    </td>
                    {TABLE_COLS.map((col) => (
                      <td key={col.key} className="max-w-48 truncate px-3 py-2 whitespace-nowrap">
                        {id[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
