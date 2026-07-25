import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import FingerprintJS from "@fingerprintjs/fingerprintjs"

interface InfoItem {
  label: string
  value: string
}

function safe<T>(fn: () => T, fallback = "不支持"): string {
  try {
    const v = fn()
    if (v === undefined || v === null) return fallback
    if (typeof v === "boolean") return v ? "是" : "否"
    return String(v)
  } catch {
    return fallback
  }
}

async function safeAsync(fn: () => Promise<unknown>, fallback = "不支持"): Promise<string> {
  try {
    const v = await fn()
    if (v === undefined || v === null) return fallback
    return String(v)
  } catch {
    return fallback
  }
}

function ExpandableRow({ label, value, isLong }: { label: string; value: string; isLong: boolean }) {
  const [expanded, setExpanded] = useState(false)
  if (!isLong) {
    return (
      <div className="flex gap-3 rounded-sm border border-border px-3 py-2.5">
        <span className="w-36 shrink-0 text-sm font-medium text-muted-foreground">{label}</span>
        <span className="min-w-0 flex-1 break-all text-xs font-mono">{value}</span>
      </div>
    )
  }
  return (
    <div className="rounded-sm border border-border px-3 py-2.5">
      <div
        className="flex cursor-pointer items-center gap-3 select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="w-36 shrink-0 text-sm font-medium text-muted-foreground">{label}</span>
        <span className="min-w-0 flex-1 truncate text-xs font-mono">
          {expanded ? value : value.slice(0, 200) + "…"}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {expanded ? "收起" : "展开"}
        </span>
      </div>
      {expanded && (
        <div className="mt-2 break-all text-xs font-mono text-muted-foreground border-t border-border pt-2">
          {value}
        </div>
      )}
    </div>
  )
}

