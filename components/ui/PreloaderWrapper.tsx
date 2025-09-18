'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, ReactNode } from 'react'
import { Preloader } from './Preloader'

interface PreloaderWrapperProps {
  children: ReactNode
  preloaderDuration?: number
}

export function PreloaderWrapper({ 
  children, 
  preloaderDuration = 3000 
}: PreloaderWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [showPreloader, setShowPreloader] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  const handlePreloaderComplete = () => {
    setIsExiting(true)
    // Delay to ensure smooth transition
    setTimeout(() => {
      setShowPreloader(false)
      setIsLoading(false)
    }, 200)
  }

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      handlePreloaderComplete()
    }, preloaderDuration)

    return () => clearTimeout(timer)
  }, [preloaderDuration])

  return (
    <>
      {/* Preloader */}
      <AnimatePresence>
        {showPreloader && (
          <Preloader
            onComplete={handlePreloaderComplete}
            duration={preloaderDuration}
          />
        )}
      </AnimatePresence>

      {/* Main App Content */}
      <AnimatePresence mode="wait">
        {!isLoading && (
          <motion.div
            key="app-content"
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -30 }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: 0.1
            }}
            className="relative z-10"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
