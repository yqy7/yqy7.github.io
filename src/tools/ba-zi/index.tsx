import { useEffect, useRef } from "react"

const SDK_URL = "https://lf-cdn.coze.cn/obj/unpkg/flow-platform/builder-web-sdk/0.1.1-beta.1/dist/umd/index.js"

const COZE_CONFIG = {
  token: "pat_WzprmjlJxhOX8ikcPuoRnyoabZaKw8nKg7E3W5nFKLnTOeh4lPsXFrPvcPQCpsCl",
  appId: "7667390253694943266",
  container: "#coze-app",
  userInfo: {
    id: "",
    url: "",
    nickname: "User",
  },
}

declare global {
  interface Window {
    CozeWebSDK?: {
      AppWebSDK: new (config: typeof COZE_CONFIG) => void
    }
  }
}

export default function BaZiPage() {
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const script = document.createElement("script")
    script.src = SDK_URL
    document.head.appendChild(script)

    script.onload = () => {
      if (window.CozeWebSDK) {
        new window.CozeWebSDK.AppWebSDK(COZE_CONFIG)
      }
    }

    return () => {
      // 不卸载 script，保持 SDK 实例
    }
  }, [])

  return (
    <div id="coze-app" className="h-[calc(100vh-3.5rem)] w-full" />
  )
}
