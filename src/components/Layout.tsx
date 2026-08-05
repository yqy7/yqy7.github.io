import { useEffect } from "react"
import { Outlet, useLocation } from "react-router"
import { Navbar } from "@/components/Navbar"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function Layout() {
  const location = useLocation()

  useEffect(() => {
    window.gtag?.("config", "G-BE93K4DNXC", { page_path: location.pathname })
  }, [location])

  return (
    <>
      <Navbar />
      <main className="pt-14">
        <Outlet />
      </main>
    </>
  )
}
