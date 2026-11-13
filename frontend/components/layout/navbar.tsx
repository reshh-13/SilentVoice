"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { Menu, X, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"

const navItems = [
  { name: "Home", href: "/" },
  { name: "Translate", href: "/translate" },
  { name: "Guide", href: "/guide" },
  { name: "Practice", href: "/practice" },
]

export const Navbar = () => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const { user, userProfile, logout } = useAuth()

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsOpen(false)
    setDropdownOpen(false)
  }, [pathname])

  return (
    <header className="fixed top-6 left-0 right-0 z-50 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <nav className="glass-navbar rounded-full px-6 py-3.5 flex items-center justify-between relative transition-all duration-300">
        {/* Logo/Identity */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold shadow-xs">
            <Volume2 className="h-4.5 w-4.5" />
          </div>
          <span className="font-heading font-semibold text-lg tracking-tight text-foreground transition-colors group-hover:text-accent">
            silent <span className="text-primary font-normal">voice</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 hover:text-foreground/80 text-foreground/60"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className={cn("relative z-10", isActive && "text-accent font-semibold")}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2 relative">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-foreground/5 bg-foreground/2 hover:bg-foreground/5 transition-all text-sm font-medium"
              >
                <div className="w-7 h-7 rounded-full bg-primary/20 text-accent border border-primary/30 flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                  {userProfile?.displayName ? userProfile.displayName.substring(0, 2).toUpperCase() : user.email?.substring(0, 2).toUpperCase() || "U"}
                </div>
                <span className="text-foreground/75 truncate max-w-[120px]">
                  {userProfile?.displayName || user.email?.split("@")[0]}
                </span>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    {/* Click outside overlay */}
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 glass-card border border-foreground/5 rounded-2xl shadow-xl p-2 z-50 flex flex-col gap-1 text-xs"
                    >
                      <div className="px-3 py-2 border-b border-foreground/5 flex flex-col gap-0.5">
                        <span className="font-bold text-foreground truncate">{userProfile?.displayName || "User"}</span>
                        <span className="text-[10px] text-foreground/45 truncate">{userProfile?.email}</span>
                      </div>
                      <div className="px-3 py-1.5 text-[10px] text-primary font-bold uppercase tracking-wider font-mono">
                        Streak: 🔥 {userProfile?.streak || 1} days
                      </div>
                      <button
                        onClick={() => {
                          setDropdownOpen(false)
                          alert(`Profile details:\nName: ${userProfile?.displayName}\nEmail: ${userProfile?.email}\nCreated: ${userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}\nTotal translations: ${userProfile?.stats.totalTranslations}`)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-foreground/5 rounded-xl transition-colors font-medium text-foreground/75"
                      >
                        Profile & Stats
                      </button>
                      <button
                        onClick={() => {
                          setDropdownOpen(false)
                          alert("Settings are configured locally. Dark mode toggle is mapped in globals.css variables.")
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-foreground/5 rounded-xl transition-colors font-medium text-foreground/75"
                      >
                        Settings
                      </button>
                      <div className="h-px bg-foreground/5 my-1" />
                      <button
                        onClick={async () => {
                          setDropdownOpen(false)
                          await logout()
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors font-semibold"
                      >
                        Log Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="rounded-full text-foreground/75 text-xs font-semibold px-4 h-9">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="rounded-full bg-primary hover:bg-accent text-primary-foreground shadow-xs px-5 h-9 text-xs font-semibold">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-1.5 rounded-full text-foreground/65 hover:text-foreground hover:bg-foreground/5 transition-all"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-full left-0 right-0 mt-3 glass-card rounded-2xl p-5 flex flex-col gap-3 shadow-xl md:hidden"
            >
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary/10 text-accent font-semibold"
                        : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
              <div className="h-px bg-foreground/5 my-1" />
              <div className="flex flex-col gap-2">
                {user ? (
                  <div className="flex flex-col gap-2.5">
                    <div className="px-4 py-2 bg-foreground/3 rounded-xl border border-foreground/5 flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-xs text-foreground truncate">{userProfile?.displayName || "User"}</span>
                        <span className="text-[10px] text-foreground/45 truncate">{userProfile?.email}</span>
                      </div>
                      <span className="text-[10px] bg-primary/20 text-accent border border-primary/30 px-2 py-0.5 rounded-full font-bold">
                        🔥 {userProfile?.streak || 1} Days
                      </span>
                    </div>
                    <Button 
                      onClick={async () => {
                        setIsOpen(false)
                        await logout()
                      }}
                      className="rounded-xl w-full bg-red-500 hover:bg-red-600 text-white font-semibold text-center text-xs h-9.5"
                    >
                      Log Out
                    </Button>
                  </div>
                ) : (
                  <>
                    <Link href="/login" className="w-full">
                      <Button variant="outline" size="sm" className="rounded-xl w-full text-center h-9 text-xs font-semibold">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register" className="w-full">
                      <Button size="sm" className="rounded-xl w-full bg-primary hover:bg-accent text-primary-foreground text-center h-9 text-xs font-semibold">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}
