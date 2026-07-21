import { Outlet } from "react-router"
import { Navbar } from "@/components/Navbar"

export function Layout() {
  return (
    <>
      <Navbar />
      <main className="pt-14">
        <Outlet />
      </main>
    </>
  )
}
