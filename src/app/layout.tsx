import { Inter } from "next/font/google"
import "./globals.css"
import "../styles/prism-theme.css"
import { Navbar } from "@/components/navbar"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="dark">
          <Navbar />
          <main className="container mx-auto py-4">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
} 