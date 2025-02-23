import './globals.css'
import { SidebarNav } from '@/components/sidebar-nav'
import { SidebarProvider } from '@/components/sidebar-context'
import { MobileBackdrop } from '@/components/mobile-backdrop'
import { MobileHeader } from '@/components/mobile-header'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="relative min-h-screen bg-gray-50">
          <SidebarProvider>
            <MobileBackdrop />
            <MobileHeader />
            <SidebarNav />
            <main className="transition-all duration-300 min-h-screen lg:ml-[var(--sidebar-width,256px)] ml-0 pt-14 lg:pt-0">
              {children}
            </main>
          </SidebarProvider>
        </div>
      </body>
    </html>
  )
}