export default function DeviceInfoPage() {
  const [staticInfo] = useState<{ category: string; items: InfoItem[] }[]>(() => [
    {
      category: "浏览器信息",
      items: [
        { label: "User Agent", value: safe(() => navigator.userAgent) },
        { label: "App 名称", value: safe(() => navigator.appName) },
        { label: "App 版本", value: safe(() => navigator.appVersion) },
        { label: "产品", value: safe(() => navigator.product) },
        { label: "产品版本", value: safe(() => navigator.productSub, "不支持") },
        { label: "供应商", value: safe(() => navigator.vendor) },
        { label: "vendorSub", value: safe(() => (navigator as any).vendorSub, "不支持") },
        { label: "Cookie 启用", value: safe(() => navigator.cookieEnabled) },
        { label: "免追踪 (DNT)", value: safe(() => navigator.doNotTrack ?? "未设置") },
        { label: "浏览历史数量", value: safe(() => history.length) },
        { label: "PDF 查看器", value: safe(() => !!(navigator as any).pdfViewerEnabled) },
        { label: "Webdriver", value: safe(() => !!(navigator as any).webdriver) },
      ],
    },
    {
      category: "语言与时区",
      items: [
        { label: "首选语言", value: safe(() => navigator.language) },
        { label: "语言列表", value: safe(() => navigator.languages?.join(", ") ?? "") },
        { label: "时区", value: safe(() => Intl.DateTimeFormat().resolvedOptions().timeZone) },
        { label: "日期格式", value: safe(() => new Intl.DateTimeFormat().format(new Date())) },
        { label: "数字格式", value: safe(() => new Intl.NumberFormat().format(1234567.89)) },
      ],
    },
    {
      category: "屏幕与显示",
      items: [
        { label: "屏幕分辨率", value: safe(() => `${screen.width} × ${screen.height}`) },
        { label: "可用分辨率", value: safe(() => `${screen.availWidth} × ${screen.availHeight}`) },
        { label: "色深", value: safe(() => `${screen.colorDepth} bit`) },
        { label: "像素深度", value: safe(() => `${screen.pixelDepth} bit`) },
        { label: "设备像素比", value: safe(() => `${window.devicePixelRatio}x`) },
        { label: "屏幕方向", value: safe(() => screen.orientation?.type ?? "不支持") },
        { label: "窗口尺寸", value: safe(() => `${window.innerWidth} × ${window.innerHeight}`) },
        { label: "色域", value: safe(() => matchMedia("(color-gamut: p3)").matches ? "P3" : matchMedia("(color-gamut: srgb)").matches ? "sRGB" : "未知") },
        { label: "HDR", value: safe(() => matchMedia("(dynamic-range: high)").matches ? "支持" : "不支持") },
        { label: "深色模式", value: safe(() => matchMedia("(prefers-color-scheme: dark)").matches ? "深色" : "浅色") },
        { label: "减少动画", value: safe(() => matchMedia("(prefers-reduced-motion: reduce)").matches ? "是" : "否") },
        { label: "减少数据", value: safe(() => matchMedia("(prefers-reduced-data: reduce)").matches ? "是" : "否") },
      ],
    },
    {
      category: "硬件信息",
      items: [
        { label: "CPU 核心数", value: safe(() => navigator.hardwareConcurrency) },
        { label: "设备内存", value: safe(() => (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : undefined, "不支持") },
        { label: "最大触控点", value: safe(() => navigator.maxTouchPoints) },
        { label: "触屏设备", value: safe(() => matchMedia("(pointer: coarse)").matches) },
      ],
    },
    {
      category: "平台与能力",
      items: [
        { label: "平台", value: safe(() => navigator.platform) },
        { label: "User Agent 平台", value: safe(() => (navigator as any).userAgentData?.platform ?? "不支持") },
        { label: "移动端", value: safe(() => (navigator as any).userAgentData?.mobile ?? "不支持") },
        { label: "WebAssembly", value: safe(() => typeof WebAssembly !== "undefined") },
        { label: "Service Worker", value: safe(() => "serviceWorker" in navigator) },
        { label: "Shared Worker", value: safe(() => typeof SharedWorker !== "undefined") },
        { label: "IndexedDB", value: safe(() => typeof indexedDB !== "undefined") },
        { label: "WebSocket", value: safe(() => typeof WebSocket !== "undefined") },
        { label: "WebRTC", value: safe(() => !!(navigator as any).mediaDevices?.getUserMedia) },
        { label: "蓝牙", value: safe(() => !!(navigator as any).bluetooth) },
        { label: "USB", value: safe(() => !!(navigator as any).usb) },
        { label: "串口", value: safe(() => !!(navigator as any).serial) },
        { label: "NFC", value: safe(() => !!(navigator as any).nfc) },
        { label: "WebXR", value: safe(() => !!(navigator as any).xr) },
        { label: "Gamepad", value: safe(() => "getGamepads" in navigator) },
        { label: "Payment Request", value: safe(() => !!(window as any).PaymentRequest) },
        { label: "Credentials", value: safe(() => !!(navigator as any).credentials) },
        { label: "屏幕唤醒锁", value: safe(() => !!(navigator as any).wakeLock) },
        { label: "文件系统", value: safe(() => !!(window as any).showOpenFilePicker) },
        { label: "剪贴板读取", value: safe(() => !!(navigator as any).clipboard?.read) },
        { label: "共享", value: safe(() => !!(navigator as any).share) },
        { label: "虚拟键盘", value: safe(() => !!(navigator as any).virtualKeyboard) },
        { label: "震动", value: safe(() => !!(navigator as any).vibrate) },
        { label: "陀螺仪", value: safe(() => !!(window as any).DeviceOrientationEvent) },
        { label: "加速度计", value: safe(() => !!(window as any).DeviceMotionEvent) },
        { label: "近距离传感器", value: safe(() => !!((window as any).UserProximityEvent || (window as any).DeviceProximityEvent)) },
      ],
    },
  ])

  const [battery, setBattery] = useState("未获取")
  const [gpu, setGpu] = useState("未获取")
  const [geo, setGeo] = useState("未获取")
  const [network, setNetwork] = useState("未获取")
  const [storage, setStorage] = useState("未获取")
  const [notif, setNotif] = useState("未获取")
  const [clipboard, setClipboard] = useState("未获取")
  const [permissions, setPermissions] = useState<InfoItem[]>([])
  const [fingerprint, setFingerprint] = useState("加载中…")
  const [fpComponents, setFpComponents] = useState<InfoItem[]>([])

  // 权限列表
  const permNames = [
    "camera", "microphone", "geolocation", "notifications",
    "clipboard-read", "clipboard-write", "accelerometer",
    "gyroscope", "magnetometer", "midi",
  ]

  const fetchAll = useCallback(async () => {
    // 指纹
    try {
      const fp = await FingerprintJS.load()
      const result = await fp.get()
      setFingerprint(result.visitorId)
      const comps: InfoItem[] = []
      for (const [key, comp] of Object.entries(result.components)) {
        const c = comp as { value?: unknown }
        if (c.value !== undefined && c.value !== null && c.value !== "") {
          comps.push({
            label: key,
            value: typeof c.value === "object" ? JSON.stringify(c.value) : String(c.value),
          })
        }
      }
      setFpComponents(comps)
    } catch {
      setFingerprint("不支持")
    }

    // 电池
    const b = await safeAsync(async () => {
      const bm = await (navigator as any).getBattery?.()
      if (!bm) return "不支持"
      return [
        `电量 ${Math.round(bm.level * 100)}%`,
        bm.charging ? "充电中" : "未充电",
        bm.chargingTime === Infinity ? "" : `充满需 ${Math.round(bm.chargingTime / 60)} 分钟`,
        bm.dischargingTime === Infinity ? "" : `续航 ${Math.round(bm.dischargingTime / 60)} 分钟`,
      ].filter(Boolean).join("，")
    })
    setBattery(b)

    // GPU
    const g = safe(() => {
      const canvas = document.createElement("canvas")
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as WebGLRenderingContext | null
      if (!gl) return "不支持"
      const dbg = gl.getExtension("WEBGL_debug_renderer_info")
      if (!dbg) return "不支持"
      const vendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)
      const renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)
      return `${vendor} — ${renderer}`
    })
    setGpu(g)

    // 地理位置
    const loc = await safeAsync(async () => {
      if (!navigator.geolocation) return "不支持"
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (±${pos.coords.accuracy.toFixed(0)}m)`),
          (err) => resolve(`权限拒绝 (${err.message})`),
          { timeout: 5000 },
        )
      })
    })
    setGeo(loc)

    // 网络
    const net = safe(() => {
      const c = (navigator as any).connection ?? (navigator as any).mozConnection ?? (navigator as any).webkitConnection
      if (!c) return "不支持"
      return [
        `类型 ${c.effectiveType ?? c.type}`,
        c.downlink ? `下行 ${c.downlink} Mbps` : "",
        c.rtt ? `RTT ${c.rtt} ms` : "",
        c.saveData ? "省流量模式" : "",
      ].filter(Boolean).join("，")
    })
    setNetwork(net)

    // 存储
    const st = await safeAsync(async () => {
      if (!navigator.storage?.estimate) return "不支持"
      const est = await navigator.storage.estimate()
      const fmt = (b?: number) => b ? `${(b / 1024 / 1024).toFixed(0)} MB` : "未知"
      return `已用 ${fmt(est.usage)} / 配额 ${fmt(est.quota)}`
    })
    setStorage(st)

    // 通知权限
    setNotif(safe(() => (window as any).Notification?.permission ?? "不支持"))

    // 剪贴板
    setClipboard(safe(() => {
      if (!navigator.clipboard) return "不支持"
      return "读取" in navigator.clipboard && "写入" in navigator.clipboard ? "读写" : "写入"
    }))

    // 各权限状态
    const perms: InfoItem[] = []
    for (const name of permNames) {
      try {
        const status = await navigator.permissions?.query({ name: name as PermissionName })
        perms.push({ label: name, value: status?.state ?? "未知" })
      } catch {
        perms.push({ label: name, value: "不支持" })
      }
    }
    setPermissions(perms)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">设备信息</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            获取设备和浏览器信息
          </p>
        </div>
        <Button variant="outline" onClick={fetchAll}>
          刷新
        </Button>
      </div>

      {/* 浏览器指纹 */}
      <Card>
        <CardHeader>
          <CardTitle>浏览器指纹</CardTitle>
          <CardDescription>FingerprintJS 生成的唯一标识符与原始数据</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-3 rounded-sm border border-border px-3 py-2.5">
            <span className="w-28 shrink-0 text-sm font-medium text-muted-foreground">访客 ID</span>
            <code className="min-w-0 flex-1 break-all text-sm">{fingerprint}</code>
          </div>
          {fpComponents.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground pt-2">
                指纹组件数据（参与计算的原始值，共 {fpComponents.length} 项）
              </p>
              {fpComponents.map((item) => {
                const isLong = item.value.length > 200
                return (
                  <ExpandableRow key={item.label} label={item.label} value={item.value} isLong={isLong} />
                )
              })}
            </>
          )}
        </CardContent>
      </Card>

      {/* 动态信息 */}
      <Card>
        <CardHeader>
          <CardTitle>动态信息</CardTitle>
          <CardDescription>需要权限或异步获取的信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: "电池", value: battery },
              { label: "GPU 渲染器", value: gpu },
              { label: "地理位置", value: geo },
              { label: "网络信息", value: network },
              { label: "存储配额", value: storage },
              { label: "通知权限", value: notif },
              { label: "剪贴板", value: clipboard },
            ].map((item) => (
              <div key={item.label} className="flex gap-3 rounded-sm border border-border px-3 py-2.5">
                <span className="w-28 shrink-0 text-sm font-medium text-muted-foreground">{item.label}</span>
                <span className="min-w-0 flex-1 break-all text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 权限状态 */}
      {permissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>权限状态</CardTitle>
            <CardDescription>浏览器各 API 权限授权情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {permissions.map((p) => (
                <div key={p.label} className="flex items-center gap-2 rounded-sm border border-border px-3 py-2">
                  <span className="text-sm">{p.label}</span>
                  <span className={`ml-auto text-xs ${
                    p.value === "granted" ? "text-green-600" :
                    p.value === "denied" ? "text-destructive" :
                    "text-muted-foreground"
                  }`}>
                    {p.value === "granted" ? "已授权" :
                     p.value === "denied" ? "已拒绝" :
                     p.value === "prompt" ? "待询问" : p.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 静态信息 */}
      {staticInfo.map((section) => (
        <Card key={section.category}>
          <CardHeader>
            <CardTitle>{section.category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {section.items.map((item) => (
                <div key={item.label} className="flex gap-3 rounded-sm border border-border px-3 py-2.5">
                  <span className="w-28 shrink-0 text-sm font-medium text-muted-foreground">{item.label}</span>
                  <span className="min-w-0 flex-1 break-all text-sm">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
