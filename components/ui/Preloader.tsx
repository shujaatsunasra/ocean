'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface PreloaderProps {
  onComplete?: () => void
  duration?: number
}

export function Preloader({ onComplete, duration = 3000 }: PreloaderProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const [animationStep, setAnimationStep] = useState<'hello' | 'tagline'>('hello')

  // Animation timeline constants
  const HELLO_FADE_DURATION = 500 // 0.8s for Hello fade in
  const HELLO_HOLD_DURATION = 320 // 1.2s hold for Hello
  const CROSSFADE_DURATION = 1800 // 1s crossfade to tagline

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = []
    let currentTime = 0

    // Step 1: Fade in "Hello" (0.8s)
    timeouts.push(setTimeout(() => {
      setAnimationStep('hello')
    }, currentTime))
    currentTime += HELLO_FADE_DURATION

    // Hold "Hello" (1.2s)
    currentTime += HELLO_HOLD_DURATION

    // Step 2: Crossfade to tagline (1s)
    timeouts.push(setTimeout(() => {
      setAnimationStep('tagline')
    }, currentTime))
    currentTime += CROSSFADE_DURATION

    // Complete after tagline
    timeouts.push(setTimeout(() => {
      handleComplete()
    }, currentTime))

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [])

  const handleComplete = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, 500) // Smooth exit transition
  }

  if (!isVisible) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ 
          opacity: 0,
          scale: 1.05,
          y: -20
        }}
        transition={{ 
          duration: 0.8, 
          ease: [0.25, 0.46, 0.45, 0.94] 
        }}
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      >
        {/* Black background with gradient overlay */}
        <motion.div 
          className="absolute inset-0 bg-black"
          animate={{
            opacity: isExiting ? 0 : 1
          }}
          transition={{
            duration: 0.8,
            ease: 'easeInOut'
          }}
        />
        
        {/* Professional gradient overlay */}
        <motion.div 
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%, #000000 100%)'
          }}
          animate={{
            opacity: isExiting ? 0 : 0.2
          }}
          transition={{
            duration: 0.8,
            ease: 'easeInOut'
          }}
        />

        {/* Centered text content */}
        <div className="relative h-20 flex items-center justify-center">
          {/* Hello text */}
          <AnimatePresence mode="wait">
            {animationStep === 'hello' && (
              <motion.h1
                key="hello"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: HELLO_FADE_DURATION / 1000,
                  ease: 'easeInOut'
                }}
                className="text-3xl font-light text-white font-raleway tracking-wide absolute"
                style={{
                  textShadow: '0 2px 20px rgba(255, 255, 255, 0.3)',
                  fontWeight: 300,
                }}
              >
                Hello
              </motion.h1>
            )}
          </AnimatePresence>

          {/* Emotional tagline */}
          <AnimatePresence mode="wait">
            {animationStep === 'tagline' && (
              <motion.div
                key="tagline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: CROSSFADE_DURATION / 1000,
                  ease: 'easeInOut'
                }}
                className="text-center absolute"
              >
                <span className="text-2xl font-light text-white font-raleway tracking-wide whitespace-nowrap"
                      style={{
                        textShadow: '0 2px 20px rgba(255, 255, 255, 0.3)',
                        fontWeight: 300,
                      }}>
                  Explore, visualize, discover
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook for managing preloader state
export function usePreloader() {
  const [isLoading, setIsLoading] = useState(true)
  const [showPreloader, setShowPreloader] = useState(true)

  const handlePreloaderComplete = () => {
    setShowPreloader(false)
    // Small delay to ensure smooth transition
    setTimeout(() => {
      setIsLoading(false)
    }, 100)
  }

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      handlePreloaderComplete()
    }, 2000) // 3 seconds default

    return () => clearTimeout(timer)
  }, [])

  return {
    isLoading,
    showPreloader,
    handlePreloaderComplete,
  }
}
