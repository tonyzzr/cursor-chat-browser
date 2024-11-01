import Link from "next/link"
import { Button } from "./ui/button"
import { ThemeToggle } from "./theme-toggle"
import { Settings } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

export function Navbar() {
  return (
    <nav className="border-b">
      <div className="container mx-auto flex items-center justify-between h-16">
        <Link href="/" className="font-bold text-xl">
          Cursor Chat Browser
        </Link>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/">Chat Logs</Link>
          </Button>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/config" aria-label="Configuration">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Configuration
            </TooltipContent>
          </Tooltip>

          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
} 