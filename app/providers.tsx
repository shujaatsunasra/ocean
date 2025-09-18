'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface AppContextType {
  mode: 'explorer' | 'power'
  setMode: (mode: 'explorer' | 'power') => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'explorer' | 'power'>('explorer')
  const [isLoading, setIsLoading] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    // Simulate loading time for preloader
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AppContext.Provider value={{
      mode,
      setMode,
      isLoading,
      setIsLoading,
      theme,
      setTheme
    }}>
      {children}
    </AppContext.Provider>
  )
}
