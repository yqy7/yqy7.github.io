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
