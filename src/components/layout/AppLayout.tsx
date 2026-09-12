import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { gsap } from 'gsap'
import { Navbar } from '#/components/fragment/Navbar'
import { Sidebar } from '#/components/fragment/Sidebar'
import type { SidebarItem } from '#/components/fragment/Sidebar'
import { cn } from '#/lib/cn'
import { getCurrentUser } from '#/features/auth/services/authService'

export type AppLayoutProps = {
  children: ReactNode
  sidebarItems: SidebarItem[]
  activeItem?: string
  workspaceId?: string
  onSidebarSelect?: (key: string, item: SidebarItem) => void
  onSidebarAdd?: (item: SidebarItem, relation?: string, label?: string) => void
  onSidebarEdit?: (item: SidebarItem) => void
  onSidebarDelete?: (item: SidebarItem) => void
}

export function AppLayout({
  children,
  sidebarItems,
  activeItem,
  workspaceId,
  onSidebarSelect,
  onSidebarAdd,
  onSidebarEdit,
  onSidebarDelete,
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileSidebarMounted, setMobileSidebarMounted] = useState(false)
  const [userName, setUserName] = useState<string>()
  const [userEmail, setUserEmail] = useState<string>()
  const [userLoaded, setUserLoaded] = useState(false)
  const overlayRef = useRef<HTMLButtonElement>(null)
  const closeTimerRef = useRef<number | undefined>(undefined)

  function toggleMobileSidebar() {
    if (mobileSidebarOpen) {
      setMobileSidebarOpen(false)
      closeTimerRef.current = window.setTimeout(() => {
        setMobileSidebarMounted(false)
      }, 300)
      return
    }

    window.clearTimeout(closeTimerRef.current)
    setMobileSidebarMounted(true)
    setMobileSidebarOpen(true)
  }

  useEffect(() => {
    let cancelled = false

    getCurrentUser()
      .then((data) => {
        if (cancelled) return
        setUserName(data.name)
        setUserEmail(data.email)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setUserLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!mobileSidebarMounted || !overlayRef.current) return

    const animation = mobileSidebarOpen
      ? gsap.fromTo(
          overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, ease: 'power2.out' },
        )
      : gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.25,
          ease: 'power2.in',
        })

    return () => {
      animation.kill()
    }
  }, [mobileSidebarMounted, mobileSidebarOpen])

  return (
    <main className="min-h-screen bg-background text-on-background">
      {!userLoaded ? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      ) : (
        <>
          <Sidebar
            items={sidebarItems}
            activeItem={activeItem}
            workspaceId={workspaceId}
            collapsed={sidebarCollapsed}
            onSelect={onSidebarSelect}
            onAdd={onSidebarAdd}
            onEdit={onSidebarEdit}
            onDelete={onSidebarDelete}
            onCollapse={setSidebarCollapsed}
            mobileOpen={mobileSidebarOpen}
            mobileMounted={mobileSidebarMounted}
            className={cn(
              'fixed inset-y-0 left-0 z-50 hidden h-screen xl:flex',
              mobileSidebarMounted &&
                'top-12 bottom-0 flex h-[calc(100vh-3rem)] w-[min(85vw,256px)] shadow-xl xl:hidden',
            )}
          />
          {mobileSidebarMounted ? (
            <button
              ref={overlayRef}
              type="button"
              aria-label="Close navigation"
              className="fixed inset-0 top-12 z-40 bg-on-background/20 xl:hidden"
              onClick={toggleMobileSidebar}
            />
          ) : null}
          <div
            className={cn(
              'min-h-screen pt-12 transition-[padding-left] duration-300',
              sidebarCollapsed ? 'xl:pl-16' : 'xl:pl-64',
            )}
          >
            <div
              className={cn(
                'fixed left-0 right-0 top-0 z-[60] transition-[left] duration-300',
                sidebarCollapsed ? 'xl:left-[63px]' : 'xl:left-[255px]',
              )}
            >
              <Navbar
                userName={userName}
                userEmail={userEmail}
                onMenuClick={toggleMobileSidebar}
              />
            </div>
            <section className="min-w-0">{children}</section>
          </div>
        </>
      )}
    </main>
  )
}
