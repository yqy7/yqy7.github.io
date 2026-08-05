import { NavLink } from "react-router"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

const toolsLinks = [
  { to: "/tools/encode-decode", label: "编解码" },
  { to: "/tools/unicode", label: "Unicode 编解码" },
  { to: "/tools/base-convert", label: "进制转换" },
  { to: "/tools/morse", label: "摩斯电码" },
  { to: "/tools/animal-speak", label: "兽言兽语" },
  { to: "/tools/martian-text", label: "火星文转换" },
  { to: "/tools/lucky-wheel", label: "转盘随机选" },
  { to: "/tools/random-name", label: "随机名称" },
  { to: "/tools/identity", label: "虚拟身份" },
  { to: "/tools/barcode", label: "条形码" },
  { to: "/tools/ocr", label: "图片文字识别" },
  { to: "/tools/sql-formatter", label: "SQL 格式化" },
  { to: "/tools/color-extractor", label: "图片取色" },
  { to: "/tools/bg-remove", label: "图片去背景" },

  { to: "/tools/qrcode-scanner", label: "二维码识别" },
  { to: "/tools/pixel-art", label: "图片像素画" },
  { to: "/tools/chinese-color", label: "中国传统颜色" },
  { to: "/tools/watermark", label: "图片加水印" },
  { to: "/tools/opencc", label: "简繁转换" },
  { to: "/tools/pinyin", label: "汉字转拼音" },
  { to: "/tools/chinese-number", label: "中文数字" },
  { to: "/tools/fancy-text", label: "花体英文" },
  { to: "/tools/name-case", label: "命名转换" },
  { to: "/tools/color-convert", label: "颜色转换" },
  { to: "/tools/json-formatter", label: "JSON 格式化" },
  { to: "/tools/json-yaml", label: "JSON ⇄ YAML" },
  { to: "/tools/password", label: "密码生成器" },
  { to: "/tools/random-number", label: "随机数生成" },
  { to: "/tools/uuid", label: "UUID 生成" },
  { to: "/tools/text-diff", label: "文本对比" },
  { to: "/tools/word-count", label: "字数统计" },
  { to: "/tools/zero-width", label: "文字隐写" },
  { to: "/tools/qrcode", label: "二维码" },
  { to: "/tools/tts", label: "文字转语音" },
  { to: "/tools/crontab", label: "Crontab 计算" },
  { to: "/tools/device-info", label: "设备信息" },
]

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>GitHub</title>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.604-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex h-14 items-center px-4">
        <NavLink to="/" className="text-sm font-semibold tracking-tight">
          YQY7
        </NavLink>

        <NavigationMenu className="ml-4">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                render={(props) => (
                  <NavLink
                    {...props}
                    to="/"
                    className={({ isActive }) =>
                      cn(
                        navigationMenuTriggerStyle(),
                        isActive && "bg-muted",
                      )
                    }
                  >
                    首页
                  </NavLink>
                )}
              />
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>小工具</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-40 p-1">
                  {toolsLinks.map((link) => (
                    <NavigationMenuLink
                      key={link.to}
                      render={(props) => (
                        <NavLink
                          {...props}
                          to={link.to}
                          className={({ isActive }) =>
                            cn(
                              "block rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted",
                              isActive && "bg-muted/50",
                            )
                          }
                        >
                          {link.label}
                        </NavLink>
                      )}
                    />
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                render={() => (
                  <a
                    href="https://github.com/yqy7/myblog/"
                    target="_blank"
                    className={cn(
                        navigationMenuTriggerStyle(),
                    )}
                  >
                    博客
                  </a>
                )}
              />
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                render={() => (
                  <a
                    href="https://github.com/yqy7"
                    target="_blank"
                    className={cn(
                        navigationMenuTriggerStyle(),
                    )}
                  >
                    关于
                  </a>
                )}
              />
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <a
          href="https://github.com/yqy7/yqy7.github.io"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 p-2 transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <GitHubIcon className="size-4" />
          <span className="text-sm font-medium">GitHub</span>
        </a>
      </div>
    </header>
  )
}
