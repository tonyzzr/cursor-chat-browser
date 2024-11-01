import Link from "next/link"
import { Button } from "./ui/button"
import { ThemeToggle } from "./theme-toggle"

export function Navbar() {
  return (
    <nav className="border-b">
      <div className="container mx-auto flex items-center justify-between h-16">
        <Link href="/" className="font-bold text-xl">
          Cursor Chat Browser
        </Link>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/">Workspaces</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/config">Configuration</Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
} 