import './globals.css'
import { SidebarNav } from '@/components/sidebar-nav'
import { SidebarProvider } from '@/components/sidebar-context'

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
            <SidebarNav />
            <main className="transition-all duration-300 min-h-screen" style={{ marginLeft: 'var(--sidebar-width, 256px)' }}>
            {children}
            </main>
          </SidebarProvider>
        </div>
      </body>
    </html>
  )
}
