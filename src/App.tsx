import { NavLink } from "react-router"
import favicon from "./assets/favicon.png"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import "./App.css"

const tools = [
  {
    to: "/tools/encode-decode",
    title: "编解码",
    desc: "MD5、SHA 系列哈希计算，Base64 / URL / Hex 编解码",
    icon: "🔐",
  },
  {
    to: "/tools/qrcode",
    title: "二维码生成器",
    desc: "在线生成二维码，支持自定义尺寸、颜色和纠错等级",
    icon: "📱",
  },
  {
    to: "/tools/opencc",
    title: "简繁转换",
    desc: "简体中文与繁体中文（台湾、香港）相互转换",
    icon: "📝",
  },
  {
    to: "/tools/pinyin",
    title: "汉字转拼音",
    desc: "支持带声调、无声调、数字声调、拼音首字母等模式",
    icon: "🔤",
  },
  {
    to: "/tools/password",
    title: "密码生成器",
    desc: "加密安全随机密码生成，支持自定义字符集和前后缀",
    icon: "🔑",
  },
  {
    to: "/tools/random-number",
    title: "随机数生成器",
    desc: "指定范围生成随机数，支持去重、排序、补零、自定义分隔符",
    icon: "🎲",
  },
  {
    to: "/tools/base-convert",
    title: "进制转换",
    desc: "2/8/10/12/16 进制实时互转，任意输入框输入即可同步",
    icon: "🔢",
  },
  {
    to: "/tools/uuid",
    title: "UUID 生成器",
    desc: "生成 UUID v4，支持自定义数量、去掉连字符、大小写切换",
    icon: "🆔",
  },
  {
    to: "/tools/morse",
    title: "摩斯电码",
    desc: "文字与摩斯电码互转，支持中文，可自定义长短符号",
    icon: "📡",
  },
  {
    to: "/tools/name-case",
    title: "命名转换",
    desc: "camelCase / PascalCase / snake_case / kebab-case 等命名风格互转",
    icon: "✍️",
  },
  {
    to: "/tools/color-convert",
    title: "颜色转换",
    desc: "HEX / RGB / HSL / HSV 颜色格式互转，支持透明度",
    icon: "🎨",
  },
  {
    to: "/tools/crontab",
    title: "Crontab 计算",
    desc: "计算 cron 表达式未来 N 次执行时间，支持 Linux / Spring / Quartz 格式",
    icon: "⏰",
  },
  {
    to: "/tools/json-yaml",
    title: "JSON ⇄ YAML",
    desc: "JSON 与 YAML 格式相互转换，支持复杂嵌套结构",
    icon: "🔄",
  },
  {
    to: "/tools/chinese-number",
    title: "中文数字转换",
    desc: "阿拉伯数字与中文数字互转，支持简体、繁体、大小写",
    icon: "🀄",
  },
  {
    to: "/tools/fancy-text",
    title: "花体英文转换",
    desc: "将普通文字转为 19 种 Unicode 花体风格，支持装饰线",
    icon: "💫",
  },
  {
    to: "/tools/tts",
    title: "文字转语音",
    desc: "浏览器内置 TTS 引擎朗读文字，支持多语音和语速调节",
    icon: "🔊",
  },
  {
    to: "/tools/device-info",
    title: "设备信息",
    desc: "查看浏览器和系统信息，UA、屏幕、GPU、电池、权限等",
    icon: "🖥",
  },
  {
    to: "/tools/unicode",
    title: "Unicode 编解码",
    desc: "文字与 \\u、&#x、U+、%XX 等 Unicode 转义序列互转",
    icon: "🔣",
  },
  {
    to: "/tools/zero-width",
    title: "文字隐写",
    desc: "用零宽字符在普通文本中隐藏秘密，肉眼不可见",
    icon: "👻",
  },
  {
    to: "/tools/animal-speak",
    title: "兽言兽语",
    desc: "用自定义字符对文字编码，像动物的语言一样",
    icon: "🐾",
  },
]

function App() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Hero */}
      <div className="mb-12 text-center">
        <img
          src={favicon}
          className="mx-auto size-20 object-contain"
          alt="logo"
        />
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          YQY7 工具箱
        </h1>
        <p className="mt-2 text-muted-foreground">实用的在线小工具集合</p>
      </div>

      {/* 工具入口卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <NavLink key={tool.to} to={tool.to}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="text-2xl">{tool.icon}</div>
                <CardTitle className="text-lg">{tool.title}</CardTitle>
                <CardDescription>{tool.desc}</CardDescription>
              </CardHeader>
            </Card>
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export default App
