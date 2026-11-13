"use client"

import * as React from "react"

export interface User {
  uid: string
  email: string
  displayName: string
}

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  createdAt: string
  lastLogin: string
  streak: number
  stats: {
    totalTranslations: number
    lessonsCompleted: number
  }
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  isFallback: boolean
  login: (email: string, password: string) => Promise<User>
  register: (email: string, password: string, displayName: string) => Promise<User>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  getToken: () => Promise<string | null>
  updateProfileStats: (translationsDelta: number, lessonsDelta: number) => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

function generateUid(email: string): string {
  try {
    const clean = btoa(email.toLowerCase().trim()).replace(/[^a-zA-Z0-9]/g, "").substring(0, 12)
    return `user_${clean}`
  } catch {
    return `user_${Date.now().toString(36)}`
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null)
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Sync profile locally in localStorage and optionally to local backend SQLite
  const syncProfile = async (
    uid: string, 
    email: string, 
    displayName: string, 
    isNew: boolean = false
  ): Promise<UserProfile> => {
    const timestampStr = new Date().toISOString()
    const storageKey = `sv_user_${uid}`
    const stored = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null
    
    let profile: UserProfile

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as UserProfile
        parsed.lastLogin = timestampStr
        if (displayName && displayName !== parsed.displayName) {
          parsed.displayName = displayName
        }
        profile = parsed
      } catch {
        profile = {
          uid,
          email,
          displayName: displayName || email.split("@")[0] || "User",
          createdAt: timestampStr,
          lastLogin: timestampStr,
          streak: 1,
          stats: { totalTranslations: 0, lessonsCompleted: 0 }
        }
      }
    } else {
      profile = {
        uid,
        email,
        displayName: displayName || email.split("@")[0] || "User",
        createdAt: timestampStr,
        lastLogin: timestampStr,
        streak: 1,
        stats: { totalTranslations: 0, lessonsCompleted: 0 }
      }
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(profile))
    }
    setUserProfile(profile)

    // Sync to local backend SQLite if reachable
    try {
      await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer local_session_${uid}`,
        },
        body: JSON.stringify({
          email: profile.email,
          displayName: profile.displayName,
          streak: profile.streak,
          stats: profile.stats,
        }),
      })
    } catch {
      // Local backend offline or unreachable; localStorage is authoritative
    }

    return profile
  }

  // Load existing session on mount
  React.useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false)
      return
    }

    try {
      const savedUser = localStorage.getItem("sv_logged_user")
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser) as User
        setUser(parsedUser)
        syncProfile(parsedUser.uid, parsedUser.email, parsedUser.displayName)
      }
    } catch (e) {
      console.warn("Failed to load local user session:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, _password: string): Promise<User> => {
    setLoading(true)
    try {
      const cleanEmail = email.trim().toLowerCase()
      const uid = generateUid(cleanEmail)
      
      // Look up existing display name if user was registered before
      let displayName = cleanEmail.split("@")[0] || "User"
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(`sv_user_${uid}`)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            if (parsed.displayName) displayName = parsed.displayName
          } catch {
            // ignore
          }
        }
      }

      const userObj: User = { uid, email: cleanEmail, displayName }
      if (typeof window !== "undefined") {
        localStorage.setItem("sv_logged_user", JSON.stringify(userObj))
      }
      setUser(userObj)
      await syncProfile(uid, cleanEmail, displayName)
      return userObj
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, _password: string, displayName: string): Promise<User> => {
    setLoading(true)
    try {
      const cleanEmail = email.trim().toLowerCase()
      const cleanName = displayName.trim() || cleanEmail.split("@")[0] || "User"
      const uid = generateUid(cleanEmail)
      const userObj: User = { uid, email: cleanEmail, displayName: cleanName }

      if (typeof window !== "undefined") {
        localStorage.setItem("sv_logged_user", JSON.stringify(userObj))
      }
      setUser(userObj)
      await syncProfile(uid, cleanEmail, cleanName, true)
      return userObj
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setLoading(true)
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("sv_logged_user")
      }
      setUser(null)
      setUserProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string): Promise<void> => {
    console.info(`[SilentVoice Local Auth] Password reset requested for: ${email}`)
    return Promise.resolve()
  }

  const getToken = async (): Promise<string | null> => {
    if (!user) return null
    return `local_session_${user.uid}`
  }

  const updateProfileStats = async (translationsDelta: number, lessonsDelta: number): Promise<void> => {
    if (!userProfile) return

    const updatedProfile: UserProfile = {
      ...userProfile,
      stats: {
        totalTranslations: Math.max(0, userProfile.stats.totalTranslations + translationsDelta),
        lessonsCompleted: Math.max(0, userProfile.stats.lessonsCompleted + lessonsDelta),
      },
    }

    setUserProfile(updatedProfile)

    if (typeof window !== "undefined") {
      localStorage.setItem(`sv_user_${userProfile.uid}`, JSON.stringify(updatedProfile))
    }

    try {
      await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer local_session_${userProfile.uid}`,
        },
        body: JSON.stringify({
          email: updatedProfile.email,
          displayName: updatedProfile.displayName,
          streak: updatedProfile.streak,
          stats: updatedProfile.stats,
        }),
      })
    } catch {
      // Offline fallback: saved to localStorage
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isFallback: true, // Local offline-first mode active
        login,
        register,
        logout,
        resetPassword,
        getToken,
        updateProfileStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
